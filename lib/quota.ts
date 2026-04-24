import "server-only";

import { sql } from "./db";

export const QUOTA = {
  free: { daily: 5, weekly: 30 },
  trial: { daily: 20 }, // first 24h after signup, weekly cap still 30
  pro: { daily: 50, weekly: 350 },
} as const;

const TRIAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export type Tier = "free" | "pro";

export interface QuotaState {
  tier: Tier;
  inTrial: boolean;
  dailyUsed: number;
  dailyCap: number;
  weeklyUsed: number;
  weeklyCap: number;
  remainingToday: number;
  remainingThisWeek: number;
  canSubmit: boolean;
  blockedReason: string | null;
  resetAt: { daily: string; weekly: string };
}

interface QuotaRow {
  tier: Tier;
  created_at: string;
  daily_used: number;
  weekly_used: number;
}

/**
 * Computes a candidate's submission quota. Only counts rows where
 * status = 'submitted' — failed/queued/skipped don't consume quota.
 *
 * Usage is aggregated across every candidate row that shares the
 * target's email. Email is the identity anchor (it's what employer
 * portals actually receive); phone is informational.
 */
export async function getQuota(candidateId: string): Promise<QuotaState> {
  const rows = (await sql`
    WITH me AS (
      SELECT lower(email) AS email, tier, created_at
      FROM candidates WHERE id = ${candidateId}
    ),
    siblings AS (
      SELECT c.id
      FROM candidates c, me
      WHERE lower(c.email) = me.email
    )
    SELECT
      me.tier,
      me.created_at,
      (
        SELECT count(*)::int FROM saved_listings s
        WHERE s.candidate_id IN (SELECT id FROM siblings)
          AND s.status = 'submitted'
          AND s.submitted_at >= now() - interval '1 day'
      ) AS daily_used,
      (
        SELECT count(*)::int FROM saved_listings s
        WHERE s.candidate_id IN (SELECT id FROM siblings)
          AND s.status = 'submitted'
          AND s.submitted_at >= now() - interval '7 days'
      ) AS weekly_used
    FROM me
    LIMIT 1
  `) as unknown as QuotaRow[];

  const row = rows[0];

  if (!row) {
    throw new Error(`Candidate ${candidateId} not found`);
  }

  const tier = row.tier;
  const inTrial =
    tier === "free" &&
    Date.now() - new Date(row.created_at).getTime() < TRIAL_WINDOW_MS;

  const dailyCap =
    tier === "pro"
      ? QUOTA.pro.daily
      : inTrial
        ? QUOTA.trial.daily
        : QUOTA.free.daily;
  const weeklyCap = tier === "pro" ? QUOTA.pro.weekly : QUOTA.free.weekly;

  const remainingToday = Math.max(0, dailyCap - row.daily_used);
  const remainingThisWeek = Math.max(0, weeklyCap - row.weekly_used);
  const canSubmit = remainingToday > 0 && remainingThisWeek > 0;

  let blockedReason: string | null = null;

  if (remainingToday <= 0)
    blockedReason = `Daily limit reached (${dailyCap}/day on ${tier}).`;
  else if (remainingThisWeek <= 0)
    blockedReason = `Weekly limit reached (${weeklyCap}/week on ${tier}).`;

  const now = new Date();
  const dailyReset = new Date(now);

  dailyReset.setUTCHours(dailyReset.getUTCHours() + 24);
  const weeklyReset = new Date(now);

  weeklyReset.setUTCDate(weeklyReset.getUTCDate() + 7);

  return {
    tier,
    inTrial,
    dailyUsed: row.daily_used,
    dailyCap,
    weeklyUsed: row.weekly_used,
    weeklyCap,
    remainingToday,
    remainingThisWeek,
    canSubmit,
    blockedReason,
    resetAt: {
      daily: dailyReset.toISOString(),
      weekly: weeklyReset.toISOString(),
    },
  };
}

/**
 * Throws if the candidate cannot submit right now. Use as a guard in the
 * (forthcoming) auto-submit pipeline before kicking off a Playwright run.
 */
export async function assertCanSubmit(candidateId: string): Promise<QuotaState> {
  const quota = await getQuota(candidateId);

  if (!quota.canSubmit) {
    throw new Error(quota.blockedReason ?? "Submission quota exhausted");
  }

  return quota;
}
