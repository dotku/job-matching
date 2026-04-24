import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { config } from "./config.js";

const client = new S3Client({
  region: "auto",
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

/** Download the resume object as a Buffer. Used when the portal accepts a direct file upload. */
export async function downloadResume(key: string): Promise<Buffer> {
  const response = await client.send(
    new GetObjectCommand({ Bucket: config.r2.bucket, Key: key }),
  );

  if (!response.Body) {
    throw new Error(`Empty body for R2 key ${key}`);
  }

  const chunks: Buffer[] = [];

  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

/** Presigned GET URL — useful if the portal wants a URL instead of file upload. */
export async function getResumeSignedUrl(
  key: string,
  expiresIn = 15 * 60,
): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: config.r2.bucket, Key: key }),
    { expiresIn },
  );
}

/**
 * Upload a debug screenshot captured by an adapter when it couldn't
 * determine submission outcome. Returns a 7-day signed GET URL so the
 * user can review the page state from the Dashboard.
 */
export async function uploadDebugShot(
  savedListingId: string,
  buffer: Buffer,
): Promise<string> {
  const key = `debug/${savedListingId}/${Date.now()}.png`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    }),
  );

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: config.r2.bucket, Key: key }),
    { expiresIn: 7 * 24 * 60 * 60 },
  );
}

/**
 * Upload a session replay WebM captured by Playwright's recordVideo so the
 * user can review the full run end-to-end. Returns a 7-day signed URL.
 */
export async function uploadDebugVideo(
  savedListingId: string,
  buffer: Buffer,
): Promise<string> {
  const key = `debug/${savedListingId}/${Date.now()}.webm`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: "video/webm",
    }),
  );

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: config.r2.bucket, Key: key }),
    { expiresIn: 7 * 24 * 60 * 60 },
  );
}
