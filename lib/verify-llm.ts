import "server-only";

import { generateObject } from "ai";
import { z } from "zod";

import { decryptJson } from "./crypto";
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  computeCostMicroCents,
} from "./llm-pricing";
import { logLlmCall, type LlmBilling } from "./llm-usage";

/**
 * Classify a single Gmail message email-first: one LLM call per email,
 * regardless of how many saved_listings the candidate has. If the email is
 * a confirmation, the LLM returns the employer's company name — the caller
 * then fuzzy-matches that name against saved_listings to pick which row to
 * flip to 'submitted'.
 *
 * Email-first (not listing-first) means we no longer depend on the saved
 * company name literally appearing in the email. An email signed "The Acme
 * Recruiting Team" with subject "Thanks for applying" still classifies as
 * a confirmation for Acme, even if "Acme" never appears as a keyword in
 * the from/subject/snippet.
 */

const CLASSIFY_SCHEMA = z.object({
  isConfirmation: z
    .boolean()
    .describe(
      "True ONLY if this email is a real employer confirming that the candidate's application was received (e.g. 'we received your application', 'thanks for applying'). False for LinkedIn activity digests, job recommendations, newsletters, marketing, interview invites, rejections, and anything else.",
    ),
  companyName: z
    .string()
    .nullable()
    .describe(
      "When isConfirmation=true, the employer's company name as a human would say it (e.g. 'Faire', 'Kodiak Robotics'). NOT the ATS vendor (Greenhouse/Lever/Ashby) and NOT LinkedIn. Null when isConfirmation=false.",
    ),
  rationale: z
    .string()
    .describe(
      "One short sentence explaining the decision, quoting the key phrase from the subject or snippet.",
    ),
});

export interface ClassifyEmail {
  from: string;
  subject: string;
  snippet: string;
  /** Milliseconds since epoch (Gmail internalDate). */
  receivedAt: number;
}

export interface LlmClassifyDecision {
  isConfirmation: boolean;
  companyName: string | null;
  rationale: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  model: string;
  byok: boolean;
}

function buildPrompt(email: ClassifyEmail): string {
  return [
    "You are reading a single email from a candidate's inbox. Decide whether it is an employer confirming that the candidate's job application was received.",
    "",
    "EMAIL:",
    `From: ${email.from}`,
    `Subject: ${email.subject}`,
    `Snippet: ${email.snippet}`,
    `Received: ${new Date(email.receivedAt).toISOString()}`,
    "",
    "Rules:",
    '- isConfirmation=true ONLY for real employer confirmation emails — the hallmarks are phrases like "we received your application", "thanks for applying", "application received", "your submission".',
    "- LinkedIn activity digests (\"you applied to 3 jobs this week\", \"applications you viewed\") are NOT confirmations. Return false for any email from LinkedIn about job activity.",
    "- Job recommendation emails, newsletters, marketing, cold recruiting outreach, interview invites, and rejections are NOT confirmations.",
    "- If isConfirmation=true, set companyName to the EMPLOYER's name — the actual company the candidate applied to — NOT the ATS vendor (Greenhouse/Lever/Ashby/Workday/SmartRecruiters/etc.) and NOT the job board.",
    "- The company name may appear in the From display-name (\"Acme Recruiting <noreply@greenhouse-mail.io>\" → Acme), the subject, or the body snippet. Use whatever signal is strongest.",
    "- If isConfirmation=false, set companyName to null.",
    "- Do NOT invent a company name you cannot see. If you can't identify the employer, return isConfirmation=false.",
  ].join("\n");
}

export async function llmClassifyEmail(
  billing: LlmBilling,
  email: ClassifyEmail,
): Promise<LlmClassifyDecision> {
  const prompt = buildPrompt(email);

  if (billing.byokProvider && billing.byokApiKeyEnc) {
    return callByok(billing, prompt);
  }

  const { object, usage } = await generateObject({
    model: DEFAULT_MODEL,
    schema: CLASSIFY_SCHEMA,
    prompt,
  });

  return {
    isConfirmation: object.isConfirmation,
    companyName: object.companyName,
    rationale: object.rationale,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    byok: false,
  };
}

async function callByok(
  billing: LlmBilling,
  prompt: string,
): Promise<LlmClassifyDecision> {
  if (!billing.byokProvider || !billing.byokApiKeyEnc) {
    throw new Error("BYOK provider or key missing");
  }
  const apiKey = decryptJson<string>(billing.byokApiKeyEnc);
  const provider = billing.byokProvider;
  const model = billing.byokModel ?? defaultByokModel(provider);
  const baseUrl = byokBaseUrl(provider);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            'Respond with a single JSON object matching {"isConfirmation": boolean, "companyName": string | null, "rationale": string}. No markdown, no prose.',
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `${provider} API ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = json.choices?.[0]?.message?.content ?? "{}";
  const raw = safeJsonParse(content);
  const parsed = CLASSIFY_SCHEMA.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      `${provider} returned non-matching JSON: ${content.slice(0, 200)}`,
    );
  }

  return {
    isConfirmation: parsed.data.isConfirmation,
    companyName: parsed.data.companyName,
    rationale: parsed.data.rationale,
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
    provider,
    model,
    byok: true,
  };
}

type ByokProvider = "cerebras" | "openai" | "gemini" | "openrouter";

function byokBaseUrl(provider: ByokProvider): string {
  switch (provider) {
    case "cerebras":
      return "https://api.cerebras.ai/v1";
    case "openai":
      return "https://api.openai.com/v1";
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1beta/openai";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
  }
}

function defaultByokModel(provider: ByokProvider): string {
  switch (provider) {
    case "cerebras":
      return "llama3.1-8b";
    case "openai":
      return "gpt-4o-mini";
    case "gemini":
      return "gemini-2.5-flash-lite";
    case "openrouter":
      return "openrouter/auto";
  }
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);

    if (!m) return {};
    try {
      return JSON.parse(m[0]);
    } catch {
      return {};
    }
  }
}

export async function llmClassifyEmailAndLog(params: {
  candidateId: string;
  contextRef: string | null;
  billing: LlmBilling;
  email: ClassifyEmail;
}): Promise<LlmClassifyDecision> {
  const decision = await llmClassifyEmail(params.billing, params.email);
  const cost = decision.byok
    ? 0
    : computeCostMicroCents(
        decision.model,
        decision.inputTokens,
        decision.outputTokens,
      );

  await logLlmCall({
    candidateId: params.candidateId,
    kind: "email_match",
    provider: decision.provider,
    model: decision.model,
    inputTokens: decision.inputTokens,
    outputTokens: decision.outputTokens,
    costMicroCents: cost,
    byok: decision.byok,
    contextRef: params.contextRef,
  });

  return decision;
}

/**
 * Loose, asymmetric company-name match. Handles the common gaps:
 *   "Kodiak" ↔ "Kodiak Robotics"
 *   "Lexeo" ↔ "Lexeo Therapeutics, Inc."
 *   "Faire, Inc." ↔ "Faire"
 *
 * Returns the matched SavedListing or null. Requires that the normalized
 * company name in either direction contains the other — a first-word
 * prefix match on ≥4-char words is also accepted to cover common cases
 * like "Faire" in "Faire Wholesale".
 */
export function fuzzyMatchCompany<
  T extends { companyName: string; status: string },
>(llmCompany: string, unsubmitted: T[]): T | null {
  const needle = normalizeCompanyName(llmCompany);

  if (!needle) return null;

  const exact = unsubmitted.find(
    (l) => normalizeCompanyName(l.companyName) === needle,
  );

  if (exact) return exact;

  const partial = unsubmitted.find((l) => {
    const hay = normalizeCompanyName(l.companyName);

    if (!hay) return false;

    return hay.includes(needle) || needle.includes(hay);
  });

  if (partial) return partial;

  // First-word match — "Kodiak" matches "Kodiak Robotics" when the saved
  // company name starts with the same ≥4-char word.
  const first = needle.split(" ")[0];

  if (first.length < 4) return null;

  return (
    unsubmitted.find((l) => {
      const hay = normalizeCompanyName(l.companyName);
      const hayFirst = hay.split(" ")[0];

      return hayFirst === first;
    }) ?? null
  );
}

const STOPWORDS = new Set([
  "inc",
  "llc",
  "corp",
  "corporation",
  "co",
  "ltd",
  "limited",
  "the",
  "group",
]);

export function normalizeCompanyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ")
    .trim();
}
