import { NextRequest, NextResponse } from "next/server";

import { runDailyOutreach } from "@/lib/outreach";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as {
      candidateEmail?: string;
    };
    const email =
      body.candidateEmail ??
      process.env.OUTREACH_CANDIDATE_EMAIL ??
      "chenhanwu2006@gmail.com";
    const result = await runDailyOutreach(email);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
