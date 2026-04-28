export interface Env {
  // Secrets
  DATABASE_URL: string;
  AUTH0_DOMAIN: string;
  AUTH0_MGMT_CLIENT_ID: string;
  AUTH0_MGMT_CLIENT_SECRET: string;
  /** AI Gateway key used for non-BYOK email-match calls (default Gemini). */
  AI_GATEWAY_API_KEY: string;
  /** 64-hex-char AES-256 key shared with the main Next.js app to decrypt BYOK API keys. */
  COOKIE_ENC_KEY: string;

  // Optional config with defaults
  R2_PREFIX?: string;

  // Bindings
  BUCKET: R2Bucket;
}

export function require_(env: Env, key: keyof Env): string {
  const v = env[key];

  if (typeof v !== "string" || !v) {
    throw new Error(`Missing env ${key}`);
  }

  return v;
}
