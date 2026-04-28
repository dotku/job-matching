import "server-only";

import { sql } from "./db";

export interface CandidateInput {
  email: string;
  fullName: string;
  /** R2 object key for the resume PDF (not a URL). */
  resumeKey: string;
  linkedinUrl: string;
  targetRoles?: string;
  targetLocations?: string;
  graduationYear?: string;
  workAuthorization?: string;
  notes?: string;
}

export interface Candidate extends CandidateInput {
  id: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedListingInput {
  listingId: string;
  companyName: string;
  title: string;
  url: string;
  category?: string;
  locations?: string[];
  sponsorship?: string;
}

export type SubmitStatus =
  | "queued"
  | "submitting"
  | "submitted"
  | "failed"
  | "skipped";

export type Outcome =
  | "pending"
  | "confirmed"
  | "rejected"
  | "screening"
  | "interviewing"
  | "offer"
  | "accepted"
  | "declined"
  | "ghosted";

export type OutcomeSource = "email" | "manual" | "ats_api" | "timeout";

export interface SavedListing extends SavedListingInput {
  id: string;
  candidateId: string;
  status: SubmitStatus;
  statusNote: string | null;
  savedAt: string;
  submittedAt: string | null;
  /** Count of submission_answers rows for this listing (0 when none). */
  answerCount: number;
  outcome: Outcome;
  outcomeNote: string | null;
  outcomeUpdatedAt: string | null;
  outcomeSource: OutcomeSource | null;
  failureReason: string | null;
  failureScreenshotKey: string | null;
  attemptCount: number;
}

interface CandidateRow {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  resume_key: string;
  linkedin_url: string;
  target_roles: string | null;
  target_locations: string | null;
  graduation_year: string | null;
  work_authorization: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SavedListingRow {
  id: string;
  candidate_id: string;
  listing_id: string;
  company_name: string;
  title: string;
  url: string;
  category: string | null;
  locations: string[] | null;
  sponsorship: string | null;
  status: SubmitStatus;
  status_note: string | null;
  saved_at: string;
  submitted_at: string | null;
  answer_count?: number;
  outcome: Outcome;
  outcome_note: string | null;
  outcome_updated_at: string | null;
  outcome_source: OutcomeSource | null;
  failure_reason: string | null;
  failure_screenshot_key: string | null;
  attempt_count: number;
}

function rowToCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone ?? "",
    fullName: row.full_name,
    resumeKey: row.resume_key,
    linkedinUrl: row.linkedin_url,
    targetRoles: row.target_roles ?? undefined,
    targetLocations: row.target_locations ?? undefined,
    graduationYear: row.graduation_year ?? undefined,
    workAuthorization: row.work_authorization ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToSaved(row: SavedListingRow): SavedListing {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    listingId: row.listing_id,
    companyName: row.company_name,
    title: row.title,
    url: row.url,
    category: row.category ?? undefined,
    locations: row.locations ?? undefined,
    sponsorship: row.sponsorship ?? undefined,
    status: row.status,
    statusNote: row.status_note,
    savedAt: row.saved_at,
    submittedAt: row.submitted_at,
    answerCount: row.answer_count ?? 0,
    outcome: row.outcome,
    outcomeNote: row.outcome_note,
    outcomeUpdatedAt: row.outcome_updated_at,
    outcomeSource: row.outcome_source,
    failureReason: row.failure_reason,
    failureScreenshotKey: row.failure_screenshot_key,
    attemptCount: row.attempt_count,
  };
}

export interface OutcomeUpdate {
  outcome: Outcome;
  source: OutcomeSource;
  note?: string;
}

/**
 * Set the outcome for a single saved_listing. The worker reports the submit
 * pipeline; this is for the post-submit lifecycle (email/manual/ats_api).
 */
export async function updateOutcome(
  savedListingId: string,
  update: OutcomeUpdate,
): Promise<void> {
  await sql`
    UPDATE saved_listings
    SET outcome = ${update.outcome},
        outcome_source = ${update.source},
        outcome_note = ${update.note ?? null},
        outcome_updated_at = now()
    WHERE id = ${savedListingId}
      AND status = 'submitted'
  `;
}

export interface OutcomeCounts {
  pending: number;
  confirmed: number;
  rejected: number;
  screening: number;
  interviewing: number;
  offer: number;
  accepted: number;
  declined: number;
  ghosted: number;
}

/**
 * Aggregate outcome counts for a candidate's submitted applications. Useful
 * for the dashboard summary card on /apply.
 */
export async function getOutcomeCounts(
  candidateId: string,
): Promise<OutcomeCounts> {
  const rows = (await sql`
    SELECT outcome, count(*)::int AS n
    FROM saved_listings
    WHERE candidate_id = ${candidateId}
      AND status = 'submitted'
    GROUP BY outcome
  `) as unknown as { outcome: Outcome; n: number }[];

  const init: OutcomeCounts = {
    pending: 0,
    confirmed: 0,
    rejected: 0,
    screening: 0,
    interviewing: 0,
    offer: 0,
    accepted: 0,
    declined: 0,
    ghosted: 0,
  };

  for (const r of rows) init[r.outcome] = r.n;

  return init;
}

export interface UpsertCandidateParams extends CandidateInput {
  phone: string;
}

const UUID_REGEX =
  "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

/**
 * Absorb any guest/anon candidate rows that hold the email the current
 * authenticated user is about to save. Email is the identity anchor —
 * phone is informational only and does NOT block signups.
 *
 * Strategy:
 *   - If no auth row exists yet, reassign the most data-rich guest
 *     blocker's external_id to us (so the user keeps their guest work).
 *   - For any remaining guest blockers, move their saved_listings into
 *     our auth row (skipping duplicates), then delete them.
 */
async function absorbGuestBlockers(
  externalId: string,
  email: string,
): Promise<void> {
  const existingAuth = (await sql`
    SELECT id FROM candidates WHERE external_id = ${externalId} LIMIT 1
  `) as unknown as { id: string }[];
  let authRowId = existingAuth[0]?.id;

  if (!authRowId) {
    const claimed = (await sql`
      UPDATE candidates
      SET external_id = ${externalId}
      WHERE id = (
        SELECT id FROM candidates
        WHERE external_id != ${externalId}
          AND external_id ~ ${UUID_REGEX}
          AND lower(email) = lower(${email})
        ORDER BY
          (CASE WHEN resume_key IS NOT NULL AND resume_key <> '' THEN 0 ELSE 1 END),
          created_at ASC
        LIMIT 1
      )
      RETURNING id
    `) as unknown as { id: string }[];

    authRowId = claimed[0]?.id;
  }

  if (!authRowId) return;

  const blockers = (await sql`
    SELECT id FROM candidates
    WHERE id != ${authRowId}
      AND external_id ~ ${UUID_REGEX}
      AND lower(email) = lower(${email})
  `) as unknown as { id: string }[];

  for (const b of blockers) {
    await sql`
      UPDATE saved_listings
      SET candidate_id = ${authRowId}
      WHERE candidate_id = ${b.id}
        AND NOT EXISTS (
          SELECT 1 FROM saved_listings s2
          WHERE s2.candidate_id = ${authRowId}
            AND s2.listing_id = saved_listings.listing_id
        )
    `;
    await sql`DELETE FROM candidates WHERE id = ${b.id}`;
  }
}

export async function upsertCandidate(
  externalId: string,
  input: UpsertCandidateParams,
): Promise<Candidate> {
  const phone = input.phone;

  await absorbGuestBlockers(externalId, input.email);

  try {
    const rows = (await sql`
      INSERT INTO candidates (
        external_id, email, phone, full_name, resume_key, linkedin_url,
        target_roles, target_locations, graduation_year, work_authorization, notes
      ) VALUES (
        ${externalId}, ${input.email}, ${phone}, ${input.fullName}, ${input.resumeKey}, ${input.linkedinUrl},
        ${input.targetRoles ?? null}, ${input.targetLocations ?? null},
        ${input.graduationYear ?? null}, ${input.workAuthorization ?? null}, ${input.notes ?? null}
      )
      ON CONFLICT (external_id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name,
        resume_key = EXCLUDED.resume_key,
        linkedin_url = EXCLUDED.linkedin_url,
        target_roles = EXCLUDED.target_roles,
        target_locations = EXCLUDED.target_locations,
        graduation_year = EXCLUDED.graduation_year,
        work_authorization = EXCLUDED.work_authorization,
        notes = EXCLUDED.notes
      RETURNING *
    `) as unknown as CandidateRow[];

    return rowToCandidate(rows[0]);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    if (/candidates_email_key/.test(message)) {
      throw new Error(
        "This email is registered to another verified account. Sign in with the provider originally used for it, or reach out for help if this is your email.",
      );
    }
    throw e;
  }
}

export async function getCandidateByExternalId(
  externalId: string,
): Promise<Candidate | null> {
  const rows = (await sql`
    SELECT * FROM candidates WHERE external_id = ${externalId} LIMIT 1
  `) as unknown as CandidateRow[];

  return rows[0] ? rowToCandidate(rows[0]) : null;
}

export async function saveListing(
  candidateId: string,
  input: SavedListingInput,
): Promise<SavedListing> {
  const rows = (await sql`
    INSERT INTO saved_listings (
      candidate_id, listing_id, company_name, title, url,
      category, locations, sponsorship
    ) VALUES (
      ${candidateId}, ${input.listingId}, ${input.companyName}, ${input.title}, ${input.url},
      ${input.category ?? null}, ${JSON.stringify(input.locations ?? [])}::jsonb, ${input.sponsorship ?? null}
    )
    ON CONFLICT (candidate_id, listing_id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      title = EXCLUDED.title,
      url = EXCLUDED.url
    RETURNING *
  `) as unknown as SavedListingRow[];

  return rowToSaved(rows[0]);
}

export async function listSavedForCandidate(
  candidateId: string,
): Promise<SavedListing[]> {
  const rows = (await sql`
    SELECT s.*,
      (SELECT count(*)::int FROM submission_answers WHERE saved_listing_id = s.id) AS answer_count
    FROM saved_listings s
    WHERE s.candidate_id = ${candidateId}
    ORDER BY s.saved_at DESC
  `) as unknown as SavedListingRow[];

  return rows.map(rowToSaved);
}

export async function countSavedForCandidate(
  candidateId: string,
): Promise<number> {
  const rows = (await sql`
    SELECT count(*)::int AS n FROM saved_listings WHERE candidate_id = ${candidateId}
  `) as unknown as { n: number }[];

  return rows[0]?.n ?? 0;
}

export async function clearSavedForCandidate(
  candidateId: string,
): Promise<void> {
  await sql`DELETE FROM saved_listings WHERE candidate_id = ${candidateId}`;
}

export interface SubmissionAnswer {
  id: string;
  savedListingId: string;
  candidateId: string;
  question: string;
  generatedAnswer: string;
  finalAnswer: string;
  userOverride: string | null;
  questionType: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionAnswerRow {
  id: string;
  saved_listing_id: string;
  candidate_id: string;
  question: string;
  generated_answer: string;
  final_answer: string;
  user_override: string | null;
  question_type: string | null;
  created_at: string;
  updated_at: string;
}

function rowToAnswer(row: SubmissionAnswerRow): SubmissionAnswer {
  return {
    id: row.id,
    savedListingId: row.saved_listing_id,
    candidateId: row.candidate_id,
    question: row.question,
    generatedAnswer: row.generated_answer,
    finalAnswer: row.final_answer,
    userOverride: row.user_override,
    questionType: row.question_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAnswersForListing(
  candidateId: string,
  savedListingId: string,
): Promise<SubmissionAnswer[]> {
  const rows = (await sql`
    SELECT * FROM submission_answers
    WHERE saved_listing_id = ${savedListingId}
      AND candidate_id = ${candidateId}
    ORDER BY created_at ASC
  `) as unknown as SubmissionAnswerRow[];

  return rows.map(rowToAnswer);
}

export interface PortalCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  url?: string;
}

export async function setCandidateCookiesEnc(
  candidateId: string,
  encrypted: string | null,
): Promise<void> {
  await sql`
    UPDATE candidates SET auto_apply_cookies_enc = ${encrypted}
    WHERE id = ${candidateId}
  `;
}

export async function getCandidateCookiesEnc(
  candidateId: string,
): Promise<string | null> {
  const rows = (await sql`
    SELECT auto_apply_cookies_enc FROM candidates WHERE id = ${candidateId} LIMIT 1
  `) as unknown as { auto_apply_cookies_enc: string | null }[];

  return rows[0]?.auto_apply_cookies_enc ?? null;
}

export async function updateCandidateLocations(
  candidateId: string,
  targetLocations: string,
): Promise<Candidate | null> {
  const rows = (await sql`
    UPDATE candidates
    SET target_locations = ${targetLocations}
    WHERE id = ${candidateId}
    RETURNING *
  `) as unknown as CandidateRow[];

  return rows[0] ? rowToCandidate(rows[0]) : null;
}

export interface ProfileDetailsUpdate {
  fullName: string;
  linkedinUrl: string;
  targetRoles: string;
  graduationYear: string;
  workAuthorization: string;
  notes: string;
}

/**
 * Partial update for the non-identity profile fields — does NOT touch
 * email, phone, resume_key, or external_id. Used by /profile to let the
 * candidate edit resume-derived fields post-hoc without re-uploading.
 */
export async function updateCandidateDetails(
  candidateId: string,
  update: ProfileDetailsUpdate,
): Promise<Candidate | null> {
  const rows = (await sql`
    UPDATE candidates
    SET full_name = ${update.fullName},
        linkedin_url = ${update.linkedinUrl},
        target_roles = ${update.targetRoles || null},
        graduation_year = ${update.graduationYear || null},
        work_authorization = ${update.workAuthorization || null},
        notes = ${update.notes || null}
    WHERE id = ${candidateId}
    RETURNING *
  `) as unknown as CandidateRow[];

  return rows[0] ? rowToCandidate(rows[0]) : null;
}

export async function updateAnswerOverride(
  candidateId: string,
  answerId: string,
  override: string | null,
): Promise<SubmissionAnswer | null> {
  const rows = (await sql`
    UPDATE submission_answers
    SET user_override = ${override && override.trim() ? override : null}
    WHERE id = ${answerId}
      AND candidate_id = ${candidateId}
    RETURNING *
  `) as unknown as SubmissionAnswerRow[];

  return rows[0] ? rowToAnswer(rows[0]) : null;
}

/**
 * Flip a queued/failed listing to 'skipped' with a human-readable reason.
 * Used by the sponsorship pre-filter — we don't want to enqueue listings
 * that will definitely fail because the employer doesn't match the
 * candidate's visa status.
 */
export async function markSavedListingSkipped(
  candidateId: string,
  savedListingId: string,
  reason: string,
): Promise<SavedListing | null> {
  const rows = (await sql`
    UPDATE saved_listings
    SET status = 'skipped',
        status_note = ${reason}
    WHERE id = ${savedListingId}
      AND candidate_id = ${candidateId}
      AND status <> 'submitted'
    RETURNING *
  `) as unknown as SavedListingRow[];

  return rows[0] ? rowToSaved(rows[0]) : null;
}

export async function manuallyMarkSubmitted(
  candidateId: string,
  savedListingId: string,
): Promise<SavedListing | null> {
  const rows = (await sql`
    UPDATE saved_listings
    SET status = 'submitted',
        submitted_at = COALESCE(submitted_at, now()),
        status_note = 'Manually marked as submitted by candidate.'
    WHERE id = ${savedListingId}
      AND candidate_id = ${candidateId}
      AND status <> 'submitted'
    RETURNING *
  `) as unknown as SavedListingRow[];

  return rows[0] ? rowToSaved(rows[0]) : null;
}

export async function removeSavedListing(
  candidateId: string,
  savedListingId: string,
): Promise<boolean> {
  const result = (await sql`
    DELETE FROM saved_listings
    WHERE id = ${savedListingId} AND candidate_id = ${candidateId}
    RETURNING id
  `) as unknown as { id: string }[];

  return result.length > 0;
}

/**
 * Reset a failed or skipped listing back to 'queued' so auto-submit will
 * pick it up again. Only allowed from those two states — submitted rows
 * are intentionally left alone to avoid duplicate submissions.
 */
export async function resetSavedListing(
  candidateId: string,
  savedListingId: string,
): Promise<SavedListing | null> {
  const rows = (await sql`
    UPDATE saved_listings
    SET status = 'queued',
        status_note = NULL,
        submitted_at = NULL
    WHERE id = ${savedListingId}
      AND candidate_id = ${candidateId}
      AND status IN ('failed', 'skipped')
    RETURNING *
  `) as unknown as SavedListingRow[];

  return rows[0] ? rowToSaved(rows[0]) : null;
}
