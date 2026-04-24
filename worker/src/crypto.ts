import { createDecipheriv } from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.COOKIE_ENC_KEY;

  if (!hex) {
    throw new Error("Missing COOKIE_ENC_KEY in worker environment");
  }
  if (hex.length !== 64) {
    throw new Error("COOKIE_ENC_KEY must be 64 hex chars");
  }

  return Buffer.from(hex, "hex");
}

interface Envelope {
  v: 1;
  iv: string;
  tag: string;
  ct: string;
}

export function decryptJson<T = unknown>(blob: string): T {
  const envelope = JSON.parse(blob) as Envelope;

  if (envelope.v !== 1) throw new Error(`Bad envelope version: ${envelope.v}`);
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
