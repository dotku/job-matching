import { decryptJsonAesGcm } from "./crypto.js";
import type { Env } from "./env.js";

/**
 * Worker-side mirror of lib/verify-llm.ts. Email-first classification:
 * one LLM call per email, returns {isConfirmation, companyName}. Caller
 * fuzzy-matches the company to saved_listings.
 *
 * Uses raw fetch to keep the bundle small — no AI SDK. Default path hits
 * Vercel AI Gateway's OpenAI-compatible endpoint. BYOK calls go direct to
 * Cerebras/OpenAI/Gemini/OpenRouter (all OpenAI-compatible shape).
 */

const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";
const DEFAULT_PROVIDER = "gemini";

const PRICING: Record<
  string,
  { inputMicroCents: number; outputMicroCents: number }
> = {
  "google/gemini-2.5-flash-lite": { inputMicroCents: 10, outputMicroCents: 40 },
};

function priceFor(model: string) {
  return PRICING[model] ?? PRICING[DEFAULT_MODEL];
}

export function computeCostMicroCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = priceFor(model);

  return inputTokens * p.inputMicroCents + outputTokens * p.outputMicroCents;
}

export interface MatchEmail {
  from: string;
  subject: string;
  snippet: string;
  receivedAt: number;
}

export interface MatchBilling {
  byokProvider: "cerebras" | "openai" | "gemini" | "openrouter" | null;
  byokModel: string | null;
  byokApiKeyEnc: string | null;
}

export interface ClassifyDecision {
  isConfirmation: boolean;
  companyName: string | null;
  rationale: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  model: string;
  byok: boolean;
}

function buildPrompt(email: MatchEmail): string {
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
    '- isConfirmation=true ONLY for real employer confirmation emails — phrases like "we received your application", "thanks for applying", "application received".',
    "- LinkedIn activity digests are NOT confirmations.",
    "- Marketing, recommendations, newsletters, interview invites, and rejections are NOT confirmations.",
    "- If isConfirmation=true, set companyName to the EMPLOYER's name — the actual company the candidate applied to — NOT the ATS vendor (Greenhouse/Lever/Ashby/Workday/SmartRecruiters) and NOT LinkedIn.",
    "- The employer may appear in the From display-name, subject, or body snippet.",
    "- If isConfirmation=false, set companyName to null.",
    "- Do NOT invent a company name you cannot see.",
    '- Reply with a single JSON object: {"isConfirmation": boolean, "companyName": string | null, "rationale": string}. No markdown, no prose.',
  ].join("\n");
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

async function callOpenAICompatible(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider: string;
  byok: boolean;
  prompt: string;
}): Promise<ClassifyDecision> {
  const res = await fetch(`${params.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        {
          role: "system",
          content:
            'Respond with a single JSON object matching {"isConfirmation": boolean, "companyName": string | null, "rationale": string}. No markdown, no prose.',
        },
        { role: "user", content: params.prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `${params.provider} API ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  const raw = safeJsonParse(content) as {
    isConfirmation?: unknown;
    companyName?: unknown;
    rationale?: unknown;
  };

  return {
    isConfirmation:
      typeof raw.isConfirmation === "boolean" ? raw.isConfirmation : false,
    companyName: typeof raw.companyName === "string" ? raw.companyName : null,
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
    provider: params.provider,
    model: params.model,
    byok: params.byok,
  };
}

export async function llmClassifyEmail(
  env: Env,
  billing: MatchBilling,
  email: MatchEmail,
): Promise<ClassifyDecision> {
  const prompt = buildPrompt(email);

  if (billing.byokProvider && billing.byokApiKeyEnc) {
    const apiKey = await decryptJsonAesGcm<string>(
      billing.byokApiKeyEnc,
      env.COOKIE_ENC_KEY,
    );
    const model = billing.byokModel ?? defaultByokModel(billing.byokProvider);
    const baseUrl = byokBaseUrl(billing.byokProvider);

    return callOpenAICompatible({
      baseUrl,
      apiKey,
      model,
      provider: billing.byokProvider,
      byok: true,
      prompt,
    });
  }

  return callOpenAICompatible({
    baseUrl: "https://gateway.ai.vercel.dev/v1",
    apiKey: env.AI_GATEWAY_API_KEY,
    model: DEFAULT_MODEL,
    provider: DEFAULT_PROVIDER,
    byok: false,
    prompt,
  });
}

/** Shared fuzzy-match helper — mirrors lib/verify-llm.ts.fuzzyMatchCompany. */
export function fuzzyMatchCompany<
  T extends { company_name: string; status: string },
>(llmCompany: string, unsubmitted: T[]): T | null {
  const needle = normalizeCompanyName(llmCompany);

  if (!needle) return null;

  const exact = unsubmitted.find(
    (l) => normalizeCompanyName(l.company_name) === needle,
  );

  if (exact) return exact;

  const partial = unsubmitted.find((l) => {
    const hay = normalizeCompanyName(l.company_name);

    if (!hay) return false;

    return hay.includes(needle) || needle.includes(hay);
  });

  if (partial) return partial;

  const first = needle.split(" ")[0];

  if (first.length < 4) return null;

  return (
    unsubmitted.find((l) => {
      const hay = normalizeCompanyName(l.company_name);
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

function normalizeCompanyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ")
    .trim();
}
