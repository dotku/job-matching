import "server-only";

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";

const endpoint = process.env.R2_S3_ENDPOINT_URL;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60; // 24h

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name} in environment. Resume upload cannot work without it.`,
    );
  }

  return value;
}

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_S3_ENDPOINT_URL", endpoint),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID", accessKeyId),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY", secretAccessKey),
    },
  });

  return cachedClient;
}

function sanitizeExternalId(externalId: string): string {
  return externalId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
}

export interface UploadResumeOptions {
  externalId: string;
  buffer: Buffer;
  contentType: string;
}

/** Uploads a resume PDF to R2 and returns the object key. */
export async function uploadResumePdf({
  externalId,
  buffer,
  contentType,
}: UploadResumeOptions): Promise<string> {
  const bucketName = requireEnv("R2_BUCKET_NAME", bucket);
  const key = `resumes/${sanitizeExternalId(externalId)}/${Date.now()}-${randomBytes(4).toString("hex")}.pdf`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/pdf",
    }),
  );

  return key;
}

/**
 * Generates a signed GET URL valid for 24h. The bucket stays private; only
 * clients that possess a freshly-issued URL can read the object. The URL is
 * session-embedded (surfaced by loadProfileAction / saveProfileAction), so a
 * new one is issued on every page render.
 */
export async function getResumeSignedUrl(key: string): Promise<string> {
  if (!key) return "";
  const bucketName = requireEnv("R2_BUCKET_NAME", bucket);

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucketName, Key: key }),
    { expiresIn: SIGNED_URL_TTL_SECONDS },
  );
}

export const RESUMES_PREFIX = "resumes/";

export interface ResumeObject {
  key: string;
  lastModified: Date;
  size: number;
}

/** Iterates every object under `resumes/` in R2, paging automatically. */
export async function* listResumeObjects(): AsyncGenerator<ResumeObject> {
  const bucketName = requireEnv("R2_BUCKET_NAME", bucket);
  const client = getClient();
  let continuationToken: string | undefined = undefined;

  do {
    const page: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: RESUMES_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of page.Contents ?? []) {
      if (!obj.Key) continue;
      yield {
        key: obj.Key,
        lastModified: obj.LastModified ?? new Date(0),
        size: obj.Size ?? 0,
      };
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
}

/** Deletes up to 1000 keys per call. Safe to pass more — batches internally. */
export async function deleteResumeObjects(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  const bucketName = requireEnv("R2_BUCKET_NAME", bucket);
  const client = getClient();
  let deleted = 0;

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );

    deleted += batch.length - (result.Errors?.length ?? 0);
    if (result.Errors?.length) {
      for (const err of result.Errors) {
        console.error(
          `[r2] Failed to delete ${err.Key}: ${err.Code} ${err.Message}`,
        );
      }
    }
  }

  return deleted;
}
