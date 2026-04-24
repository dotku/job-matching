import type { InternshipListing } from "./internships";

export interface MatchProfile {
  targetRoles?: string | null;
  targetLocations?: string | null;
  workAuthorization?: string | null;
}

export interface ScoredListing {
  listing: InternshipListing;
  score: number;
  reasons: string[];
}

const STOP_WORDS = new Set([
  "intern",
  "internship",
  "summer",
  "fall",
  "winter",
  "spring",
  "2025",
  "2026",
  "2027",
  "and",
  "or",
  "the",
  "a",
  "an",
]);

function splitPhrases(raw: string | null | undefined): string[] {
  if (!raw) return [];

  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function splitTokens(raw: string | null | undefined): string[] {
  if (!raw) return [];

  return raw
    .toLowerCase()
    .split(/[\s,;\n/]+/)
    .map((s) => s.replace(/[^a-z0-9+]/g, ""))
    .filter((s) => s.length >= 3 && !STOP_WORDS.has(s));
}

function workAuthCompatible(
  listing: InternshipListing,
  auth: string | null | undefined,
): { ok: true } | { ok: false; reason: string } {
  const sponsorship = listing.sponsorship;

  if (!auth) return { ok: true };

  if (auth === "US Citizen" || auth === "Permanent Resident") {
    if (sponsorship === "U.S. Citizenship Required" && auth !== "US Citizen") {
      return { ok: false, reason: "Requires US citizenship" };
    }

    return { ok: true };
  }

  // F-1 / Other — treat conservatively: exclude listings that explicitly
  // refuse sponsorship or require citizenship.
  if (sponsorship === "Does Not Offer Sponsorship") {
    return { ok: false, reason: "No sponsorship offered" };
  }
  if (sponsorship === "U.S. Citizenship Required") {
    return { ok: false, reason: "Requires US citizenship" };
  }

  return { ok: true };
}

/**
 * Score a listing against the candidate's profile. Higher = better match.
 * Returns null if the listing is hard-filtered out (e.g. work-auth mismatch).
 */
export function scoreListing(
  listing: InternshipListing,
  profile: MatchProfile,
): ScoredListing | null {
  const auth = workAuthCompatible(listing, profile.workAuthorization);

  if (!auth.ok) return null;

  const reasons: string[] = [];
  let score = 0;

  const rolePhrases = splitPhrases(profile.targetRoles);
  const roleTokens = splitTokens(profile.targetRoles);
  const title = listing.title.toLowerCase();

  let phraseHit = false;

  for (const phrase of rolePhrases) {
    if (phrase.length >= 4 && title.includes(phrase)) {
      score += 60;
      reasons.push(`Title matches "${phrase}"`);
      phraseHit = true;
      break;
    }
  }

  if (!phraseHit) {
    const tokenHits = roleTokens.filter((t) => title.includes(t));

    if (tokenHits.length > 0) {
      score += Math.min(40, tokenHits.length * 15);
      reasons.push(`Keyword: ${tokenHits.slice(0, 3).join(", ")}`);
    }
  }

  const locPhrases = splitPhrases(profile.targetLocations);

  if (locPhrases.length > 0) {
    const listingLocs = listing.locations.map((l) => l.toLowerCase());
    const remoteWanted = locPhrases.some((p) => p.includes("remote"));
    const listingIsRemote = listingLocs.some((l) => l.includes("remote"));

    const hit =
      (remoteWanted && listingIsRemote) ||
      locPhrases.some((want) =>
        listingLocs.some((have) => have.includes(want) || want.includes(have)),
      );

    if (hit) {
      score += 25;
      reasons.push("Location match");
    }
  }

  if (listing.sponsorship === "Offers Sponsorship") {
    if (
      profile.workAuthorization === "Student Visa (F-1)" ||
      profile.workAuthorization === "Other"
    ) {
      score += 15;
      reasons.push("Sponsorship offered");
    }
  }

  // Prefer fresher postings (last 30 days) as a gentle tiebreaker.
  const ageDays =
    (Date.now() - listing.date_posted * 1000) / (24 * 60 * 60 * 1000);

  if (ageDays < 30) score += Math.max(0, 10 - Math.floor(ageDays / 3));

  return { listing, score, reasons };
}

export function rankListings(
  listings: InternshipListing[],
  profile: MatchProfile,
  minScore = 25,
): ScoredListing[] {
  const scored: ScoredListing[] = [];

  for (const l of listings) {
    const s = scoreListing(l, profile);

    if (s && s.score >= minScore) scored.push(s);
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    return b.listing.date_posted - a.listing.date_posted;
  });

  return scored;
}

export function hasMatchableProfile(profile: MatchProfile): boolean {
  return !!(profile.targetRoles && profile.targetRoles.trim().length > 0);
}
