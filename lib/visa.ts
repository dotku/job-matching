/**
 * Shared visa/work-authorization types and labels — imported from both
 * server code (resume-parser.ts) and client code (ProfileDetails.tsx).
 * Do not add "server-only" here; this module must be safe for client bundles.
 */

export type VisaStatus =
  | "citizen"
  | "permanent_resident"
  | "opt_f1"
  | "cpt_f1"
  | "f1_pre_opt"
  | "h1b"
  | "other_visa"
  | "unknown";

/** Human-readable form value — the dropdown on /profile maps to these labels. */
export const VISA_LABELS: Record<VisaStatus, string> = {
  citizen: "US Citizen",
  permanent_resident: "Permanent Resident (Green Card)",
  opt_f1: "F-1 Student Visa · OPT",
  cpt_f1: "F-1 Student Visa · CPT",
  f1_pre_opt: "F-1 Student Visa (pre-OPT)",
  h1b: "H-1B Work Visa",
  other_visa: "Other Work Visa",
  unknown: "",
};

/** Reverse-map a stored free-text work_authorization back to the enum. */
export function parseVisaFromStoredLabel(
  stored: string | null | undefined,
): VisaStatus {
  if (!stored) return "unknown";
  const trimmed = stored.trim();

  if (!trimmed) return "unknown";

  const entry = (Object.entries(VISA_LABELS) as [VisaStatus, string][]).find(
    ([, label]) => label && label === trimmed,
  );

  if (entry) return entry[0];

  // Legacy sentinel from the old free-text default.
  if (/f[-\s]?1/i.test(trimmed) && /opt/i.test(trimmed)) return "opt_f1";
  if (/f[-\s]?1/i.test(trimmed) && /cpt/i.test(trimmed)) return "cpt_f1";
  if (/f[-\s]?1|student visa/i.test(trimmed)) return "f1_pre_opt";
  if (/h[-\s]?1\s*b/i.test(trimmed)) return "h1b";
  if (/green\s*card|permanent\s*resident|lpr/i.test(trimmed)) {
    return "permanent_resident";
  }
  if (/u\.?s\.?\s*citizen/i.test(trimmed)) return "citizen";

  return "unknown";
}

/**
 * Does this visa status require employer-sponsored work authorization
 * now or within ~3 years? Returns null for "unknown" — caller should
 * treat null as "can't decide, let it through".
 */
export function needsSponsorship(visa: VisaStatus): boolean | null {
  if (visa === "citizen" || visa === "permanent_resident") return false;
  if (visa === "unknown") return null;

  return true;
}

/**
 * Check whether a saved_listing's sponsorship flag rules out the
 * candidate given their visa status. The `sponsorship` string is
 * whatever SimplifyJobs tagged on the listing — common values:
 *   "Does Offer Sponsorship"              → never excludes
 *   "Does Not Offer Sponsorship"          → excludes if candidate needs sponsorship
 *   "U.S. Citizenship is Required"        → excludes everyone except US citizens
 *   "U.S. Citizenship or Permanent …"     → excludes everyone except citizen/LPR
 *   null / ""                             → no filter
 */
export function listingExcludesCandidate(
  sponsorship: string | null | undefined,
  visa: VisaStatus,
): { exclude: true; reason: string } | { exclude: false } {
  if (!sponsorship) return { exclude: false };
  const s = sponsorship.toLowerCase();

  if (/u\.?s\.?\s+citizenship\s+is\s+required/.test(s)) {
    if (visa !== "citizen") {
      return {
        exclude: true,
        reason: `Listing requires US citizenship (your status: ${VISA_LABELS[visa] || "not set"}).`,
      };
    }
  }

  if (
    /u\.?s\.?\s+citizenship\s+or\s+permanent/.test(s) ||
    /citizenship.*permanent\s*resident/.test(s)
  ) {
    if (visa !== "citizen" && visa !== "permanent_resident") {
      return {
        exclude: true,
        reason: `Listing requires US citizenship or permanent residency (your status: ${VISA_LABELS[visa] || "not set"}).`,
      };
    }
  }

  if (/does not offer sponsorship|no sponsorship|not sponsor/.test(s)) {
    const needs = needsSponsorship(visa);

    if (needs === true) {
      return {
        exclude: true,
        reason: `Employer does not offer sponsorship; your status (${VISA_LABELS[visa]}) requires it.`,
      };
    }
  }

  return { exclude: false };
}
