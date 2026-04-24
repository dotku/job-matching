import "server-only";

import { Queue } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";

export const SUBMIT_QUEUE = "submit-resume";

export interface SubmitJob {
  candidateId: string;
  savedListingId: string;
  listingUrl: string;
  resumeKey: string;
  enqueuedAt: number;
}

let cachedQueue: Queue<SubmitJob> | null = null;
let cachedConnection: IORedis | null = null;

function getRedis(): IORedis {
  if (cachedConnection) return cachedConnection;
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("Missing REDIS_URL in environment.");
  }
  const opts: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  cachedConnection = new IORedis(url, opts);

  return cachedConnection;
}

export function getSubmitQueue(): Queue<SubmitJob> {
  if (cachedQueue) return cachedQueue;
  cachedQueue = new Queue<SubmitJob>(SUBMIT_QUEUE, {
    connection: getRedis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: { age: 7 * 24 * 60 * 60, count: 1000 },
      removeOnFail: { age: 30 * 24 * 60 * 60 },
    },
  });

  return cachedQueue;
}

export async function enqueueSubmit(job: Omit<SubmitJob, "enqueuedAt">) {
  return getSubmitQueue().add(
    "submit",
    { ...job, enqueuedAt: Date.now() },
    // Dedup by savedListingId — if already in flight, new add() is a no-op.
    { jobId: job.savedListingId },
  );
}
