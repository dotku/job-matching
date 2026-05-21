import { NextRequest, NextResponse } from "next/server";

import { runDailyOutreach } from "@/lib/outreach";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel Cron sends a GET with `Authorization: Bearer ${CRON_SECRET}`.
// Locally with no CRON_SECRET set we allow open access for testing.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const email =
      process.env.OUTREACH_CANDIDATE_EMAIL ?? "chenhanwu2006@gmail.com";
    const result = await runDailyOutreach(email);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
