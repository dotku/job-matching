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

export interface AdminSummary {
  byStatus: { status: string; count: number }[];
  byPortal: { portal: string; count: number; failures: number }[];
  topFailureReasons: { reason: string; count: number }[];
  totalCandidates: number;
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

  return {
    byStatus: statusRows.map((r) => ({ status: r.status, count: r.n })),
    byPortal,
    topFailureReasons,
    totalCandidates: cnd[0]?.n ?? 0,
  };
}
