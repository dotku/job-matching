import { listInUseResumeKeys } from "./db.js";
import type { Env } from "./env.js";

const MIN_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000; // 24h grace
const PREFIX_DEFAULT = "resumes/";

export async function runCleanupResumes(env: Env): Promise<{
  scanned: number;
  inUse: number;
  orphansFound: number;
  deleted: number;
}> {
  const prefix = env.R2_PREFIX ?? PREFIX_DEFAULT;
  const inUse = await listInUseResumeKeys(env);
  const cutoff = Date.now() - MIN_ORPHAN_AGE_MS;

  const orphans: string[] = [];
  let scanned = 0;
  let cursor: string | undefined;

  do {
    const page = await env.BUCKET.list({
      prefix,
      cursor,
      limit: 1000,
    });

    for (const obj of page.objects) {
      scanned += 1;
      if (inUse.has(obj.key)) continue;
      if (obj.uploaded.getTime() > cutoff) continue;
      orphans.push(obj.key);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  let deleted = 0;

  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000);

    await env.BUCKET.delete(batch);
    deleted += batch.length;
  }

  return {
    scanned,
    inUse: inUse.size,
    orphansFound: orphans.length,
    deleted,
  };
}
