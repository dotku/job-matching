import "server-only";

import { sql } from "./db";
import { getActiveByokKey } from "./llm-keys";

/**
 * Persist one LLM call and (when non-BYOK) atomically deduct its cost from
 * the candidate's credit balance. Balance is allowed to go negative by a
 * small amount since we charge after the call returns — gating before the
 * call should use `hasBillableCredit` to avoid unbounded debt.
 */
export async function logLlmCall(params: {
  candidateId: string;
  kind: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costMicroCents: number;
  byok: boolean;
  contextRef?: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO llm_usage (
      candidate_id, kind, provider, model,
      input_tokens, output_tokens, cost_micro_cents, byok, context_ref
    ) VALUES (
      ${params.candidateId}, ${params.kind}, ${params.provider}, ${params.model},
      ${params.inputTokens}, ${params.outputTokens}, ${params.costMicroCents},
      ${params.byok}, ${params.contextRef ?? null}
    )
  `;

  if (!params.byok && params.costMicroCents > 0) {
    await sql`
      UPDATE candidates
      SET llm_credits_micro_cents = llm_credits_micro_cents - ${params.costMicroCents}
      WHERE id = ${params.candidateId}
    `;
  }
}

export interface LlmBilling {
  creditsMicroCents: number;
  byokProvider: "cerebras" | "openai" | "gemini" | "openrouter" | null;
  byokModel: string | null;
  byokApiKeyEnc: string | null;
  hasByokKey: boolean;
}

export async function getCandidateBilling(
  candidateId: string,
): Promise<LlmBilling | null> {
  const rows = (await sql`
    SELECT llm_credits_micro_cents FROM candidates
    WHERE id = ${candidateId} LIMIT 1
  `) as unknown as { llm_credits_micro_cents: string | number }[];

  const row = rows[0];

  if (!row) return null;

  const active = await getActiveByokKey(candidateId);

  return {
    creditsMicroCents:
      typeof row.llm_credits_micro_cents === "string"
        ? parseInt(row.llm_credits_micro_cents, 10)
        : row.llm_credits_micro_cents,
    byokProvider: active?.provider ?? null,
    byokModel: active?.model ?? null,
    byokApiKeyEnc: active?.apiKeyEnc ?? null,
    hasByokKey: !!active,
  };
}

/** Usable for a billable call if BYOK or credit balance is positive. */
export function canMakeBillableCall(b: LlmBilling): boolean {
  return b.hasByokKey || b.creditsMicroCents > 0;
}

export interface LlmUsageSummary {
  /** Total spent since signup (non-BYOK calls only). */
  spentMicroCents: number;
  /** Total calls (BYOK + non-BYOK). */
  totalCalls: number;
  /** Breakdown of calls by `kind`. */
  byKind: {
    kind: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
  }[];
  /** Breakdown of calls by provider/model — so the user sees where tokens went. */
  byModel: {
    provider: string;
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    costMicroCents: number;
    byokCalls: number;
  }[];
}

export interface RecentLlmCall {
  id: string;
  kind: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costMicroCents: number;
  byok: boolean;
  createdAt: string;
}

export async function getUsageSummary(
  candidateId: string,
): Promise<LlmUsageSummary> {
  const totals = (await sql`
    SELECT
      COALESCE(SUM(CASE WHEN byok = false THEN cost_micro_cents ELSE 0 END), 0) AS spent,
      COUNT(*)::int AS calls
    FROM llm_usage WHERE candidate_id = ${candidateId}
  `) as unknown as { spent: string | number; calls: number }[];

  const kindRows = (await sql`
    SELECT kind,
      COUNT(*)::int AS calls,
      COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
      COALESCE(SUM(output_tokens), 0)::int AS output_tokens
    FROM llm_usage WHERE candidate_id = ${candidateId}
    GROUP BY kind
    ORDER BY calls DESC
  `) as unknown as {
    kind: string;
    calls: number;
    input_tokens: number;
    output_tokens: number;
  }[];

  const modelRows = (await sql`
    SELECT provider, model,
      COUNT(*)::int AS calls,
      COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
      COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
      COALESCE(SUM(cost_micro_cents), 0) AS cost_micro_cents,
      COALESCE(SUM(CASE WHEN byok THEN 1 ELSE 0 END), 0)::int AS byok_calls
    FROM llm_usage WHERE candidate_id = ${candidateId}
    GROUP BY provider, model
    ORDER BY calls DESC
  `) as unknown as {
    provider: string;
    model: string;
    calls: number;
    input_tokens: number;
    output_tokens: number;
    cost_micro_cents: string | number;
    byok_calls: number;
  }[];

  return {
    spentMicroCents:
      typeof totals[0]?.spent === "string"
        ? parseInt(totals[0].spent, 10)
        : (totals[0]?.spent ?? 0),
    totalCalls: totals[0]?.calls ?? 0,
    byKind: kindRows.map((r) => ({
      kind: r.kind,
      calls: r.calls,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
    })),
    byModel: modelRows.map((r) => ({
      provider: r.provider,
      model: r.model,
      calls: r.calls,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      costMicroCents:
        typeof r.cost_micro_cents === "string"
          ? parseInt(r.cost_micro_cents, 10)
          : r.cost_micro_cents,
      byokCalls: r.byok_calls,
    })),
  };
}

export async function getRecentLlmCalls(
  candidateId: string,
  limit = 20,
): Promise<RecentLlmCall[]> {
  const rows = (await sql`
    SELECT id, kind, provider, model,
      input_tokens, output_tokens, cost_micro_cents, byok, created_at
    FROM llm_usage WHERE candidate_id = ${candidateId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as unknown as {
    id: string;
    kind: string;
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_micro_cents: string | number;
    byok: boolean;
    created_at: string;
  }[];

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    provider: r.provider,
    model: r.model,
    inputTokens: r.input_tokens,
    outputTokens: r.output_tokens,
    costMicroCents:
      typeof r.cost_micro_cents === "string"
        ? parseInt(r.cost_micro_cents, 10)
        : r.cost_micro_cents,
    byok: r.byok,
    createdAt: r.created_at,
  }));
}

