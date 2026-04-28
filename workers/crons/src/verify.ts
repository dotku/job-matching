import {
  listGoogleCandidates,
  listUnsubmittedForCandidate,
  logLlmCall,
  markListingSubmitted,
  type CandidateLite,
  type SavedListingLite,
} from "./db.js";
import type { Env } from "./env.js";
import {
  getGoogleAccessToken,
  searchGmail,
  type GmailMessageMeta,
} from "./gmail.js";
import {
  computeCostMicroCents,
  fuzzyMatchCompany,
  llmClassifyEmail,
} from "./match.js";

const GMAIL_QUERY =
  '(application OR applied OR applying OR "thank you for" OR "thanks for" OR "we received" OR "received your" OR "your interest" OR submitted) newer_than:90d';

const MAX_LLM_CALLS_PER_CANDIDATE = 50;

export async function runVerifySubmissions(env: Env): Promise<{
  candidatesChecked: number;
  candidatesSkipped: number;
  totalUpdated: number;
  totalLlmCalls: number;
  errors: number;
}> {
  const candidates = await listGoogleCandidates(env);
  let totalUpdated = 0;
  let totalLlmCalls = 0;
  let errors = 0;
  let skipped = 0;

  for (const cand of candidates) {
    try {
      const hasByok = !!cand.active_byok;

      if (!hasByok && cand.llm_credits_micro_cents <= 0) {
        skipped += 1;
        continue;
      }

      const token = await getGoogleAccessToken(env, cand.external_id);

      if (!token) continue;

      const messages = await searchGmail(token, GMAIL_QUERY, 50);
      const unsubmitted = await listUnsubmittedForCandidate(env, cand.id);
      const stats = await processCandidate(env, cand, unsubmitted, messages);

      totalUpdated += stats.updated;
      totalLlmCalls += stats.llmCalls;
    } catch (e) {
      errors += 1;
      console.error(
        `[verify] candidate ${cand.id} failed:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return {
    candidatesChecked: candidates.length,
    candidatesSkipped: skipped,
    totalUpdated,
    totalLlmCalls,
    errors,
  };
}

async function processCandidate(
  env: Env,
  cand: CandidateLite,
  unsubmitted: SavedListingLite[],
  messages: GmailMessageMeta[],
): Promise<{ updated: number; llmCalls: number }> {
  let credits = cand.llm_credits_micro_cents;
  const hasByok = !!cand.active_byok;
  let updated = 0;
  let llmCalls = 0;
  const alreadyMatched = new Set<string>();

  for (const email of messages) {
    if (llmCalls >= MAX_LLM_CALLS_PER_CANDIDATE) break;
    if (!hasByok && credits <= 0) break;

    llmCalls += 1;

    let decision: Awaited<ReturnType<typeof llmClassifyEmail>>;

    try {
      decision = await llmClassifyEmail(
        env,
        {
          byokProvider: cand.active_byok?.provider ?? null,
          byokModel: cand.active_byok?.model ?? null,
          byokApiKeyEnc: cand.active_byok?.api_key_enc ?? null,
        },
        {
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          receivedAt: email.internalDate,
        },
      );
    } catch (e) {
      console.error(
        `[verify] classify failed for candidate ${cand.id}:`,
        e instanceof Error ? e.message : e,
      );
      continue;
    }

    const cost = decision.byok
      ? 0
      : computeCostMicroCents(
          decision.model,
          decision.inputTokens,
          decision.outputTokens,
        );

    await logLlmCall(env, {
      candidateId: cand.id,
      kind: "email_match",
      provider: decision.provider,
      model: decision.model,
      inputTokens: decision.inputTokens,
      outputTokens: decision.outputTokens,
      costMicroCents: cost,
      byok: decision.byok,
      contextRef: null,
    });
    if (!decision.byok) credits -= cost;

    if (!decision.isConfirmation || !decision.companyName) continue;

    const available = unsubmitted.filter((l) => !alreadyMatched.has(l.id));
    const listing = fuzzyMatchCompany(decision.companyName, available);

    if (!listing) continue;

    const submittedAtIso = new Date(email.internalDate).toISOString();
    const note = `Confirmed by email from ${email.from} on ${new Date(email.internalDate).toLocaleDateString()} — ${decision.rationale.slice(0, 200)}`;

    await markListingSubmitted(
      env,
      cand.id,
      listing.id,
      submittedAtIso,
      note,
    );
    alreadyMatched.add(listing.id);
    updated += 1;
  }

  return { updated, llmCalls };
}
