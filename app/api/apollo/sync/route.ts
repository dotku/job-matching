import { NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { hasRealEmail, normalize, searchPeople } from "@/lib/apollo";
import { getCandidateByEmail } from "@/lib/outreach";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  candidateEmail?: string;
  pages?: number;
  perPage?: number;
  titles?: string[];
  locations?: string[];
  industries?: string[];
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode — no secret means any caller
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const email =
      body.candidateEmail ??
      process.env.OUTREACH_CANDIDATE_EMAIL ??
      "chenhanwu2006@gmail.com";
    const candidate = await getCandidateByEmail(email);
    if (!candidate) {
      return NextResponse.json(
        { error: `no candidate row for ${email}` },
        { status: 404 },
      );
    }

    const pages = Math.max(1, Math.min(body.pages ?? 1, 5));
    const perPage = Math.max(1, Math.min(body.perPage ?? 25, 50));
    let inserted = 0;
    let skipped = 0;
    let withEmail = 0;

    for (let page = 1; page <= pages; page++) {
      const people = await searchPeople({
        titles: body.titles,
        locations: body.locations,
        industries: body.industries,
        page,
        perPage,
      });
      if (!people.length) break;
      for (const p of people) {
        const c = normalize(p);
        if (hasRealEmail(c)) withEmail++;
        const result = (await sql`
          INSERT INTO apollo_contacts (
            apollo_id, full_name, first_name, last_name, email, title, company,
            linkedin_url, location, raw, sourced_for
          ) VALUES (
            ${c.apollo_id}, ${c.full_name}, ${c.first_name}, ${c.last_name},
            ${c.email}, ${c.title}, ${c.company}, ${c.linkedin_url},
            ${c.location}, ${JSON.stringify(c.raw)}::jsonb, ${candidate.id}
          )
          ON CONFLICT (apollo_id) DO NOTHING
          RETURNING id
        `) as unknown as { id: string }[];
        if (result.length) inserted++;
        else skipped++;
      }
    }
    return NextResponse.json({
      candidate_email: candidate.email,
      pages,
      perPage,
      inserted,
      skipped,
      withEmail,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
