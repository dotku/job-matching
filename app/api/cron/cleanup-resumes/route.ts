import { NextResponse } from "next/server";

import { sql } from "@/lib/db";
import {
  deleteResumeObjects,
  listResumeObjects,
} from "@/lib/r2";

// Orphans younger than this are kept — protects in-flight uploads where the
// user has parsed but hasn't hit Save yet. Must exceed the 24h signed-URL
// TTL so the signed link doesn't outlive the object it points at.
const MIN_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.warn(
      "[cron/cleanup-resumes] CRON_SECRET not set — refusing to run.",
    );

    return false;
  }
  const header = request.headers.get("authorization");

  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const startedAt = Date.now();

  const rows = (await sql`
    SELECT resume_key FROM candidates WHERE resume_key IS NOT NULL AND resume_key <> ''
  `) as unknown as { resume_key: string }[];
  const inUse = new Set(rows.map((r) => r.resume_key));
  const cutoff = Date.now() - MIN_ORPHAN_AGE_MS;

  const orphans: string[] = [];
  let scanned = 0;

  for await (const obj of listResumeObjects()) {
    scanned += 1;
    if (inUse.has(obj.key)) continue;
    if (obj.lastModified.getTime() > cutoff) continue;
    orphans.push(obj.key);
  }

  const deleted = dryRun ? 0 : await deleteResumeObjects(orphans);

  const payload = {
    ok: true,
    scanned,
    inUse: inUse.size,
    orphansFound: orphans.length,
    deleted,
    dryRun,
    durationMs: Date.now() - startedAt,
  };

  console.log("[cron/cleanup-resumes]", payload);

  return NextResponse.json(payload);
}
