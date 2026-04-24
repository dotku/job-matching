import { Redis } from "ioredis";
import { Worker, type Job } from "bullmq";
import { chromium, type Browser } from "playwright";

import { PDFParse } from "pdf-parse";

import { config } from "./config.js";
import { decryptJson } from "./crypto.js";
import {
  findOverrideForQuestion,
  getCandidate,
  getCandidateCookieBlob,
  getSavedListingSummary,
  insertSubmissionAnswer,
  markFailed,
  markSkipped,
  markSubmitted,
  markSubmitting,
  resetStuckSubmitting,
} from "./db.js";
import { promises as fs } from "node:fs";
import { join } from "node:path";

import { downloadResume, uploadDebugShot, uploadDebugVideo } from "./r2.js";
import { findAdapter } from "./portals/index.js";

interface PortalCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  url?: string;
}

interface SubmitJobPayload {
  candidateId: string;
  savedListingId: string;
  listingUrl: string;
  resumeKey: string;
  enqueuedAt: number;
}

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) return sharedBrowser;
  sharedBrowser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
  });

  return sharedBrowser;
}

const JOB_HARD_TIMEOUT_MS = 300_000; // 5 min — accommodates human-pace waits

async function processJob(job: Job<SubmitJobPayload>) {
  return Promise.race([
    processJobInner(job),
    new Promise<void>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Job exceeded hard timeout (${JOB_HARD_TIMEOUT_MS}ms) — likely stuck on an adapter step.`,
            ),
          ),
        JOB_HARD_TIMEOUT_MS,
      ),
    ),
  ]);
}

async function processJobInner(job: Job<SubmitJobPayload>) {
  const { candidateId, savedListingId, listingUrl, resumeKey } = job.data;

  console.log(`[job ${job.id}] ${listingUrl} for candidate ${candidateId}`);

  const adapter = findAdapter(listingUrl);

  if (!adapter) {
    await markFailed(
      savedListingId,
      `No portal adapter for ${new URL(listingUrl).hostname}`,
    );

    return;
  }

  const candidate = await getCandidate(candidateId);

  if (!candidate) {
    await markFailed(savedListingId, "Candidate row disappeared");

    return;
  }

  // Mark the row as in-progress so the dashboard shows live state while
  // Playwright is running. `markSubmitting` is a no-op if the row already
  // transitioned to a terminal state (submitted/failed/skipped).
  await markSubmitting(
    savedListingId,
    `Submitting via ${adapter.name} since ${new Date().toISOString()}`,
  );

  const resumePdf = await downloadResume(resumeKey);
  const listingSummary = await getSavedListingSummary(savedListingId);
  const companyName = listingSummary?.company_name ?? "the company";
  const roleTitle = listingSummary?.title ?? "this role";

  let resumeText = "";

  try {
    const parser = new PDFParse({ data: resumePdf });

    try {
      const parsed = await parser.getText();

      resumeText = parsed.text ?? "";
    } finally {
      await parser.destroy();
    }
  } catch (e) {
    console.warn(
      `[job ${job.id}] pdf-parse failed, continuing without resume text`,
      e,
    );
  }

  // Load and decrypt any session cookies the candidate stored, so we can
  // act as logged-in (Greenhouse "My Greenhouse" etc. pre-fills basics).
  let cookies: PortalCookie[] = [];

  try {
    const blob = await getCandidateCookieBlob(candidateId);

    if (blob) cookies = decryptJson<PortalCookie[]>(blob);
  } catch (e) {
    console.warn(
      `[job ${job.id}] cookie decrypt failed — continuing unauthenticated`,
      e instanceof Error ? e.message : e,
    );
  }

  const browser = await getBrowser();
  const videoDir = `/tmp/video-${savedListingId}`;

  await fs.mkdir(videoDir, { recursive: true }).catch(() => null);

  const browserContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });

  if (cookies.length > 0) {
    try {
      await browserContext.addCookies(cookies);
      console.log(
        `[job ${job.id}] injected ${cookies.length} cookie(s) into context`,
      );
    } catch (e) {
      console.warn(
        `[job ${job.id}] addCookies rejected`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  const page = await browserContext.newPage();

  try {
    const result = await adapter.submit({
      page,
      candidate,
      listingUrl,
      resumePdf,
      resumeFileName: "resume.pdf",
      resumeText,
      companyName,
      roleTitle,
      savedListingId,
      isLoggedIn: cookies.length > 0,
      recordAnswer: async (answer) => {
        await insertSubmissionAnswer({
          savedListingId,
          candidateId,
          question: answer.question,
          generatedAnswer: answer.generatedAnswer,
          finalAnswer: answer.finalAnswer,
          questionType: answer.questionType,
        });
      },
      lookupOverride: (question) =>
        findOverrideForQuestion(candidateId, question),
      captureDebugShot: (buffer) =>
        uploadDebugShot(savedListingId, buffer),
    });

    // Close context FIRST so Playwright flushes the video file to disk,
    // then upload the replay and fold its URL into the status_note.
    await browserContext.close();

    let videoUrl = "";

    try {
      const files = await fs.readdir(videoDir).catch(() => [] as string[]);
      const webm = files.find((f) => f.endsWith(".webm"));

      if (webm) {
        const buf = await fs.readFile(join(videoDir, webm));

        videoUrl = await uploadDebugVideo(savedListingId, buf);
      }
    } catch (e) {
      console.warn(
        `[job ${job.id}] video upload failed`,
        e instanceof Error ? e.message : e,
      );
    } finally {
      await fs.rm(videoDir, { recursive: true, force: true }).catch(() => null);
    }

    const noteWithVideo = videoUrl
      ? `${result.note} | video: ${videoUrl}`
      : result.note;

    if (result.status === "submitted") {
      await markSubmitted(savedListingId, noteWithVideo);
    } else if (result.status === "failed") {
      await markFailed(savedListingId, noteWithVideo);
    } else {
      await markSkipped(savedListingId, noteWithVideo);
      console.log(`[job ${job.id}] skipped: ${result.note}`);
    }
  } catch (e) {
    // If adapter threw before we could close context, still clean up
    await browserContext.close().catch(() => null);
    await fs.rm(videoDir, { recursive: true, force: true }).catch(() => null);
    throw e;
  }
}

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker<SubmitJobPayload>(config.queueName, processJob, {
  connection,
  concurrency: config.concurrency,
});

worker.on("completed", (job) => {
  console.log(`[job ${job.id}] completed`);
});

worker.on("failed", async (job, err) => {
  console.error(`[job ${job?.id}] failed: ${err.message}`);
  if (job) {
    try {
      await markFailed(
        job.data.savedListingId,
        err.message.slice(0, 500),
      );
    } catch (dbErr) {
      console.error("[worker] markFailed after error", dbErr);
    }
  }
});

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received — draining…`);
  await worker.close();
  if (sharedBrowser) await sharedBrowser.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

const resetCount = await resetStuckSubmitting().catch((e) => {
  console.error("[worker] resetStuckSubmitting failed", e);

  return 0;
});

if (resetCount > 0) {
  console.log(`[worker] reset ${resetCount} stuck 'submitting' row(s) → failed`);
}

console.log(
  `[worker] booted — queue="${config.queueName}" concurrency=${config.concurrency}`,
);
