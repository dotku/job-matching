/**
 * AES-256-GCM decrypter compatible with the envelope format written by the
 * main Next.js app's lib/crypto.ts. Envelope: { v: 1, iv: <hex>, tag:
 * <hex>, ct: <base64> }. Both environments must share COOKIE_ENC_KEY.
 *
 * Uses Web Crypto (crypto.subtle) — works in Cloudflare Workers without
 * node:crypto.
 */

interface Envelope {
  v: 1;
  iv: string;
  tag: string;
  ct: string;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);

  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);

  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);

  return out;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);

  out.set(a, 0);
  out.set(b, a.length);

  return out;
}

export async function decryptJsonAesGcm<T = unknown>(
  blob: string,
  keyHex: string,
): Promise<T> {
  const envelope = JSON.parse(blob) as Envelope;

  if (envelope.v !== 1) {
    throw new Error(`Unknown encryption envelope version: ${envelope.v}`);
  }
  const keyBytes = hexToBytes(keyHex);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  // Node GCM splits ciphertext and 16-byte auth tag; Web Crypto expects
  // them concatenated (ct || tag).
  const ct = base64ToBytes(envelope.ct);
  const tag = hexToBytes(envelope.tag);
  const combined = concat(ct, tag);
  const iv = hexToBytes(envelope.iv);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined,
  );
  const plaintext = new TextDecoder().decode(plainBuf);

  return JSON.parse(plaintext) as T;
}
