import "server-only";

import { getGoogleAccessToken, searchGmail } from "./gmail";
import { listSavedForCandidate, type SavedListing } from "./candidates";
import { sql } from "./db";
import {
  canMakeBillableCall,
  getCandidateBilling,
  type LlmBilling,
} from "./llm-usage";
import {
  fuzzyMatchCompany,
  llmClassifyEmailAndLog,
  type LlmClassifyDecision,
} from "./verify-llm";

export interface VerifyMatch {
  company: string;
  subject: string;
  from: string;
  rationale: string;
  /** The saved company_name that the LLM-extracted company fuzzy-matched to. */
  matchedListingCompany: string;
}

export interface ScannedEmailDiag {
  from: string;
  subject: string;
  /** Classifier result — "confirmed", "not-confirmation", or "no-matching-listing". */
  outcome: "confirmed" | "not-confirmation" | "no-matching-listing";
  llmCompanyName: string | null;
  rationale: string;
  /** Which provider/model answered, tokens spent, and whether the user paid via BYOK. */
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  byok: boolean;
  /** Cost in micro-cents (10^-8 USD) — 0 when byok=true. */
  costMicroCents: number;
}

export interface VerifyResult {
  scanned: number;
  updated: number;
  llmCalls: number;
  matched: VerifyMatch[];
  /** All scanned emails + what the classifier concluded, for UI transparency. */
  scannedEmails: ScannedEmailDiag[];
  /** Set when the run was skipped because the candidate is out of credits and has no BYOK. */
  skippedReason?: string;
}

/**
 * Broad Gmail query in the last 90 days. Previous iterations tried to pre-
 * filter by company-name keyword; that turned out to miss confirmation
 * emails whose subject doesn't mention the company. We now send every
 * matching email to the LLM for classification (cap below bounds cost).
 */
const QUERY =
  '(application OR applied OR applying OR "thank you for" OR "thanks for" OR "we received" OR "received your" OR "your interest" OR submitted) newer_than:90d';

/** Hard cap on LLM calls per verify run — bounds both latency and spend. */
const MAX_LLM_CALLS_PER_RUN = 50;

export async function verifyCandidateSubmissions(
  candidateId: string,
  auth0UserId: string,
): Promise<VerifyResult> {
  const billing = await getCandidateBilling(candidateId);

  if (!billing) {
    throw new Error("Candidate not found");
  }
  if (!canMakeBillableCall(billing)) {
    return {
      scanned: 0,
      updated: 0,
      llmCalls: 0,
      matched: [],
      scannedEmails: [],
      skippedReason:
        "Out of LLM credits. Add your own API key (Settings → BYOK) or top up.",
    };
  }

  const token = await getGoogleAccessToken(auth0UserId);

  if (!token) {
    throw new Error(
      "Gmail access token not available — user may need to re-login to grant Gmail scope.",
    );
  }

  const messages = await searchGmail(token, QUERY, 50);
  const listings = await listSavedForCandidate(candidateId);
  const unsubmitted = listings.filter((l) => l.status !== "submitted");

  const matched: VerifyMatch[] = [];
  const scannedEmails: ScannedEmailDiag[] = [];
  let updated = 0;
  let llmCalls = 0;
  const alreadyMatchedListingIds = new Set<string>();
  let remainingCredits = billing.creditsMicroCents;

  for (const email of messages) {
    if (llmCalls >= MAX_LLM_CALLS_PER_RUN) break;
    if (!billing.hasByokKey && remainingCredits <= 0) break;

    llmCalls += 1;

    let decision: LlmClassifyDecision;

    try {
      decision = await llmClassifyEmailAndLog({
        candidateId,
        contextRef: null,
        billing,
        email: {
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          receivedAt: email.internalDate,
        },
      });
    } catch (e) {
      scannedEmails.push({
        from: email.from,
        subject: email.subject,
        outcome: "not-confirmation",
        llmCompanyName: null,
        rationale: `LLM call failed: ${e instanceof Error ? e.message : String(e)}`,
        provider: "unknown",
        model: "unknown",
        inputTokens: 0,
        outputTokens: 0,
        byok: billing.hasByokKey,
        costMicroCents: 0,
      });
      continue;
    }

    // Track credit burn locally so we can early-exit before the balance is
    // actually refreshed from the DB.
    const callCost = approxCost(decision);

    if (!decision.byok) {
      remainingCredits -= callCost;
    }

    const telemetry = {
      provider: decision.provider,
      model: decision.model,
      inputTokens: decision.inputTokens,
      outputTokens: decision.outputTokens,
      byok: decision.byok,
      costMicroCents: decision.byok ? 0 : callCost,
    };

    if (!decision.isConfirmation || !decision.companyName) {
      scannedEmails.push({
        from: email.from,
        subject: email.subject,
        outcome: "not-confirmation",
        llmCompanyName: null,
        rationale: decision.rationale.slice(0, 200),
        ...telemetry,
      });
      continue;
    }

    const listing = fuzzyMatchCompany(
      decision.companyName,
      unsubmitted.filter((l) => !alreadyMatchedListingIds.has(l.id)),
    );

    if (!listing) {
      scannedEmails.push({
        from: email.from,
        subject: email.subject,
        outcome: "no-matching-listing",
        llmCompanyName: decision.companyName,
        rationale: decision.rationale.slice(0, 200),
        ...telemetry,
      });
      continue;
    }

    await markSubmitted(candidateId, listing, email, decision);
    alreadyMatchedListingIds.add(listing.id);
    updated += 1;
    matched.push({
      company: decision.companyName,
      subject: email.subject.slice(0, 120),
      from: email.from,
      rationale: decision.rationale.slice(0, 200),
      matchedListingCompany: listing.companyName,
    });
    scannedEmails.push({
      from: email.from,
      subject: email.subject,
      outcome: "confirmed",
      llmCompanyName: decision.companyName,
      rationale: decision.rationale.slice(0, 200),
      ...telemetry,
    });
  }

  return {
    scanned: messages.length,
    updated,
    llmCalls,
    matched,
    scannedEmails,
  };
}

async function markSubmitted(
  candidateId: string,
  listing: SavedListing,
  email: { from: string; subject: string; internalDate: number },
  decision: LlmClassifyDecision,
): Promise<void> {
  const submittedAt = new Date(email.internalDate).toISOString();
  const note = `Confirmed by email from ${email.from} on ${new Date(email.internalDate).toLocaleDateString()} — ${decision.rationale.slice(0, 200)}`;

  await sql`
    UPDATE saved_listings
    SET status = 'submitted',
        submitted_at = ${submittedAt}::timestamptz,
        status_note = ${note}
    WHERE id = ${listing.id}
      AND candidate_id = ${candidateId}
  `;
}

/** Rough pre-check of remaining balance so we bail before a round-trip. */
function approxCost(d: LlmClassifyDecision): number {
  if (d.byok) return 0;

  return d.inputTokens * 10 + d.outputTokens * 40;
}

export interface VerifyAllResult {
  candidatesChecked: number;
  candidatesWithErrors: number;
  candidatesSkipped: number;
  totalUpdated: number;
  errors: { candidateId: string; error: string }[];
}

export async function verifyAllCandidates(): Promise<VerifyAllResult> {
  const rows = (await sql`
    SELECT id, external_id FROM candidates
    WHERE external_id LIKE 'google-oauth2|%'
    ORDER BY updated_at DESC
  `) as unknown as { id: string; external_id: string }[];

  const errors: { candidateId: string; error: string }[] = [];
  let totalUpdated = 0;
  let withErrors = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const result = await verifyCandidateSubmissions(row.id, row.external_id);

      totalUpdated += result.updated;
      if (result.skippedReason) skipped += 1;
    } catch (e) {
      withErrors += 1;
      errors.push({
        candidateId: row.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    candidatesChecked: rows.length,
    candidatesWithErrors: withErrors,
    candidatesSkipped: skipped,
    totalUpdated,
    errors,
  };
}
