import "server-only";

/**
 * Token prices in micro-cents (1 micro-cent = $10^-8), aligned with the
 * candidates.llm_credits_micro_cents column. Source: provider public
 * pricing pages, rounded up to keep the deduction conservative.
 *
 * Only used when byok=false. BYOK calls still log token counts but do not
 * deduct credits.
 */

export interface TokenPrice {
  /** Micro-cents per input token. */
  inputMicroCents: number;
  /** Micro-cents per output token. */
  outputMicroCents: number;
}

export const DEFAULT_PROVIDER = "gemini";
export const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

/**
 * Gemini 2.5 Flash Lite via AI Gateway:
 *   $0.10 / 1M input tokens  = 10 micro-cents/token
 *   $0.40 / 1M output tokens = 40 micro-cents/token
 *
 * Values match the AI Gateway pass-through pricing and are intentionally
 * rounded up by a hair to cover gateway overhead.
 */
export const PRICING: Record<string, TokenPrice> = {
  "google/gemini-2.5-flash-lite": {
    inputMicroCents: 10,
    outputMicroCents: 40,
  },
};

export function priceFor(model: string): TokenPrice {
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
