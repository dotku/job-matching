export type Sponsorship =
  | "Offers Sponsorship"
  | "Does Not Offer Sponsorship"
  | "U.S. Citizenship Required"
  | "Other"
  | string;

export interface InternshipListing {
  id: string;
  source: string;
  category: string;
  company_name: string;
  title: string;
  active: boolean;
  is_visible: boolean;
  terms: string[];
  date_updated: number;
  date_posted: number;
  url: string;
  locations: string[];
  company_url: string;
  sponsorship: Sponsorship;
  degrees?: string[];
}

interface RawListing extends InternshipListing {}

const SOURCES = [
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json",
];

// MVP auto-submit only supports these ATS platforms. Listings on any other
// host (Workday, custom company sites, iCIMS, Oracle/Taleo, etc.) are
// filtered out at ingest so users can't queue what we can't submit.
const SUPPORTED_HOST_PATTERNS: RegExp[] = [
  /(?:^|\.)boards\.greenhouse\.io$/i,
  /(?:^|\.)job-boards\.greenhouse\.io$/i,
  /(?:^|\.)jobs\.lever\.co$/i,
  /(?:^|\.)jobs\.ashbyhq\.com$/i,
  /(?:^|\.)jobs\.smartrecruiters\.com$/i,
];

export function isSupportedListing(url: string): boolean {
  try {
    const host = new URL(url).hostname;

    return SUPPORTED_HOST_PATTERNS.some((p) => p.test(host));
  } catch {
    return false;
  }
}

export async function fetchInternships(): Promise<{
  listings: InternshipListing[];
  source: string;
  fetchedAt: number;
}> {
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, { next: { revalidate: 21600 } });

      if (!res.ok) continue;
      const raw = (await res.json()) as RawListing[];
      const listings = raw
        .filter((l) => l.active && l.is_visible && isSupportedListing(l.url))
        .map((l) => ({
          id: l.id,
          source: l.source,
          category: l.category,
          company_name: l.company_name,
          title: l.title,
          active: l.active,
          is_visible: l.is_visible,
          terms: l.terms,
          date_updated: l.date_updated,
          date_posted: l.date_posted,
          url: l.url,
          locations: l.locations,
          company_url: l.company_url,
          sponsorship: l.sponsorship,
          degrees: l.degrees,
        }))
        .sort((a, b) => b.date_posted - a.date_posted);

      return { listings, source: url, fetchedAt: Date.now() };
    } catch {
      continue;
    }
  }
  throw new Error("All internship data sources failed");
}

const TECH_CATEGORIES = new Set([
  "Software",
  "Hardware",
  "Quant",
  "Data",
  "Product",
  "Design",
]);

export function isLikelyPaid(listing: InternshipListing): boolean {
  return TECH_CATEGORIES.has(listing.category);
}

export function compensationLabel(listing: InternshipListing): {
  label: string;
  tone: "success" | "default";
  note: string;
} {
  if (isLikelyPaid(listing)) {
    return {
      label: "Paid (likely)",
      tone: "success",
      note: "Tech internships in this dataset are paid by industry standard. Verify on the official posting.",
    };
  }

  return {
    label: "Pay not stated",
    tone: "default",
    note: "Pay status is not in the source data. Check the official posting.",
  };
}
