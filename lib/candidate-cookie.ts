import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "jm_anon_candidate";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function readAnonymousCandidateKey(): Promise<string | null> {
  const store = await cookies();

  return store.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Read-or-create the anonymous candidate key. Only callable from a Server
 * Action or Route Handler — Server Components cannot mutate cookies.
 */
export async function ensureAnonymousCandidateKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing) return existing;
  const fresh = randomUUID();

  store.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });

  return fresh;
}
