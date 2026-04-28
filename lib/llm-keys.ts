import "server-only";

import { sql } from "./db";

export type ByokProvider = "cerebras" | "openai" | "gemini" | "openrouter";

export interface ByokKey {
  id: string;
  candidateId: string;
  provider: ByokProvider;
  model: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ByokKeyWithSecret extends ByokKey {
  apiKeyEnc: string;
}

interface Row {
  id: string;
  candidate_id: string;
  provider: ByokProvider;
  model: string;
  label: string | null;
  api_key_enc: string;
  is_active: boolean;
  created_at: string;
}

function rowTo(row: Row, includeSecret: false): ByokKey;
function rowTo(row: Row, includeSecret: true): ByokKeyWithSecret;
function rowTo(row: Row, includeSecret: boolean): ByokKey | ByokKeyWithSecret {
  const base: ByokKey = {
    id: row.id,
    candidateId: row.candidate_id,
    provider: row.provider,
    model: row.model,
    label: row.label,
    isActive: row.is_active,
    createdAt: row.created_at,
  };

  return includeSecret ? { ...base, apiKeyEnc: row.api_key_enc } : base;
}

export async function listByokKeys(candidateId: string): Promise<ByokKey[]> {
  const rows = (await sql`
    SELECT id, candidate_id, provider, model, label, api_key_enc, is_active, created_at
    FROM candidate_byok_keys
    WHERE candidate_id = ${candidateId}
    ORDER BY created_at DESC
  `) as unknown as Row[];

  return rows.map((r) => rowTo(r, false));
}

export async function getActiveByokKey(
  candidateId: string,
): Promise<ByokKeyWithSecret | null> {
  const rows = (await sql`
    SELECT id, candidate_id, provider, model, label, api_key_enc, is_active, created_at
    FROM candidate_byok_keys
    WHERE candidate_id = ${candidateId} AND is_active = true
    LIMIT 1
  `) as unknown as Row[];

  return rows[0] ? rowTo(rows[0], true) : null;
}

/**
 * Insert a new key. If it's the candidate's first key, it is activated
 * automatically. Otherwise the caller can explicitly activate later.
 */
export async function addByokKey(params: {
  candidateId: string;
  provider: ByokProvider;
  model: string;
  apiKeyEnc: string;
  label: string | null;
  activateIfFirst?: boolean;
}): Promise<ByokKey> {
  const activate = params.activateIfFirst ?? true;
  const existing = (await sql`
    SELECT count(*)::int AS n FROM candidate_byok_keys
    WHERE candidate_id = ${params.candidateId}
  `) as unknown as { n: number }[];
  const shouldActivate = activate && (existing[0]?.n ?? 0) === 0;
  const rows = (await sql`
    INSERT INTO candidate_byok_keys (
      candidate_id, provider, model, api_key_enc, label, is_active
    ) VALUES (
      ${params.candidateId}, ${params.provider}, ${params.model},
      ${params.apiKeyEnc}, ${params.label}, ${shouldActivate}
    )
    RETURNING id, candidate_id, provider, model, label, api_key_enc, is_active, created_at
  `) as unknown as Row[];

  return rowTo(rows[0], false);
}

/**
 * Flip is_active on exactly one key. Done as a transaction via two
 * statements: deactivate everything else, then activate the chosen row.
 * The partial unique index `candidate_byok_keys_one_active_idx` guarantees
 * correctness if any concurrent write tries to double-activate.
 */
export async function setActiveByokKey(
  candidateId: string,
  keyId: string,
): Promise<boolean> {
  await sql`
    UPDATE candidate_byok_keys
    SET is_active = false
    WHERE candidate_id = ${candidateId} AND is_active = true AND id <> ${keyId}
  `;
  const rows = (await sql`
    UPDATE candidate_byok_keys
    SET is_active = true
    WHERE id = ${keyId} AND candidate_id = ${candidateId}
    RETURNING id
  `) as unknown as { id: string }[];

  return rows.length > 0;
}

export async function deactivateAllByokKeys(
  candidateId: string,
): Promise<void> {
  await sql`
    UPDATE candidate_byok_keys
    SET is_active = false
    WHERE candidate_id = ${candidateId} AND is_active = true
  `;
}

export async function deleteByokKey(
  candidateId: string,
  keyId: string,
): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM candidate_byok_keys
    WHERE id = ${keyId} AND candidate_id = ${candidateId}
    RETURNING id, is_active
  `) as unknown as { id: string; is_active: boolean }[];

  if (rows.length === 0) return false;

  // If we just removed the active key, promote the most-recent remaining
  // key so LLM calls don't silently fall back to the paid default.
  if (rows[0].is_active) {
    await sql`
      UPDATE candidate_byok_keys
      SET is_active = true
      WHERE id = (
        SELECT id FROM candidate_byok_keys
        WHERE candidate_id = ${candidateId}
        ORDER BY created_at DESC
        LIMIT 1
      )
    `;
  }

  return true;
}
