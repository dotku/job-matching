import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM encryption for secrets we have to store (like the
 * candidate's browser cookies for auto-apply). The key comes from
 * COOKIE_ENC_KEY — a 32-byte hex string (generate with
 * `openssl rand -hex 32`).
 */

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.COOKIE_ENC_KEY;

  if (!hex) {
    throw new Error(
      "Missing COOKIE_ENC_KEY in environment (32-byte hex, generate with `openssl rand -hex 32`)",
    );
  }
  if (hex.length !== 64) {
    throw new Error(
      `COOKIE_ENC_KEY must be 64 hex chars (32 bytes); got ${hex.length}`,
    );
  }

  return Buffer.from(hex, "hex");
}

export interface Envelope {
  v: 1;
  iv: string;
  tag: string;
  ct: string;
}

export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  const envelope: Envelope = {
    v: 1,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    ct: ct.toString("base64"),
  };

  return JSON.stringify(envelope);
}

export function decryptJson<T = unknown>(blob: string): T {
  const envelope = JSON.parse(blob) as Envelope;

  if (envelope.v !== 1) {
    throw new Error(`Unknown encryption envelope version: ${envelope.v}`);
  }
  const decipher = createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(envelope.iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(envelope.tag, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ct, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}
