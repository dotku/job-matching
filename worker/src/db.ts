import { neon } from "@neondatabase/serverless";

import { config } from "./config.js";

export const sql = neon(config.databaseUrl);

export type SubmissionStatus =
  | "queued"
  | "submitting"
  | "submitted"
  | "failed"
  | "skipped";

export async function markSubmitting(
  savedListingId: string,
  note: string | null = null,
): Promise<void> {
  // attempt_count is incremented here (start of attempt). Increment is
  // capped at the SQL level so a long-running stuck row doesn't burn it
  // down on every restart.
  await sql`
    UPDATE saved_listings
    SET status = 'submitting',
        status_note = ${note},
        attempt_count = attempt_count + 1
    WHERE id = ${savedListingId}
      AND status IN ('queued', 'submitting', 'failed', 'skipped')
  `;
}

export async function markSubmitted(
  savedListingId: string,
  note: string | null = null,
): Promise<void> {
  await sql`
    UPDATE saved_listings
    SET status = 'submitted',
        submitted_at = now(),
        status_note = ${note},
        outcome = CASE WHEN outcome = 'pending' THEN 'pending' ELSE outcome END,
        failure_reason = NULL,
        failure_screenshot_key = NULL
    WHERE id = ${savedListingId}
  `;
}

export interface FailureDetail {
  reason?: string;
  screenshotKey?: string;
}

export async function markFailed(
  savedListingId: string,
  note: string,
  detail: FailureDetail = {},
): Promise<void> {
  await sql`
    UPDATE saved_listings
    SET status = 'failed',
        status_note = ${note},
        failure_reason = ${detail.reason ?? null},
        failure_screenshot_key = ${detail.screenshotKey ?? null}
    WHERE id = ${savedListingId}
  `;
}

export async function markSkipped(
  savedListingId: string,
  note: string,
): Promise<void> {
  await sql`
    UPDATE saved_listings
    SET status = 'skipped',
        status_note = ${note}
    WHERE id = ${savedListingId}
  `;
}

/**
 * On worker boot, any rows still stuck in 'submitting' are from a crashed
 * previous run. Reset them to 'failed' with a clear note so the user can
 * Retry from the dashboard.
 */
export async function resetStuckSubmitting(): Promise<number> {
  const rows = (await sql`
    UPDATE saved_listings
    SET status = 'failed',
        status_note = 'Worker restarted mid-submission — retry to re-queue.'
    WHERE status = 'submitting'
    RETURNING id
  `) as unknown as { id: string }[];

  return rows.length;
}

export interface CandidateRow {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  linkedin_url: string;
  target_roles: string | null;
  target_locations: string | null;
  graduation_year: string | null;
  work_authorization: string | null;
}

export async function getCandidate(
  candidateId: string,
): Promise<CandidateRow | null> {
  const rows = (await sql`
    SELECT id, email, phone, full_name, linkedin_url,
           target_roles, target_locations, graduation_year, work_authorization
    FROM candidates WHERE id = ${candidateId} LIMIT 1
  `) as unknown as CandidateRow[];

  return rows[0] ?? null;
}

export async function getCandidateCookieBlob(
  candidateId: string,
): Promise<string | null> {
  const rows = (await sql`
    SELECT auto_apply_cookies_enc FROM candidates WHERE id = ${candidateId} LIMIT 1
  `) as unknown as { auto_apply_cookies_enc: string | null }[];

  return rows[0]?.auto_apply_cookies_enc ?? null;
}

/**
 * Check whether this candidate has already submitted an application to the
 * same company within the dedup window (default 90 days). Prevents burning
 * quota on duplicate applications when the same role appears twice in the
 * listings feed or the user re-queues the same company.
 */
export async function hasRecentSubmission(
  candidateId: string,
  savedListingId: string,
  companyName: string,
  windowDays = 90,
): Promise<{ submittedAt: string; title: string } | null> {
  const rows = (await sql`
    SELECT submitted_at, title
    FROM saved_listings
    WHERE candidate_id = ${candidateId}
      AND id <> ${savedListingId}
      AND company_name = ${companyName}
      AND status = 'submitted'
      AND submitted_at IS NOT NULL
      AND submitted_at > now() - (${windowDays} || ' days')::interval
    ORDER BY submitted_at DESC
    LIMIT 1
  `) as unknown as { submitted_at: string; title: string }[];

  return rows[0]
    ? { submittedAt: rows[0].submitted_at, title: rows[0].title }
    : null;
}

/**
 * Look up the most recent user_override for a given question (case-insensitive)
 * that this candidate has set on a past submission. Lets us reuse the user's
 * preferred answer without re-calling the LLM.
 */
export async function findOverrideForQuestion(
  candidateId: string,
  question: string,
): Promise<string | null> {
  const rows = (await sql`
    SELECT user_override FROM submission_answers
    WHERE candidate_id = ${candidateId}
      AND lower(question) = lower(${question})
      AND user_override IS NOT NULL
      AND user_override <> ''
    ORDER BY updated_at DESC
    LIMIT 1
  `) as unknown as { user_override: string | null }[];

  return rows[0]?.user_override ?? null;
}

export interface InsertAnswerInput {
  savedListingId: string;
  candidateId: string;
  question: string;
  generatedAnswer: string;
  finalAnswer: string;
  questionType: string;
}

export async function insertSubmissionAnswer(
  input: InsertAnswerInput,
): Promise<void> {
  await sql`
    INSERT INTO submission_answers (
      saved_listing_id, candidate_id, question,
      generated_answer, final_answer, question_type
    ) VALUES (
      ${input.savedListingId}, ${input.candidateId}, ${input.question},
      ${input.generatedAnswer}, ${input.finalAnswer}, ${input.questionType}
    )
  `;
}

export interface SavedListingSummary {
  company_name: string;
  title: string;
}

export async function getSavedListingSummary(
  id: string,
): Promise<SavedListingSummary | null> {
  const rows = (await sql`
    SELECT company_name, title FROM saved_listings WHERE id = ${id} LIMIT 1
  `) as unknown as SavedListingSummary[];

  return rows[0] ?? null;
}
