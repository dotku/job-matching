import "server-only";

import { sql } from "./db";

export interface AdminFailureRow {
  id: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  companyName: string;
  title: string;
  url: string;
  status: string;
  statusNote: string | null;
  savedAt: string;
}

export async function listRecentFailures(
  limit = 100,
): Promise<AdminFailureRow[]> {
  const rows = (await sql`
    SELECT
      s.id,
      s.candidate_id,
      c.email AS candidate_email,
      c.full_name AS candidate_name,
      s.company_name,
      s.title,
      s.url,
      s.status,
      s.status_note,
      s.saved_at
    FROM saved_listings s
    JOIN candidates c ON c.id = s.candidate_id
    WHERE s.status IN ('failed', 'skipped')
    ORDER BY s.saved_at DESC
    LIMIT ${limit}
  `) as unknown as {
    id: string;
    candidate_id: string;
    candidate_email: string;
    candidate_name: string;
    company_name: string;
    title: string;
    url: string;
    status: string;
    status_note: string | null;
    saved_at: string;
  }[];

  return rows.map((r) => ({
    id: r.id,
    candidateId: r.candidate_id,
    candidateEmail: r.candidate_email,
    candidateName: r.candidate_name,
    companyName: r.company_name,
    title: r.title,
    url: r.url,
    status: r.status,
    statusNote: r.status_note,
    savedAt: r.saved_at,
  }));
}

export interface OutcomeFunnel {
  submitted: number;      // everything past the submit pipeline (pending + downstream)
  pending: number;
  confirmed: number;
  screening: number;
  interviewing: number;
  offer: number;
  accepted: number;
  declined: number;
  rejected: number;
  ghosted: number;
}

export interface LlmSpendSummary {
  totalCalls: number;
  byokCalls: number;
  paidCalls: number;
  totalSpentMicroCents: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  /** Candidates with at least one active BYOK key. */
  byokCandidates: number;
  /** Top 8 models by call count. */
  byModel: {
    provider: string;
    model: string;
    calls: number;
    byokCalls: number;
    costMicroCents: number;
  }[];
}

export interface AdminSummary {
  byStatus: { status: string; count: number }[];
  byPortal: { portal: string; count: number; failures: number }[];
  topFailureReasons: { reason: string; count: number }[];
  totalCandidates: number;
  outcomeFunnel: OutcomeFunnel;
}

function portalFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;

    if (/greenhouse\.io$/.test(host)) return "greenhouse";
    if (/jobs\.lever\.co$/.test(host)) return "lever";
    if (/ashbyhq\.com$/.test(host)) return "ashby";
    if (/smartrecruiters\.com$/.test(host)) return "smartrecruiters";
    if (/myworkdayjobs\.com$|workday\.com$/.test(host)) return "workday";

    return host;
  } catch {
    return "unknown";
  }
}

/**
 * Truncate failure notes to group similar ones together, stripping
 * screenshot URLs / variable bits.
 */
function normalizeReason(note: string | null): string {
  if (!note) return "(no note)";
  // Signed URLs change per run — strip before grouping.
  let base = note
    .split(" | screenshot:")[0]
    .split(" | video:")[0]
    .trim();

  base = base.replace(/\(answered \d+ custom\)?/g, "").trim();
  base = base.replace(/\s+\|\s*$/, "").trim();

  return base.slice(0, 160);
}

export async function computeAdminSummary(): Promise<AdminSummary> {
  const statusRows = (await sql`
    SELECT status, count(*)::int AS n
    FROM saved_listings
    GROUP BY status
    ORDER BY n DESC
  `) as unknown as { status: string; n: number }[];

  const urlRows = (await sql`
    SELECT url, status
    FROM saved_listings
  `) as unknown as { url: string; status: string }[];

  const portalAgg: Record<string, { count: number; failures: number }> = {};

  for (const r of urlRows) {
    const p = portalFromUrl(r.url);

    if (!portalAgg[p]) portalAgg[p] = { count: 0, failures: 0 };
    portalAgg[p].count += 1;
    if (r.status === "failed") portalAgg[p].failures += 1;
  }

  const byPortal = Object.entries(portalAgg)
    .map(([portal, v]) => ({ portal, ...v }))
    .sort((a, b) => b.count - a.count);

  const noteRows = (await sql`
    SELECT status_note
    FROM saved_listings
    WHERE status = 'failed'
  `) as unknown as { status_note: string | null }[];

  const reasonAgg = new Map<string, number>();

  for (const r of noteRows) {
    const k = normalizeReason(r.status_note);

    reasonAgg.set(k, (reasonAgg.get(k) ?? 0) + 1);
  }
  const topFailureReasons = Array.from(reasonAgg.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const cnd = (await sql`
    SELECT count(*)::int AS n FROM candidates
  `) as unknown as { n: number }[];

  const outcomeFunnel = await computeOutcomeFunnel();

  return {
    byStatus: statusRows.map((r) => ({ status: r.status, count: r.n })),
    byPortal,
    topFailureReasons,
    totalCandidates: cnd[0]?.n ?? 0,
    outcomeFunnel,
  };
}

async function computeOutcomeFunnel(): Promise<OutcomeFunnel> {
  const rows = (await sql`
    SELECT outcome, count(*)::int AS n
    FROM saved_listings
    WHERE status = 'submitted'
    GROUP BY outcome
  `) as unknown as { outcome: string; n: number }[];

  const f: OutcomeFunnel = {
    submitted: 0,
    pending: 0,
    confirmed: 0,
    screening: 0,
    interviewing: 0,
    offer: 0,
    accepted: 0,
    declined: 0,
    rejected: 0,
    ghosted: 0,
  };

  for (const r of rows) {
    f.submitted += r.n;
    if (r.outcome in f) {
      (f as unknown as Record<string, number>)[r.outcome] = r.n;
    }
  }

  return f;
}

export async function computeLlmSpend(): Promise<LlmSpendSummary> {
  const totals = (await sql`
    SELECT
      count(*)::int AS calls,
      COALESCE(SUM(CASE WHEN byok THEN 1 ELSE 0 END), 0)::int AS byok_calls,
      COALESCE(SUM(cost_micro_cents), 0) AS spent,
      COALESCE(SUM(input_tokens), 0)::bigint AS input_tokens,
      COALESCE(SUM(output_tokens), 0)::bigint AS output_tokens
    FROM llm_usage
  `) as unknown as {
    calls: number;
    byok_calls: number;
    spent: string | number;
    input_tokens: string | number;
    output_tokens: string | number;
  }[];

  const modelRows = (await sql`
    SELECT provider, model,
      count(*)::int AS calls,
      COALESCE(SUM(CASE WHEN byok THEN 1 ELSE 0 END), 0)::int AS byok_calls,
      COALESCE(SUM(cost_micro_cents), 0) AS cost_micro_cents
    FROM llm_usage
    GROUP BY provider, model
    ORDER BY calls DESC
    LIMIT 8
  `) as unknown as {
    provider: string;
    model: string;
    calls: number;
    byok_calls: number;
    cost_micro_cents: string | number;
  }[];

  const byokCandidateRows = (await sql`
    SELECT count(DISTINCT candidate_id)::int AS n
    FROM candidate_byok_keys
    WHERE is_active = true
  `) as unknown as { n: number }[];

  const t = totals[0];
  const totalSpent =
    typeof t?.spent === "string" ? parseInt(t.spent, 10) : (t?.spent ?? 0);
  const totalIn =
    typeof t?.input_tokens === "string"
      ? parseInt(t.input_tokens, 10)
      : Number(t?.input_tokens ?? 0);
  const totalOut =
    typeof t?.output_tokens === "string"
      ? parseInt(t.output_tokens, 10)
      : Number(t?.output_tokens ?? 0);

  return {
    totalCalls: t?.calls ?? 0,
    byokCalls: t?.byok_calls ?? 0,
    paidCalls: (t?.calls ?? 0) - (t?.byok_calls ?? 0),
    totalSpentMicroCents: totalSpent,
    totalInputTokens: totalIn,
    totalOutputTokens: totalOut,
    byokCandidates: byokCandidateRows[0]?.n ?? 0,
    byModel: modelRows.map((r) => ({
      provider: r.provider,
      model: r.model,
      calls: r.calls,
      byokCalls: r.byok_calls,
      costMicroCents:
        typeof r.cost_micro_cents === "string"
          ? parseInt(r.cost_micro_cents, 10)
          : r.cost_micro_cents,
    })),
  };
}
