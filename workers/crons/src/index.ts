import { runCleanupResumes } from "./cleanup.js";
import type { Env } from "./env.js";
import { runVerifySubmissions } from "./verify.js";

/**
 * Cloudflare Worker routing to the right cron by schedule. Single Worker
 * hosts multiple cron triggers — we dispatch inside the scheduled handler.
 *
 * Schedules in wrangler.toml:
 *   "0 3 * * *"    daily 03:00 UTC  → cleanup-resumes
 *   "0 * /4 * * *" every 4h         → verify-submissions
 */
export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const startedAt = Date.now();

    if (event.cron === "0 3 * * *") {
      ctx.waitUntil(
        runCleanupResumes(env).then((result) => {
          console.log("[cron/cleanup-resumes]", {
            ...result,
            durationMs: Date.now() - startedAt,
          });
        }),
      );

      return;
    }

    if (event.cron === "0 */4 * * *") {
      ctx.waitUntil(
        runVerifySubmissions(env).then((result) => {
          console.log("[cron/verify-submissions]", {
            ...result,
            durationMs: Date.now() - startedAt,
          });
        }),
      );

      return;
    }

    console.warn(`[cron] unknown schedule: ${event.cron}`);
  },

  // Optional fetch handler for manual trigger during dev. Curl it with
  // ?job=cleanup or ?job=verify + a shared secret header.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const job = url.searchParams.get("job");

    // Require any non-empty Authorization to avoid accidental public hits
    if (!request.headers.get("authorization")) {
      return new Response("unauthorized", { status: 401 });
    }

    if (job === "cleanup") {
      const result = await runCleanupResumes(env);

      return Response.json(result);
    }
    if (job === "verify") {
      const result = await runVerifySubmissions(env);

      return Response.json(result);
    }

    return new Response("job-matching-crons — use ?job=cleanup or ?job=verify");
  },
};
