"use server";

import { revalidatePath } from "next/cache";

import {
  claimOrphanCandidatesForAuth,
  ensureIdentity,
  readIdentity,
} from "@/lib/identity";
import {
  Candidate,
  CandidateInput,
  OutcomeCounts,
  PortalCookie,
  SavedListing,
  SavedListingInput,
  SubmissionAnswer,
  clearSavedForCandidate,
  getCandidateByExternalId,
  getCandidateCookiesEnc,
  getOutcomeCounts,
  listAnswersForListing,
  listSavedForCandidate,
  manuallyMarkSubmitted,
  markSavedListingSkipped,
  removeSavedListing,
  resetSavedListing,
  saveListing,
  setCandidateCookiesEnc,
  updateAnswerOverride,
  ProfileDetailsUpdate,
  updateCandidateDetails,
  updateCandidateLocations,
  upsertCandidate,
} from "@/lib/candidates";
import { encryptJson } from "@/lib/crypto";
import {
  ByokKey,
  ByokProvider,
  addByokKey,
  deleteByokKey as deleteByokKeyRow,
  listByokKeys,
  setActiveByokKey,
} from "@/lib/llm-keys";
import {
  LlmBilling,
  LlmUsageSummary,
  RecentLlmCall,
  getCandidateBilling,
  getRecentLlmCalls,
  getUsageSummary,
} from "@/lib/llm-usage";
import { QuotaState, getQuota } from "@/lib/quota";
import { enqueueSubmit } from "@/lib/queue";
import { getResumeSignedUrl, uploadResumePdf } from "@/lib/r2";
import { verifyCandidateSubmissions } from "@/lib/verify-gmail";
import {
  listingExcludesCandidate,
  parseVisaFromStoredLabel,
} from "@/lib/visa";
import {
  ParsedResume,
  ResumeParseError,
  parseResumeFromPdfBuffer,
} from "@/lib/resume-parser";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface ParseResumeResult {
  resumeKey: string;
  resumeViewUrl: string;
  parsed: ParsedResume;
}

export interface SaveProfileResult {
  candidate: Candidate;
  resumeViewUrl: string;
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

type ProfileFields = Omit<CandidateInput, "resumeKey">;

function parseInputFromForm(formData: FormData): ProfileFields {
  return {
    email: String(formData.get("email") ?? "").trim(),
    fullName: String(formData.get("fullName") ?? "").trim(),
    linkedinUrl: String(formData.get("linkedinUrl") ?? "").trim(),
    targetRoles: String(formData.get("targetRoles") ?? ""),
    targetLocations: String(formData.get("targetLocations") ?? ""),
    graduationYear: String(formData.get("graduationYear") ?? ""),
    workAuthorization: String(formData.get("workAuthorization") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function validateProfile(
  input: ProfileFields,
  hasResume: boolean,
): string | null {
  if (!input.email.includes("@")) return "Invalid email";
  if (!/linkedin\.com/.test(input.linkedinUrl))
    return "LinkedIn URL should be a linkedin.com link";
  if (!input.fullName.trim()) return "Full name is required";
  if (!hasResume) return "Please upload your resume (PDF).";

  return null;
}

function validateFile(file: unknown): File | { error: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file attached." };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return {
      error: `Resume is ${(file.size / 1024 / 1024).toFixed(1)} MB — max is ${MAX_RESUME_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (!file.type.toLowerCase().includes("pdf")) {
    return {
      error: `Only PDF files are accepted (got ${file.type || "unknown"}).`,
    };
  }

  return file;
}

/**
 * Upload a resume and extract structured fields in one shot. Does NOT touch
 * the candidate row — meant to power the "auto-fill on file pick" UX.
 *
 * The client holds on to the returned resumeKey + parsed.phone and submits
 * them via saveProfileAction when the user hits Save.
 */
export async function parseResumeAction(
  formData: FormData,
): Promise<ActionResult<ParseResumeResult>> {
  const fileOrErr = validateFile(formData.get("resumeFile"));

  if ("error" in fileOrErr) return { ok: false, error: fileOrErr.error };

  try {
    const { externalId } = await ensureIdentity();
    const buffer = Buffer.from(await fileOrErr.arrayBuffer());
    const parsed = await parseResumeFromPdfBuffer(buffer);
    const resumeKey = await uploadResumePdf({
      externalId,
      buffer,
      contentType: fileOrErr.type,
    });
    const resumeViewUrl = await getResumeSignedUrl(resumeKey);

    return {
      ok: true,
      data: { resumeKey, resumeViewUrl, parsed },
    };
  } catch (e) {
    const message =
      e instanceof ResumeParseError
        ? e.message
        : e instanceof Error
          ? e.message
          : "Unknown error";

    return { ok: false, error: message };
  }
}

export async function saveProfileAction(
  formData: FormData,
): Promise<ActionResult<SaveProfileResult>> {
  const input = parseInputFromForm(formData);
  const preUploadedKey = String(formData.get("resumeKey") ?? "");
  const preUploadedPhone = String(formData.get("resumePhone") ?? "");
  const file = formData.get("resumeFile");
  const hasFile = file instanceof File && file.size > 0;

  try {
    const { externalId } = await ensureIdentity();
    const existing = await getCandidateByExternalId(externalId);

    let resumeKey = preUploadedKey || existing?.resumeKey || "";
    let phone = preUploadedPhone || existing?.phone || "";

    const hasResume = hasFile || !!resumeKey;
    const err = validateProfile(input, hasResume);

    if (err) return { ok: false, error: err };

    if (hasFile) {
      const fileOrErr = validateFile(file);

      if ("error" in fileOrErr) return { ok: false, error: fileOrErr.error };
      const buffer = Buffer.from(await fileOrErr.arrayBuffer());
      const parsed = await parseResumeFromPdfBuffer(buffer);

      phone = parsed.phone;
      resumeKey = await uploadResumePdf({
        externalId,
        buffer,
        contentType: fileOrErr.type,
      });
    }

    if (!resumeKey || !phone) {
      return {
        ok: false,
        error: "Please upload your resume (PDF) — we couldn't find your phone number.",
      };
    }

    const candidate = await upsertCandidate(externalId, {
      ...input,
      resumeKey,
      phone,
    });
    const resumeViewUrl = await getResumeSignedUrl(resumeKey);

    revalidatePath("/apply");
    revalidatePath("/internships");

    return { ok: true, data: { candidate, resumeViewUrl } };
  } catch (e) {
    const message =
      e instanceof ResumeParseError
        ? e.message
        : e instanceof Error
          ? e.message
          : "Unknown error";

    return { ok: false, error: message };
  }
}

export interface LoadProfileResult {
  candidate: Candidate | null;
  saved: SavedListing[];
  quota: QuotaState | null;
  resumeViewUrl: string;
  isAuthenticated: boolean;
  outcomeCounts: OutcomeCounts | null;
}

export async function loadProfileAction(): Promise<LoadProfileResult> {
  const identity = await readIdentity();

  // Authenticated read: claim any orphan candidate row that belongs to
  // this user (cookie-matched or email-matched) before the lookup. Keeps
  // post-login /apply render in sync with the DB even though page renders
  // aren't Server Actions.
  if (identity.isAuthenticated && identity.externalId) {
    await claimOrphanCandidatesForAuth(
      identity.externalId,
      identity.emailVerified ? identity.email : null,
    );
  }
  const candidate = identity.externalId
    ? await getCandidateByExternalId(identity.externalId)
    : null;
  const saved = candidate ? await listSavedForCandidate(candidate.id) : [];
  const quota = candidate ? await getQuota(candidate.id) : null;
  const outcomeCounts = candidate
    ? await getOutcomeCounts(candidate.id)
    : null;
  const resumeViewUrl = candidate?.resumeKey
    ? await getResumeSignedUrl(candidate.resumeKey)
    : "";

  return {
    candidate,
    saved,
    quota,
    outcomeCounts,
    resumeViewUrl,
    isAuthenticated: identity.isAuthenticated,
  };
}

export async function saveListingAction(
  input: SavedListingInput,
): Promise<ActionResult<SavedListing>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) {
      return {
        ok: false,
        error: "Save your profile first before queueing internships.",
      };
    }
    const saved = await saveListing(candidate.id, input);

    revalidatePath("/apply");

    return { ok: true, data: saved };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";

    return { ok: false, error: message };
  }
}

export async function submitAllQueuedAction(): Promise<
  ActionResult<{ enqueued: number; skipped: number; reason?: string }>
> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) {
      return {
        ok: false,
        error: "Save your profile first.",
      };
    }
    if (!candidate.resumeKey) {
      return { ok: false, error: "Upload a resume first." };
    }

    const quota = await getQuota(candidate.id);

    if (!quota.canSubmit) {
      return {
        ok: false,
        error: quota.blockedReason ?? "Submission quota exhausted.",
      };
    }

    const saved = await listSavedForCandidate(candidate.id);
    const allQueued = saved.filter((s) => s.status === "queued");

    // Sponsorship pre-filter: mark queued listings whose sponsorship flag
    // definitively rules out the candidate as 'skipped' with a clear
    // reason, so we don't waste a worker submit + quota unit on a
    // certain failure.
    const visa = parseVisaFromStoredLabel(candidate.workAuthorization);
    const skippedBySponsorship: string[] = [];
    const eligible: typeof allQueued = [];

    for (const s of allQueued) {
      const check = listingExcludesCandidate(s.sponsorship, visa);

      if (check.exclude) {
        await markSavedListingSkipped(candidate.id, s.id, check.reason);
        skippedBySponsorship.push(s.id);
        continue;
      }
      eligible.push(s);
    }

    const budget = Math.min(
      quota.remainingToday,
      quota.remainingThisWeek,
      eligible.length,
    );

    if (budget <= 0) {
      return {
        ok: true,
        data: {
          enqueued: 0,
          skipped: eligible.length + skippedBySponsorship.length,
          reason:
            eligible.length === 0 && skippedBySponsorship.length > 0
              ? `Skipped ${skippedBySponsorship.length} listing${skippedBySponsorship.length === 1 ? "" : "s"} that don't match your visa status. Nothing eligible to submit.`
              : "No submissions left in your daily/weekly quota.",
        },
      };
    }

    let enqueued = 0;

    for (const s of eligible.slice(0, budget)) {
      try {
        await enqueueSubmit({
          candidateId: candidate.id,
          savedListingId: s.id,
          listingUrl: s.url,
          resumeKey: candidate.resumeKey,
        });
        enqueued += 1;
      } catch (e) {
        console.error("[submitAllQueued] enqueue failed", s.id, e);
      }
    }

    revalidatePath("/apply");
    revalidatePath("/dashboard");

    const extraReason =
      skippedBySponsorship.length > 0
        ? `Also skipped ${skippedBySponsorship.length} listing${skippedBySponsorship.length === 1 ? "" : "s"} that don't match your visa status.`
        : undefined;

    return {
      ok: true,
      data: {
        enqueued,
        skipped: eligible.length - enqueued + skippedBySponsorship.length,
        reason: extraReason,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";

    return { ok: false, error: message };
  }
}

export async function queueListingsAction(
  inputs: SavedListingInput[],
): Promise<ActionResult<{ queued: number; skippedBySponsorship: number }>> {
  if (inputs.length === 0) {
    return { ok: true, data: { queued: 0, skippedBySponsorship: 0 } };
  }
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) {
      return {
        ok: false,
        error: "Save your profile first before queueing internships.",
      };
    }

    const visa = parseVisaFromStoredLabel(candidate.workAuthorization);
    let queued = 0;
    let skippedBySponsorship = 0;

    for (const input of inputs) {
      try {
        const saved = await saveListing(candidate.id, input);
        const check = listingExcludesCandidate(saved.sponsorship ?? null, visa);

        if (check.exclude) {
          await markSavedListingSkipped(candidate.id, saved.id, check.reason);
          skippedBySponsorship += 1;
        } else {
          queued += 1;
        }
      } catch (e) {
        console.error("[queueListings] skip", input.listingId, e);
      }
    }
    revalidatePath("/apply");
    revalidatePath("/dashboard");

    return { ok: true, data: { queued, skippedBySponsorship } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";

    return { ok: false, error: message };
  }
}

export async function removeSavedListingAction(
  savedListingId: string,
): Promise<ActionResult<true>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const removed = await removeSavedListing(candidate.id, savedListingId);

    if (!removed) {
      return { ok: false, error: "Listing not found or not yours." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/apply");

    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function markListingSubmittedAction(
  savedListingId: string,
): Promise<ActionResult<SavedListing>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const updated = await manuallyMarkSubmitted(candidate.id, savedListingId);

    if (!updated) {
      return {
        ok: false,
        error: "Listing already submitted or not found.",
      };
    }
    revalidatePath("/dashboard");
    revalidatePath("/apply");

    return { ok: true, data: updated };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function retrySavedListingAction(
  savedListingId: string,
): Promise<ActionResult<SavedListing>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const reset = await resetSavedListing(candidate.id, savedListingId);

    if (!reset) {
      return {
        ok: false,
        error: "Only failed or skipped listings can be retried.",
      };
    }
    revalidatePath("/dashboard");
    revalidatePath("/apply");

    return { ok: true, data: reset };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function getListingAnswersAction(
  savedListingId: string,
): Promise<ActionResult<SubmissionAnswer[]>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const answers = await listAnswersForListing(candidate.id, savedListingId);

    return { ok: true, data: answers };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function updateAnswerOverrideAction(
  answerId: string,
  override: string,
): Promise<ActionResult<SubmissionAnswer>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const updated = await updateAnswerOverride(
      candidate.id,
      answerId,
      override,
    );

    if (!updated) return { ok: false, error: "Answer not found or not yours." };

    return { ok: true, data: updated };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

function normalizeCookies(input: unknown): PortalCookie[] {
  if (!Array.isArray(input)) {
    throw new Error(
      "Cookies must be a JSON array (EditThisCookie / Cookie-Editor export format).",
    );
  }
  const out: PortalCookie[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name : "";
    const value = typeof r.value === "string" ? r.value : "";

    if (!name || !value) continue;

    const cookie: PortalCookie = { name, value };

    if (typeof r.domain === "string") cookie.domain = r.domain;
    if (typeof r.path === "string") cookie.path = r.path;
    if (typeof r.expires === "number") cookie.expires = r.expires;
    else if (typeof r.expirationDate === "number")
      cookie.expires = Math.floor(r.expirationDate);
    if (typeof r.httpOnly === "boolean") cookie.httpOnly = r.httpOnly;
    if (typeof r.secure === "boolean") cookie.secure = r.secure;
    const ss = r.sameSite;

    if (ss === "Strict" || ss === "Lax" || ss === "None") cookie.sameSite = ss;
    else if (typeof ss === "string") {
      // Browser exports sometimes use lowercase "no_restriction" / "unspecified"
      if (/^strict$/i.test(ss)) cookie.sameSite = "Strict";
      else if (/^lax$/i.test(ss)) cookie.sameSite = "Lax";
      else if (/^none$|^no_restriction$/i.test(ss)) cookie.sameSite = "None";
    }

    out.push(cookie);
  }

  if (out.length === 0) {
    throw new Error("No valid cookies found in pasted input.");
  }

  return out;
}

function summarizeCookies(cookies: PortalCookie[]): string {
  const domains = new Set(
    cookies
      .map((c) => c.domain ?? "")
      .filter(Boolean)
      .map((d) => d.replace(/^\./, "")),
  );
  const earliestExpiry = cookies
    .map((c) => c.expires)
    .filter((e): e is number => typeof e === "number" && e > 0)
    .sort((a, b) => a - b)[0];

  const expiryNote = earliestExpiry
    ? ` · earliest expires ${new Date(earliestExpiry * 1000).toLocaleDateString()}`
    : "";

  return `${cookies.length} cookies across ${domains.size} domains${expiryNote}`;
}

export async function saveAutoApplyCookiesAction(
  rawJson: string,
): Promise<ActionResult<{ summary: string }>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return {
        ok: false,
        error: "Invalid JSON. Paste the full array exported from Cookie-Editor or EditThisCookie.",
      };
    }
    const cookies = normalizeCookies(parsed);
    const blob = encryptJson(cookies);

    await setCandidateCookiesEnc(candidate.id, blob);
    revalidatePath("/apply");
    revalidatePath("/dashboard");

    return { ok: true, data: { summary: summarizeCookies(cookies) } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function clearAutoApplyCookiesAction(): Promise<
  ActionResult<true>
> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    await setCandidateCookiesEnc(candidate.id, null);
    revalidatePath("/apply");
    revalidatePath("/dashboard");

    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function getAutoApplyCookiesStatusAction(): Promise<
  ActionResult<{ hasCookies: boolean }>
> {
  try {
    const { externalId } = await readIdentity();

    if (!externalId) return { ok: true, data: { hasCookies: false } };
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: true, data: { hasCookies: false } };
    const blob = await getCandidateCookiesEnc(candidate.id);

    return { ok: true, data: { hasCookies: !!blob } };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function verifySubmissionsViaGmailAction(): Promise<
  ActionResult<{
    scanned: number;
    updated: number;
    llmCalls: number;
    matched: {
      company: string;
      subject: string;
      from: string;
      rationale: string;
      matchedListingCompany: string;
    }[];
    scannedEmails: {
      from: string;
      subject: string;
      outcome: "confirmed" | "not-confirmation" | "no-matching-listing";
      llmCompanyName: string | null;
      rationale: string;
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      byok: boolean;
      costMicroCents: number;
    }[];
    skippedReason?: string;
  }>
> {
  try {
    const identity = await ensureIdentity();

    if (!identity.isAuthenticated || !identity.externalId) {
      return { ok: false, error: "Sign in with Google first." };
    }
    const candidate = await getCandidateByExternalId(identity.externalId);

    if (!candidate) return { ok: false, error: "No profile." };

    const result = await verifyCandidateSubmissions(
      candidate.id,
      identity.externalId,
    );

    revalidatePath("/dashboard");

    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";

    if (/Gmail access/.test(msg)) {
      return {
        ok: false,
        error:
          "Gmail access not authorized. Log out and log in again to grant Gmail read permission.",
      };
    }

    return { ok: false, error: msg };
  }
}

export async function updateProfileDetailsAction(
  update: ProfileDetailsUpdate,
): Promise<ActionResult<Candidate>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile yet." };

    const fullName = update.fullName.trim();
    const linkedinUrl = update.linkedinUrl.trim();

    if (!fullName) return { ok: false, error: "Full name is required." };
    if (!/linkedin\.com/.test(linkedinUrl)) {
      return {
        ok: false,
        error: "LinkedIn URL should be a linkedin.com link.",
      };
    }

    const updated = await updateCandidateDetails(candidate.id, {
      fullName,
      linkedinUrl,
      targetRoles: update.targetRoles.trim(),
      graduationYear: update.graduationYear.trim(),
      workAuthorization: update.workAuthorization.trim(),
      notes: update.notes.trim(),
    });

    if (!updated) return { ok: false, error: "Update failed." };
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/apply");

    return { ok: true, data: updated };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function updateTargetLocationsAction(
  targetLocations: string,
): Promise<ActionResult<Candidate>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile yet." };
    const updated = await updateCandidateLocations(
      candidate.id,
      targetLocations.trim(),
    );

    if (!updated) return { ok: false, error: "Update failed." };
    revalidatePath("/dashboard");
    revalidatePath("/apply");
    revalidatePath("/internships");

    return { ok: true, data: updated };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export interface LlmStatus {
  creditsMicroCents: number;
  activeKey: ByokKey | null;
  keys: ByokKey[];
  usage: LlmUsageSummary;
  recentCalls: RecentLlmCall[];
}

export async function getLlmStatusAction(): Promise<ActionResult<LlmStatus>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const billing: LlmBilling | null = await getCandidateBilling(candidate.id);

    if (!billing) return { ok: false, error: "No profile." };
    const [keys, usage, recentCalls] = await Promise.all([
      listByokKeys(candidate.id),
      getUsageSummary(candidate.id),
      getRecentLlmCalls(candidate.id, 20),
    ]);
    const activeKey = keys.find((k) => k.isActive) ?? null;

    return {
      ok: true,
      data: {
        creditsMicroCents: billing.creditsMicroCents,
        activeKey,
        keys,
        usage,
        recentCalls,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function addByokKeyAction(params: {
  provider: ByokProvider;
  model: string;
  apiKey: string;
  label?: string;
}): Promise<ActionResult<ByokKey>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };

    const provider = params.provider;
    const model = (params.model || "").trim();
    const apiKey = (params.apiKey || "").trim();
    const label = (params.label || "").trim() || null;

    if (
      provider !== "cerebras" &&
      provider !== "openai" &&
      provider !== "gemini" &&
      provider !== "openrouter"
    ) {
      return { ok: false, error: "Unsupported provider." };
    }
    if (!model) return { ok: false, error: "Model name is required." };
    if (apiKey.length < 20) {
      return {
        ok: false,
        error: "That doesn't look like a valid API key. Paste the full key from your provider.",
      };
    }

    // API keys are encrypted at rest with the same AES-256-GCM envelope as
    // the portal cookies — the decryption key never leaves the server.
    const enc = encryptJson(apiKey);
    const created = await addByokKey({
      candidateId: candidate.id,
      provider,
      model,
      apiKeyEnc: enc,
      label,
    });

    revalidatePath("/dashboard");
    revalidatePath("/apply");

    return { ok: true, data: created };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function setActiveByokKeyAction(
  keyId: string,
): Promise<ActionResult<true>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const ok = await setActiveByokKey(candidate.id, keyId);

    if (!ok) return { ok: false, error: "Key not found." };
    revalidatePath("/dashboard");
    revalidatePath("/apply");

    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function deleteByokKeyAction(
  keyId: string,
): Promise<ActionResult<true>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (!candidate) return { ok: false, error: "No profile." };
    const ok = await deleteByokKeyRow(candidate.id, keyId);

    if (!ok) return { ok: false, error: "Key not found." };
    revalidatePath("/dashboard");
    revalidatePath("/apply");

    return { ok: true, data: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function clearSavedAction(): Promise<ActionResult<true>> {
  try {
    const { externalId } = await ensureIdentity();
    const candidate = await getCandidateByExternalId(externalId);

    if (candidate) await clearSavedForCandidate(candidate.id);
    revalidatePath("/apply");

    return { ok: true, data: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";

    return { ok: false, error: message };
  }
}
