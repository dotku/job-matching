import type { Page } from "playwright";

import { answerQuestion } from "../llm.js";

import type { PortalAdapter, SubmitContext, SubmitResult } from "./types.js";

/**
 * Lever public apply pages:
 *   https://jobs.lever.co/{company}/{posting_id}            (description)
 *   https://jobs.lever.co/{company}/{posting_id}/apply      (form)
 * We always navigate to the /apply form — adding it if missing.
 */
const LEVER_HOST_PATTERN = /(?:^|\/\/)jobs\.lever\.co\//i;

const NAV_TIMEOUT = 30_000;
const FORM_READY_TIMEOUT = 15_000;
const UPLOAD_PARSE_WAIT = 3_000;
const SUBMIT_RESULT_TIMEOUT = 30_000;
const ANSWER_HARD_MAX = 500;

const KNOWN_FIELD_FRAGMENTS = [
  "name",
  "email",
  "phone",
  "resume",
  "linkedin",
  "urls[linkedin]",
  "urls[github]",
  "urls[portfolio]",
  "urls[other]",
  "org",
  "location",
];

interface DetectedField {
  selector: string;
  tag: "INPUT" | "TEXTAREA";
  label: string;
  maxLength: number | null;
}

async function fillFirst(
  page: Page,
  selectors: string[],
  value: string,
): Promise<boolean> {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();

    if ((await loc.count()) === 0) continue;
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click().catch(() => null);
    await loc.fill("");
    await loc.pressSequentially(value, { delay: 8 });

    return true;
  }

  return false;
}

async function detectSuccess(page: Page): Promise<string | null> {
  const url = page.url();

  if (/thanks|confirmation|success|applied/i.test(url)) return url;

  const successLoc = page.locator("body").filter({
    hasText:
      /thanks? for applying|application (?:was )?(?:successfully )?(?:submitted|received)|we(?:'| ha)ve received your application/i,
  });

  if ((await successLoc.count()) > 0) {
    const text = await successLoc.first().innerText().catch(() => "");

    return text.slice(0, 200).trim() || "Success text detected";
  }

  return null;
}

async function collectErrors(page: Page): Promise<string | null> {
  const selectors = [
    ".form-field-error",
    "[class*='error' i]:not(script):not(style)",
    "[role='alert']",
  ];
  const seen = new Set<string>();
  const texts: string[] = [];

  for (const sel of selectors) {
    const locs = page.locator(sel);
    const n = Math.min(await locs.count(), 10);

    for (let i = 0; i < n; i++) {
      const t = (await locs.nth(i).innerText().catch(() => "")).trim();

      if (!t || seen.has(t)) continue;
      seen.add(t);
      texts.push(t);
    }
    if (texts.length >= 3) break;
  }

  return texts.length ? texts.slice(0, 3).join(" | ") : null;
}

async function detectCustomRequiredFields(
  page: Page,
): Promise<DetectedField[]> {
  return page.evaluate((knownFragments) => {
    function labelFor(el: HTMLElement): string {
      if (el.id) {
        const explicit = document.querySelector(`label[for="${el.id}"]`);

        if (explicit?.textContent) return explicit.textContent.trim();
      }
      let cur: HTMLElement | null = el;

      while (cur && cur !== document.body) {
        if (cur.tagName === "LABEL" && cur.textContent)
          return cur.textContent.trim();
        cur = cur.parentElement;
      }
      const aria = el.getAttribute("aria-label");

      if (aria) return aria.trim();

      // Lever cards wrap question text in a sibling .application-question
      const card = el.closest(".application-question, .application-additional");

      if (card) {
        const q = card.querySelector(".text, label, .application-label");

        if (q?.textContent) return q.textContent.trim();
      }
      const placeholder = el.getAttribute("placeholder");

      if (placeholder) return placeholder.trim();

      return "";
    }

    const out: {
      selector: string;
      tag: "INPUT" | "TEXTAREA";
      label: string;
      maxLength: number | null;
    }[] = [];
    const fields = document.querySelectorAll(
      "input[type='text'], input[type='url'], input:not([type]), textarea",
    );

    fields.forEach((f, idx) => {
      const el = f as HTMLInputElement | HTMLTextAreaElement;
      const name = (el.getAttribute("name") ?? "").toLowerCase();
      const id = (el.id ?? "").toLowerCase();
      const lowerFragments = knownFragments.map((x) => x.toLowerCase());

      if (lowerFragments.some((frag) => name.includes(frag) || id.includes(frag)))
        return;

      const required =
        el.required ||
        el.getAttribute("aria-required") === "true" ||
        el.closest("[data-required]") !== null ||
        el.closest(".application-question.required") !== null;

      if (!required) return;
      if (el.value && el.value.trim().length > 0) return;

      const label = labelFor(el);

      if (!label) return;

      let selector = "";

      if (name) selector = `[name="${CSS.escape(name)}"]`;
      else if (el.id) selector = `#${CSS.escape(el.id)}`;
      else {
        const marker = `jm-lever-${idx}`;

        el.setAttribute("data-jm-field", marker);
        selector = `[data-jm-field="${marker}"]`;
      }

      const ml = "maxLength" in el && typeof el.maxLength === "number"
        ? el.maxLength
        : -1;

      out.push({
        selector,
        tag: el.tagName as "INPUT" | "TEXTAREA",
        label,
        maxLength: ml > 0 && ml < 10_000 ? ml : null,
      });
    });

    return out;
  }, KNOWN_FIELD_FRAGMENTS);
}

async function answerCustomFields(
  page: Page,
  ctx: SubmitContext,
  fields: DetectedField[],
): Promise<{ answered: number; errors: string[] }> {
  let answered = 0;
  const errors: string[] = [];

  for (const field of fields) {
    const question = field.label;
    const questionType = field.tag === "TEXTAREA" ? "long" : "short";
    const maxLength = Math.min(
      field.maxLength ?? ANSWER_HARD_MAX,
      ANSWER_HARD_MAX,
    );

    let generatedAnswer = "";
    let finalAnswer = "";

    try {
      const override = await ctx.lookupOverride(question);

      if (override) {
        finalAnswer = override.slice(0, maxLength);
        generatedAnswer = finalAnswer;
      } else {
        const result = await answerQuestion({
          candidate: ctx.candidate,
          resumeText: ctx.resumeText,
          companyName: ctx.companyName,
          roleTitle: ctx.roleTitle,
          question,
          questionType,
          maxLength,
        });

        generatedAnswer = result.answer;
        finalAnswer = generatedAnswer.slice(0, maxLength);
      }

      const loc = page.locator(field.selector).first();

      if ((await loc.count()) === 0) {
        errors.push(`Selector gone: "${question.slice(0, 40)}"`);
        continue;
      }
      await loc.fill(finalAnswer);
      await ctx.recordAnswer({
        question,
        questionType,
        generatedAnswer,
        finalAnswer,
      });
      answered += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      errors.push(`"${question.slice(0, 40)}": ${msg.slice(0, 80)}`);
    }
  }

  return { answered, errors };
}

async function submit(ctx: SubmitContext): Promise<SubmitResult> {
  const { page, candidate, listingUrl, resumePdf, resumeFileName } = ctx;

  const applyUrl = /\/apply\/?$/.test(listingUrl)
    ? listingUrl
    : listingUrl.replace(/\/?$/, "/apply");

  await page.goto(applyUrl, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT,
  });

  await page
    .waitForSelector(
      ["input[name='name']", "input[name='full_name']", "input#name"].join(
        ", ",
      ),
      { timeout: FORM_READY_TIMEOUT },
    )
    .catch(() => null);

  // Lever uses a single 'name' field for full name
  const filledName = await fillFirst(
    page,
    [
      "input[name='name']",
      "input[name='full_name']",
      "input#name",
      "input[placeholder*='Full name' i]",
    ],
    candidate.full_name,
  );

  if (!filledName) {
    return {
      status: "failed",
      note: "Could not find the Lever application form (name field missing).",
    };
  }

  await fillFirst(
    page,
    ["input[name='email']", "input[type='email']", "input#email"],
    candidate.email,
  );

  if (candidate.phone) {
    await fillFirst(
      page,
      ["input[name='phone']", "input[type='tel']", "input#phone"],
      candidate.phone,
    );
  }

  if (candidate.linkedin_url) {
    await fillFirst(
      page,
      [
        "input[name='urls[LinkedIn]']",
        "input[name*='linkedin' i]",
        "input[id*='linkedin' i]",
      ],
      candidate.linkedin_url,
    );
  }

  // Resume upload — prefer fields clearly labeled as resume/CV. We upload
  // via a temp file on disk rather than an in-memory buffer because some
  // Playwright + Chromium combos report incorrect sizes for buffer-backed
  // File objects, triggering portal-side "file too large" errors.
  const resumeSelectors = [
    "input[type='file'][name='resume']",
    "input[type='file'][name*='resume' i]",
    "input[type='file'][name*='cv' i]",
    "input[type='file']#resume",
    "input[type='file'][id*='resume' i]",
    "input[type='file']",
  ];
  let uploaded = false;
  const tmpPath = `/tmp/resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  const fs = await import("node:fs/promises");

  await fs.writeFile(tmpPath, resumePdf);
  try {
    for (const sel of resumeSelectors) {
      const input = page.locator(sel).first();

      if ((await input.count()) === 0) continue;
      await input.setInputFiles(tmpPath);
      uploaded = true;
      break;
    }
  } finally {
    await fs.unlink(tmpPath).catch(() => null);
  }

  if (!uploaded) {
    return { status: "failed", note: "No resume file input found on Lever page." };
  }
  await page.waitForTimeout(UPLOAD_PARSE_WAIT);

  const customFields = await detectCustomRequiredFields(page);
  const { answered, errors: answerErrors } = await answerCustomFields(
    page,
    ctx,
    customFields,
  );

  const submitSelectors = [
    "button[type='submit']",
    "input[type='submit']",
    "button:has-text('Submit application')",
    "button:has-text('Submit Application')",
    "button:has-text('Apply')",
  ];
  let clicked = false;

  for (const sel of submitSelectors) {
    const btn = page.locator(sel).first();

    if ((await btn.count()) === 0) continue;
    if (!(await btn.isVisible().catch(() => false))) continue;
    await btn.scrollIntoViewIfNeeded().catch(() => null);
    await btn.click({ timeout: 5_000 }).catch(() => null);
    clicked = true;
    break;
  }

  if (!clicked)
    return {
      status: "failed",
      failureReason: "submit_button_missing",
      note: "Submit button not found.",
    };

  const deadline = Date.now() + SUBMIT_RESULT_TIMEOUT;
  let success: string | null = null;
  let errors: string | null = null;

  while (Date.now() < deadline) {
    success = await detectSuccess(page);
    if (success) break;
    errors = await collectErrors(page);
    if (errors) break;
    await page.waitForTimeout(1_500);
  }

  const summary =
    answered > 0 ? ` (answered ${answered} custom)` : "";

  if (success) return { status: "submitted", note: `${success}${summary}` };

  let shotUrl = "";
  let shotKey: string | undefined;

  try {
    const buf = await page.screenshot({ fullPage: true, timeout: 5000 });
    const shot = await ctx.captureDebugShot(Buffer.from(buf));

    shotUrl = shot.url;
    shotKey = shot.key;
  } catch {
    // ignore screenshot failures
  }

  if (errors) {
    const err =
      answerErrors.length > 0
        ? ` | answer issues: ${answerErrors.slice(0, 2).join("; ")}`
        : "";

    return {
      status: "failed",
      failureReason: "validation_errors",
      failureScreenshotKey: shotKey,
      note:
        `Form validation errors: ${errors}${err}${summary}` +
        (shotUrl ? ` | screenshot: ${shotUrl}` : ""),
    };
  }

  return {
    status: "failed",
    failureReason: "no_confirmation",
    failureScreenshotKey: shotKey,
    note:
      `Submit clicked but no confirmation or error within timeout.${summary}` +
      (shotUrl ? ` | screenshot: ${shotUrl}` : ""),
  };
}

export const leverAdapter: PortalAdapter = {
  name: "lever",
  matches: (url) => LEVER_HOST_PATTERN.test(url),
  submit,
};
