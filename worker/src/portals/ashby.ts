import type { Page } from "playwright";

import { answerQuestion } from "../llm.js";

import type { PortalAdapter, SubmitContext, SubmitResult } from "./types.js";

/**
 * Ashby public apply pages:
 *   https://jobs.ashbyhq.com/{company}/{jobId}              (description)
 *   https://jobs.ashbyhq.com/{company}/{jobId}/application  (form)
 * Ashby uses emotion-generated class names so selectors key off stable
 * `name` / `id` patterns ("_systemfield_name", "_systemfield_email", ...)
 * plus visible labels for custom questions.
 */
const ASHBY_HOST_PATTERN = /(?:^|\/\/)jobs\.ashbyhq\.com\//i;

const NAV_TIMEOUT = 30_000;
const FORM_READY_TIMEOUT = 15_000;
const UPLOAD_PARSE_WAIT = 5_000;
const PRE_SUBMIT_SETTLE = 2_500;
const SUBMIT_RESULT_TIMEOUT = 45_000;
const ANSWER_HARD_MAX = 500;

const KNOWN_FIELD_FRAGMENTS = [
  "_systemfield_name",
  "_systemfield_email",
  "_systemfield_phone",
  "_systemfield_resume",
  "_systemfield_linkedin",
  "systemfield",
  "resume",
  "email",
  "phone",
  "linkedin",
];

interface DetectedField {
  selector: string;
  tag: "INPUT" | "TEXTAREA" | "SELECT";
  label: string;
  maxLength: number | null;
  options?: string[];
  isTypeahead?: boolean;
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
    await loc
      .pressSequentially(value, { delay: 10, timeout: 3000 })
      .catch(() => null);

    return true;
  }

  return false;
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);

  if (parts.length <= 1) return { first: full || "Applicant", last: full || "-" };

  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

async function detectSuccess(
  page: Page,
  originalUrl?: string,
): Promise<string | null> {
  const url = page.url();

  if (/\/confirmation|\/thanks|\/success|\/applied|submitted/i.test(url))
    return url;

  if (
    originalUrl &&
    url !== originalUrl &&
    !/\/application\/?$/i.test(url) &&
    !/\/jobs?\//i.test(url)
  ) {
    return `Navigated to ${url}`;
  }

  // Application form field gone from DOM = submitted
  const nameGone =
    (await page
      .locator("input[name='_systemfield_name'], input[name='name'], input#_systemfield_name")
      .first()
      .count()) === 0;

  if (nameGone) {
    return "Application form is no longer on the page (likely submitted)";
  }

  const successTextLoc = page.locator("body").filter({
    hasText:
      /application (?:was )?(?:successfully )?(?:submitted|received)|thanks? for applying|we(?:'| ha)ve received your application|your application has been submitted/i,
  });

  if ((await successTextLoc.count()) > 0) {
    const text = await successTextLoc.first().innerText().catch(() => "");

    return text.slice(0, 200).trim() || "Success text detected";
  }

  return null;
}

async function collectErrors(page: Page): Promise<string | null> {
  const selectors = [
    "[class*='error' i]:not(script):not(style)",
    "[role='alert']",
    "[data-testid*='error' i]",
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
    function cleanLabel(text: string): string {
      return text
        .replace(/\s+/g, " ")
        .replace(/\*+/g, "")
        .replace(/\(required\)/gi, "")
        .replace(/required/gi, "")
        .trim();
    }

    function labelFor(el: HTMLElement): string {
      if (el.id) {
        const explicit = document.querySelector(`label[for="${el.id}"]`);

        if (explicit?.textContent) return cleanLabel(explicit.textContent);
      }
      const labelledBy = el.getAttribute("aria-labelledby");

      if (labelledBy) {
        const txt = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ");

        if (txt.trim()) return cleanLabel(txt);
      }
      let cur: HTMLElement | null = el;

      while (cur && cur !== document.body) {
        if (cur.tagName === "LABEL" && cur.textContent)
          return cleanLabel(cur.textContent);
        cur = cur.parentElement;
      }
      // Walk ancestor chain looking for a sibling label (Ashby nests the
      // label above a wrapper div containing the input)
      cur = el;
      for (let depth = 0; depth < 6 && cur && cur !== document.body; depth++) {
        const sibling = cur.previousElementSibling;

        if (sibling) {
          const lbl =
            sibling.tagName === "LABEL" ? sibling : sibling.querySelector("label");

          if (lbl?.textContent) return cleanLabel(lbl.textContent);
          if (sibling.textContent && sibling.textContent.trim().length < 120)
            return cleanLabel(sibling.textContent);
        }
        cur = cur.parentElement;
      }
      const aria = el.getAttribute("aria-label");

      if (aria && !/^search$/i.test(aria.trim())) return cleanLabel(aria);
      const placeholder = el.getAttribute("placeholder");

      if (
        placeholder &&
        !/^(search|type|enter|select)\b/i.test(placeholder.trim())
      )
        return cleanLabel(placeholder);

      return "";
    }

    const out: {
      selector: string;
      tag: "INPUT" | "TEXTAREA" | "SELECT";
      label: string;
      maxLength: number | null;
      options?: string[];
      isTypeahead?: boolean;
    }[] = [];
    const fields = document.querySelectorAll(
      "input[type='text'], input[type='url'], input[type='search'], input:not([type]), textarea, select",
    );

    fields.forEach((f, idx) => {
      const el = f as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const name = (el.getAttribute("name") ?? "").toLowerCase();
      const id = (el.id ?? "").toLowerCase();
      const lowerFrags = knownFragments.map((x) => x.toLowerCase());

      if (lowerFrags.some((frag) => name.includes(frag) || id.includes(frag)))
        return;

      const required =
        el.hasAttribute("required") ||
        el.getAttribute("aria-required") === "true" ||
        el.closest("[data-required]") !== null ||
        el.closest("[class*='required' i]") !== null;

      if (!required) return;

      const valueStr = (el as HTMLInputElement).value ?? "";

      if (valueStr && valueStr.trim().length > 0) return;

      const label = labelFor(el);

      if (!label) return;

      let selector = "";

      if (name) selector = `[name="${CSS.escape(name)}"]`;
      else if (el.id) selector = `#${CSS.escape(el.id)}`;
      else {
        const marker = `jm-ash-${idx}`;

        el.setAttribute("data-jm-field", marker);
        selector = `[data-jm-field="${marker}"]`;
      }

      if (el.tagName === "SELECT") {
        const sel = el as HTMLSelectElement;
        const options: string[] = [];

        for (const opt of Array.from(sel.options)) {
          const t = (opt.textContent ?? "").trim();

          if (!t || /^select /i.test(t) || /choose /i.test(t) || opt.value === "")
            continue;
          options.push(t);
        }
        if (options.length === 0) return;
        out.push({ selector, tag: "SELECT", label, maxLength: null, options });

        return;
      }

      const isTypeahead =
        el.getAttribute("role") === "combobox" ||
        el.getAttribute("aria-autocomplete") !== null ||
        label.toLowerCase().includes("location") ||
        label.toLowerCase().includes("city");

      const ml =
        "maxLength" in el && typeof (el as HTMLInputElement).maxLength === "number"
          ? (el as HTMLInputElement).maxLength
          : -1;

      out.push({
        selector,
        tag: el.tagName as "INPUT" | "TEXTAREA",
        label,
        maxLength: ml > 0 && ml < 10_000 ? ml : null,
        isTypeahead,
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
    const questionType: "long" | "short" | "select" =
      field.tag === "SELECT"
        ? "select"
        : field.tag === "TEXTAREA"
          ? "long"
          : "short";
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
          options: field.options,
        });

        generatedAnswer = result.answer;
        finalAnswer = generatedAnswer.slice(0, maxLength);
      }

      const loc = page.locator(field.selector).first();

      if ((await loc.count()) === 0) {
        errors.push(`Selector gone: "${question.slice(0, 40)}"`);
        continue;
      }

      if (field.tag === "SELECT") {
        const opts = field.options ?? [];
        const match =
          opts.find((o) => o.toLowerCase() === finalAnswer.toLowerCase()) ??
          opts.find((o) =>
            o.toLowerCase().startsWith(finalAnswer.toLowerCase()),
          ) ??
          opts.find((o) =>
            o.toLowerCase().includes(finalAnswer.toLowerCase()),
          );

        if (!match) {
          errors.push(
            `No option matched "${finalAnswer}" for "${question.slice(0, 40)}"`,
          );
          continue;
        }
        await loc.selectOption({ label: match });
        finalAnswer = match;
      } else if (field.isTypeahead) {
        await loc.click({ timeout: 3000 }).catch(() => null);
        await loc.fill("").catch(() => null);
        await loc
          .pressSequentially(finalAnswer, { delay: 10, timeout: 3000 })
          .catch(() => null);
        await page.waitForTimeout(800);

        const suggestionSelectors = [
          "[role='option']:not([aria-disabled='true'])",
          "li[class*='option' i]:not([class*='disabled' i])",
          ".pac-item",
        ];
        let clicked = false;

        for (const sel of suggestionSelectors) {
          const sug = page.locator(sel).first();

          if ((await sug.count()) === 0) continue;
          if (!(await sug.isVisible().catch(() => false))) continue;
          const ok = await sug
            .click({ timeout: 800 })
            .then(() => true)
            .catch(() => false);

          if (ok) {
            clicked = true;
            break;
          }
        }
        if (!clicked) {
          await loc.press("Enter", { timeout: 800 }).catch(() => null);
        }
      } else {
        await loc.click().catch(() => null);
        await loc.fill("");
        await loc
          .pressSequentially(finalAnswer, { delay: 8 })
          .catch(() => null);
      }

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

  // Navigate to /application directly if not already there
  const applyUrl = /\/application\/?$/.test(listingUrl)
    ? listingUrl
    : listingUrl.replace(/\/?$/, "/application");

  await page.goto(applyUrl, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT,
  });

  await page
    .waitForSelector(
      [
        "input[name='_systemfield_name']",
        "input[name='name']",
        "input#_systemfield_name",
        "input[id*='name' i]",
      ].join(", "),
      { timeout: FORM_READY_TIMEOUT },
    )
    .catch(() => null);

  // Ashby sometimes uses single "name" field, sometimes first/last.
  const { first, last } = splitName(candidate.full_name);
  const filledFullName = await fillFirst(
    page,
    [
      "input[name='_systemfield_name']",
      "input[name='name']",
      "input#_systemfield_name",
    ],
    candidate.full_name,
  );

  if (!filledFullName) {
    const filledFirst = await fillFirst(
      page,
      ["input[name='firstName']", "input[name='first_name']"],
      first,
    );

    if (!filledFirst) {
      return {
        status: "failed",
        note: "Could not find Ashby name field.",
      };
    }
    await fillFirst(
      page,
      ["input[name='lastName']", "input[name='last_name']"],
      last,
    );
  }

  await fillFirst(
    page,
    [
      "input[name='_systemfield_email']",
      "input[name='email']",
      "input[type='email']",
    ],
    candidate.email,
  );

  if (candidate.phone) {
    await fillFirst(
      page,
      [
        "input[name='_systemfield_phone']",
        "input[name='phone']",
        "input[type='tel']",
      ],
      candidate.phone,
    );
  }

  if (candidate.linkedin_url) {
    await fillFirst(
      page,
      [
        "input[name*='linkedin' i]",
        "input[id*='linkedin' i]",
        "input[aria-label*='linkedin' i]",
      ],
      candidate.linkedin_url,
    );
  }

  // Resume upload — use path-based (same reliability-bug workaround as Lever)
  const resumeSelectors = [
    "input[type='file'][name='_systemfield_resume']",
    "input[type='file'][name*='resume' i]",
    "input[type='file']#resume",
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
    return {
      status: "failed",
      note: "No resume file input found on Ashby page.",
    };
  }
  void resumeFileName;
  await page.waitForTimeout(UPLOAD_PARSE_WAIT);

  const customFields = await detectCustomRequiredFields(page);
  const { answered, errors: answerErrors } = await answerCustomFields(
    page,
    ctx,
    customFields,
  );

  await page.waitForTimeout(PRE_SUBMIT_SETTLE);

  const submitSelectors = [
    "button[type='submit']",
    "button:has-text('Submit Application')",
    "button:has-text('Submit application')",
    "button:has-text('Submit')",
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

  const urlBefore = page.url();
  const deadline = Date.now() + SUBMIT_RESULT_TIMEOUT;
  let success: string | null = null;
  let errors: string | null = null;

  while (Date.now() < deadline) {
    success = await detectSuccess(page, urlBefore);
    if (success) break;
    errors = await collectErrors(page);
    if (errors) break;
    await page.waitForTimeout(1_500);
  }

  const summary = answered > 0 ? ` (answered ${answered} custom)` : "";

  if (success) return { status: "submitted", note: `${success}${summary}` };

  let shotUrl = "";
  let shotKey: string | undefined;

  try {
    const buf = await page.screenshot({ fullPage: true, timeout: 5000 });
    const shot = await ctx.captureDebugShot(Buffer.from(buf));

    shotUrl = shot.url;
    shotKey = shot.key;
  } catch {
    // noop
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

export const ashbyAdapter: PortalAdapter = {
  name: "ashby",
  matches: (url) => ASHBY_HOST_PATTERN.test(url),
  submit,
};
