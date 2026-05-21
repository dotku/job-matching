import "server-only";

// Pattern borrowed from usproglove-marketing-ai/src/lib/prospects/enrichment/apollo.ts
// (lowercase x-api-key header, email_status confidence) and adapted for the
// outreach use case (we want recruiter contacts, not B2B prospects).

const APOLLO_BASE = "https://api.apollo.io/v1";

export interface ApolloPerson {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  email_status?: string;
  title?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization?: { name?: string; primary_domain?: string };
}

export interface NormalizedContact {
  apollo_id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  email_status: string | null;
  email_confidence: number;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
  location: string | null;
  raw: ApolloPerson;
}

function apiKey(): string {
  const k = process.env.APOLLO_API_KEY;
  if (!k) throw new Error("APOLLO_API_KEY is not set");
  return k;
}

function confidenceFor(status?: string): number {
  if (status === "verified") return 90;
  if (status === "likely to engage") return 70;
  if (status === "unverified") return 40;
  return 20;
}

export interface SearchPeopleParams {
  titles?: string[];
  locations?: string[];
  industries?: string[];
  organizationDomains?: string[];
  page?: number;
  perPage?: number;
}

export async function searchPeople({
  titles = [
    "technical recruiter",
    "university recruiter",
    "engineering manager",
    "talent acquisition",
    "recruiter",
  ],
  locations = ["United States"],
  industries = [
    "computer software",
    "internet",
    "information technology and services",
  ],
  organizationDomains,
  page = 1,
  perPage = 25,
}: SearchPeopleParams = {}): Promise<ApolloPerson[]> {
  const body: Record<string, unknown> = {
    person_titles: titles,
    person_locations: locations,
    organization_industries: industries,
    page,
    per_page: perPage,
  };
  if (organizationDomains?.length) {
    body.q_organization_domains_list = organizationDomains;
  }
  const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": apiKey(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `Apollo search failed (${res.status}): ${(await res.text()).slice(0, 300)}`,
    );
  }
  const data = (await res.json()) as {
    people?: ApolloPerson[];
    contacts?: ApolloPerson[];
  };
  return [...(data.people ?? []), ...(data.contacts ?? [])];
}

export function normalize(p: ApolloPerson): NormalizedContact {
  return {
    apollo_id: p.id,
    full_name:
      p.name?.trim() || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    first_name: p.first_name ?? null,
    last_name: p.last_name ?? null,
    email: p.email ?? null,
    email_status: p.email_status ?? null,
    email_confidence: confidenceFor(p.email_status),
    title: p.title ?? null,
    company: p.organization?.name ?? null,
    linkedin_url: p.linkedin_url ?? null,
    location:
      [p.city, p.state, p.country].filter(Boolean).join(", ") || null,
    raw: p,
  };
}

// Apollo free / starter tiers return a placeholder address that won't actually
// deliver. Skip those rather than burn the daily cap on garbage.
export function hasRealEmail(c: { email: string | null }): boolean {
  if (!c.email) return false;
  if (c.email.includes("email_not_unlocked")) return false;
  return /.+@.+\..+/.test(c.email);
}
