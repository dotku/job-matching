import type { Page } from "playwright";

import { answerQuestion } from "../llm.js";

import type { PortalAdapter, SubmitContext, SubmitResult } from "./types.js";

/**
 * Greenhouse has two host patterns we care about:
 *  - boards.greenhouse.io/{company}/jobs/{id}
 *  - job-boards.greenhouse.io/{company}/jobs/{id}
 */
const GREENHOUSE_HOST_PATTERN =
  /(?:^|\/\/)(?:boards|job-boards)\.greenhouse\.io\//i;

const NAV_TIMEOUT = 30_000;
const FORM_READY_TIMEOUT = 15_000;
const UPLOAD_PARSE_WAIT = 6_000; // Greenhouse parses resume + auto-fills
const PRE_SUBMIT_SETTLE = 2_500; // let React validators catch up before submit
const SUBMIT_RESULT_TIMEOUT = 45_000; // confirmation page can be slow
const ANSWER_HARD_MAX = 500;

// Known field-name fragments we handle via basic-field filling. Excluded
// from the "custom question" pass.
const KNOWN_FIELD_FRAGMENTS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "resume",
  "cover_letter",
  "linkedin",
];

interface DetectedField {
  selector: string;
  tag: "INPUT" | "TEXTAREA" | "SELECT";
  label: string;
  maxLength: number | null;
  /** SELECT: option labels. INPUT: empty. */
  options?: string[];
  /** True if the field appears to be a typeahead/autocomplete (e.g. Location city). */
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
    // React-app Greenhouse doesn't pick up .fill() state changes — type
    // the value so React's onChange handlers fire. Every op has an
    // explicit short timeout so a broken field can't stall the job.
    await loc.click({ timeout: 3_000 }).catch(() => null);
    await loc.fill("", { timeout: 3_000 }).catch(() => null);
    await loc
      .pressSequentially(value, { delay: 8, timeout: 5_000 })
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

  // URL changed away from the /jobs/{id} apply page → likely submission
  // took us somewhere else (post-apply confirmation).
  if (originalUrl && url !== originalUrl && !/\/jobs?\//i.test(url)) {
    return `Navigated to ${url}`;
  }

  // If the first_name / email fields have disappeared from the DOM, the
  // form was replaced (strong submission signal in SPA portals).
  const firstNameStill = await page
    .locator("input[name='first_name'], input[name='job_application[first_name]'], input#first_name")
    .first()
    .count();

  if (firstNameStill === 0) {
    return "Application form is no longer on the page (likely submitted)";
  }

  const successTextLoc = page.locator("body").filter({
    hasText:
      /application (?:was )?(?:successfully )?(?:submitted|received)|thanks? for applying|we(?:'| ha)ve received your application|your application has been submitted|we(?:'ll| will) be in touch/i,
  });

  if ((await successTextLoc.count()) > 0) {
    const text = await successTextLoc.first().innerText().catch(() => "");

    return text.slice(0, 200).trim() || "Success text detected";
  }

  return null;
}

async function collectErrors(page: Page): Promise<string | null> {
  const errorSelectors = [
    "[data-testid*='error' i]",
    "[class*='error' i]:not(script):not(style)",
    "[role='alert']",
    ".field_with_errors",
  ];
  const seen = new Set<string>();
  const texts: string[] = [];

  for (const sel of errorSelectors) {
    const locs = page.locator(sel);
    const count = Math.min(await locs.count(), 10);

    for (let i = 0; i < count; i++) {
      const t = (await locs.nth(i).innerText().catch(() => "")).trim();

      if (!t || seen.has(t)) continue;
      seen.add(t);
      texts.push(t);
    }
    if (texts.length >= 3) break;
  }

  return texts.length ? texts.slice(0, 3).join(" | ") : null;
}

/**
 * Scan the page for required text/textarea fields the candidate hasn't filled
 * yet, *excluding* the basic contact fields we handle explicitly.
 */
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

    /**
     * Find the visible label for a form control. Handles modern React
     * forms where the accessible name is often an ancestor sibling, not
     * a direct <label for=""> association.
     */
    function labelFor(el: HTMLElement): string {
      // 1. Explicit <label for="id">
      if (el.id) {
        const explicit = document.querySelector(`label[for="${el.id}"]`);

        if (explicit?.textContent)
          return cleanLabel(explicit.textContent);
      }
      // 2. aria-labelledby (React forms commonly use this)
      const labelledBy = el.getAttribute("aria-labelledby");

      if (labelledBy) {
        const txt = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ");

        if (txt.trim()) return cleanLabel(txt);
      }
      // 3. Ancestor <label>
      let cur: HTMLElement | null = el;

      while (cur && cur !== document.body) {
        if (cur.tagName === "LABEL" && cur.textContent)
          return cleanLabel(cur.textContent);
        cur = cur.parentElement;
      }
      // 4. Walk up looking for a wrapper that likely contains a sibling <label>
      //    (e.g. <div class="field"><label>School *</label><div><div role="combobox">...</div></div></div>)
      cur = el;
      for (let depth = 0; depth < 6 && cur && cur !== document.body; depth++) {
        const sibling = cur.previousElementSibling;

        if (sibling) {
          const lbl = sibling.tagName === "LABEL"
            ? sibling
            : sibling.querySelector("label");

          if (lbl?.textContent) return cleanLabel(lbl.textContent);
        }
        const wrapperLabel = cur.querySelector(":scope > label, :scope > .application-label, :scope > [class*='label' i]");

        if (wrapperLabel?.textContent) return cleanLabel(wrapperLabel.textContent);
        cur = cur.parentElement;
      }
      // 5. aria-label (often just a generic term like "Search")
      const aria = el.getAttribute("aria-label");

      if (aria && !/^search$/i.test(aria.trim())) return cleanLabel(aria);
      // 6. Legend of enclosing fieldset
      const fieldset = el.closest("fieldset");

      if (fieldset) {
        const legend = fieldset.querySelector("legend");

        if (legend?.textContent) return cleanLabel(legend.textContent);
      }
      // 7. Placeholder as last resort, but skip generic ones
      const placeholder = el.getAttribute("placeholder");

      if (placeholder && !/^(search|type|enter|select)\b/i.test(placeholder.trim()))
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
      const knownFragmentsLower = knownFragments.map((x) => x.toLowerCase());

      if (knownFragmentsLower.some((frag) => name.includes(frag) || id.includes(frag)))
        return;

      const required =
        el.hasAttribute("required") ||
        el.getAttribute("aria-required") === "true" ||
        (el.closest("[data-required]") !== null) ||
        // Greenhouse React app marks required-field WRAPPER with a sibling span.label-required
        (el.closest(".application-field, .field")?.querySelector(".label-required, [class*='required' i]") !== null);

      if (!required) return;

      const valueStr = (el as HTMLInputElement).value ?? "";

      if (valueStr && valueStr.trim().length > 0) return;

      const label = labelFor(el);

      if (!label) return;

      let selector = "";

      if (name) selector = `[name="${CSS.escape(name)}"]`;
      else if (el.id) selector = `#${CSS.escape(el.id)}`;
      else {
        const marker = `jm-field-${idx}`;

        el.setAttribute("data-jm-field", marker);
        selector = `[data-jm-field="${marker}"]`;
      }

      if (el.tagName === "SELECT") {
        const sel = el as HTMLSelectElement;
        const options: string[] = [];

        for (const opt of Array.from(sel.options)) {
          const t = (opt.textContent ?? "").trim();

          // Skip the placeholder "Select..." option
          if (!t || /^select /i.test(t) || /choose /i.test(t) || opt.value === "") continue;
          options.push(t);
        }
        if (options.length === 0) return;
        out.push({ selector, tag: "SELECT", label, maxLength: null, options });

        return;
      }

      // Detect typeahead / autocomplete hints (Google Places, React-Select)
      const isTypeahead =
        (el.getAttribute("role") === "combobox") ||
        (el.getAttribute("aria-autocomplete") !== null) ||
        (label.toLowerCase().includes("location") || label.toLowerCase().includes("city")) ||
        (el.closest("[class*='autocomplete' i], [class*='typeahead' i]") !== null);

      const ml = "maxLength" in el && typeof (el as HTMLInputElement).maxLength === "number"
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
        // Try exact match, then case-insensitive prefix, then contains
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
        // Typeahead / autocomplete. Every step is guarded with a short
        // timeout + .catch so no single step can hang the whole job.
        const clickOk = await loc
          .click({ timeout: 3000 })
          .then(() => true)
          .catch(() => false);

        if (!clickOk) {
          await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => null);
          await loc
            .click({ force: true, timeout: 3000 })
            .catch(() => null);
        }
        await loc.fill("").catch(() => null);
        await loc
          .pressSequentially(finalAnswer, { delay: 10, timeout: 3000 })
          .catch(() => null);

        await page.waitForTimeout(800);
        const suggestionSelectors = [
          ".pac-item",
          "[role='option']:not([aria-disabled='true'])",
          "li[class*='option' i]:not([class*='disabled' i])",
        ];
        let clicked = false;

        for (const sel of suggestionSelectors) {
          const sug = page.locator(sel).first();

          if ((await sug.count()) === 0) continue;
          const visible = await sug.isVisible().catch(() => false);

          if (!visible) continue;
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
        await loc.pressSequentially(finalAnswer, { delay: 8 });
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

  await page.goto(listingUrl, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT,
  });

  await page
    .waitForSelector(
      [
        "input[name='first_name']",
        "input[name='job_application[first_name]']",
        "input#first_name",
      ].join(", "),
      { timeout: FORM_READY_TIMEOUT },
    )
    .catch(() => null);

  const { first, last } = splitName(candidate.full_name);

  const filledFirst = await fillFirst(
    page,
    [
      "input[name='first_name']",
      "input[name='job_application[first_name]']",
      "input#first_name",
    ],
    first,
  );

  if (!filledFirst) {
    return {
      status: "failed",
      failureReason: "form_not_found",
      note: "Could not find the application form on this listing (first_name field missing).",
    };
  }

  await fillFirst(
    page,
    [
      "input[name='last_name']",
      "input[name='job_application[last_name]']",
      "input#last_name",
    ],
    last,
  );

  await fillFirst(
    page,
    [
      "input[name='email']",
      "input[name='job_application[email]']",
      "input#email",
    ],
    candidate.email,
  );

  if (candidate.phone) {
    await fillFirst(
      page,
      [
        "input[name='phone']",
        "input[name='job_application[phone]']",
        "input#phone",
      ],
      candidate.phone,
    );
  }

  const resumeInputSelectors = [
    "input[type='file'][name*='resume' i]",
    "input[type='file']#resume",
    "input[type='file'][id*='resume' i]",
    "input[type='file']",
  ];
  let resumeUploaded = false;

  for (const sel of resumeInputSelectors) {
    const input = page.locator(sel).first();

    if ((await input.count()) === 0) continue;
    await input.setInputFiles({
      name: resumeFileName,
      mimeType: "application/pdf",
      buffer: resumePdf,
    });
    resumeUploaded = true;
    break;
  }

  if (!resumeUploaded) {
    return {
      status: "failed",
      failureReason: "field_missing",
      note: "No resume file input found on the page.",
    };
  }

  await page.waitForTimeout(UPLOAD_PARSE_WAIT);

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

  // Custom question pass — detect, answer, record.
  const customFields = await detectCustomRequiredFields(page);
  const { answered, errors: answerErrors } = await answerCustomFields(
    page,
    ctx,
    customFields,
  );

  // Let React-based async validators catch up (Greenhouse attaches
  // blur/debounce handlers that only fire a bit after the last keystroke).
  await page.waitForTimeout(PRE_SUBMIT_SETTLE);

  const submitSelectors = [
    "button[type='submit']",
    "input[type='submit']",
    "button:has-text('Submit Application')",
    "button:has-text('Submit application')",
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

  const urlBeforeSubmit = page.url();
  const deadline = Date.now() + SUBMIT_RESULT_TIMEOUT;
  let success: string | null = null;
  let errors: string | null = null;

  while (Date.now() < deadline) {
    success = await detectSuccess(page, urlBeforeSubmit);
    if (success) break;
    errors = await collectErrors(page);
    if (errors) break;
    await page.waitForTimeout(1_500);
  }

  const customSummary =
    answered > 0
      ? ` (answered ${answered} custom question${answered === 1 ? "" : "s"})`
      : "";

  if (success) {
    return { status: "submitted", note: `${success}${customSummary}` };
  }
  if (errors) {
    const answerIssue =
      answerErrors.length > 0
        ? ` | answer issues: ${answerErrors.slice(0, 2).join("; ")}`
        : "";

    return {
      status: "failed",
      failureReason: "validation_errors",
      note: `Form validation errors: ${errors}${answerIssue}${customSummary}`,
    };
  }

  // Inconclusive: capture a screenshot for human review.
  let shotUrl = "";
  let shotKey: string | undefined;

  try {
    const buf = await page.screenshot({ fullPage: true, timeout: 5000 });
    const shot = await ctx.captureDebugShot(Buffer.from(buf));

    shotUrl = shot.url;
    shotKey = shot.key;
  } catch (e) {
    console.warn(
      "[greenhouse] screenshot capture failed:",
      e instanceof Error ? e.message : String(e),
    );
  }

  return {
    status: "failed",
    failureReason: "no_confirmation",
    failureScreenshotKey: shotKey,
    note:
      `Submit clicked but no confirmation or error within timeout.${customSummary}` +
      (shotUrl ? ` | screenshot: ${shotUrl}` : ""),
  };
}

export const greenhouseAdapter: PortalAdapter = {
  name: "greenhouse",
  matches: (url) => GREENHOUSE_HOST_PATTERN.test(url),
  submit,
};
