import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

import type { Env } from "./env.js";

export function sqlFor(env: Env): NeonQueryFunction<false, false> {
  return neon(env.DATABASE_URL);
}

export interface SavedListingLite {
  id: string;
  company_name: string;
  title: string;
  status: string;
  url: string;
  saved_at: string;
}

export interface ActiveByok {
  provider: "cerebras" | "openai" | "gemini" | "openrouter";
  model: string;
  api_key_enc: string;
}

export interface CandidateLite {
  id: string;
  external_id: string;
  llm_credits_micro_cents: number;
  active_byok: ActiveByok | null;
}

export async function listGoogleCandidates(
  env: Env,
): Promise<CandidateLite[]> {
  const sql = sqlFor(env);
  const rows = (await sql`
    SELECT c.id, c.external_id, c.llm_credits_micro_cents,
      k.provider AS byok_provider,
      k.model AS byok_model,
      k.api_key_enc AS byok_api_key_enc
    FROM candidates c
    LEFT JOIN candidate_byok_keys k
      ON k.candidate_id = c.id AND k.is_active = true
    WHERE c.external_id LIKE 'google-oauth2|%'
    ORDER BY c.updated_at DESC
  `) as unknown as {
    id: string;
    external_id: string;
    llm_credits_micro_cents: string | number;
    byok_provider: "cerebras" | "openai" | "gemini" | "openrouter" | null;
    byok_model: string | null;
    byok_api_key_enc: string | null;
  }[];

  return rows.map((r) => ({
    id: r.id,
    external_id: r.external_id,
    llm_credits_micro_cents:
      typeof r.llm_credits_micro_cents === "string"
        ? parseInt(r.llm_credits_micro_cents, 10)
        : r.llm_credits_micro_cents,
    active_byok:
      r.byok_provider && r.byok_model && r.byok_api_key_enc
        ? {
            provider: r.byok_provider,
            model: r.byok_model,
            api_key_enc: r.byok_api_key_enc,
          }
        : null,
  }));
}

export async function logLlmCall(
  env: Env,
  params: {
    candidateId: string;
    kind: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costMicroCents: number;
    byok: boolean;
    contextRef?: string | null;
  },
): Promise<void> {
  const sql = sqlFor(env);

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

export async function listUnsubmittedForCandidate(
  env: Env,
  candidateId: string,
): Promise<SavedListingLite[]> {
  const sql = sqlFor(env);
  const rows = (await sql`
    SELECT id, company_name, title, status, url, saved_at
    FROM saved_listings
    WHERE candidate_id = ${candidateId}
      AND status <> 'submitted'
  `) as unknown as SavedListingLite[];

  return rows;
}

export async function markListingSubmitted(
  env: Env,
  candidateId: string,
  listingId: string,
  submittedAtIso: string,
  note: string,
): Promise<void> {
  const sql = sqlFor(env);

  await sql`
    UPDATE saved_listings
    SET status = 'submitted',
        submitted_at = ${submittedAtIso}::timestamptz,
        status_note = ${note}
    WHERE id = ${listingId}
      AND candidate_id = ${candidateId}
  `;
}

export async function listInUseResumeKeys(env: Env): Promise<Set<string>> {
  const sql = sqlFor(env);
  const rows = (await sql`
    SELECT resume_key FROM candidates
    WHERE resume_key IS NOT NULL AND resume_key <> ''
  `) as unknown as { resume_key: string }[];

  return new Set(rows.map((r) => r.resume_key));
}
