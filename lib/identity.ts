import "server-only";

import { auth0 } from "./auth0";
import { sql } from "./db";
import {
  ensureAnonymousCandidateKey,
  readAnonymousCandidateKey,
} from "./candidate-cookie";

export interface Identity {
  externalId: string | null;
  email: string | null;
  name: string | null;
  isAuthenticated: boolean;
  emailVerified: boolean;
}

async function fromAuth0(): Promise<Identity | null> {
  try {
    const session = await auth0.getSession();

    if (!session?.user?.sub) return null;
    const externalId = session.user.sub;
    const email = (session.user.email as string | undefined) ?? null;
    const emailVerified =
      (session.user.email_verified as boolean | undefined) === true;
    const name =
      (session.user.name as string | undefined) ??
      (session.user.nickname as string | undefined) ??
      null;

    return { externalId, email, name, isAuthenticated: true, emailVerified };
  } catch {
    return null;
  }
}

/**
 * Resolve identity for read paths (Server Components, page renders).
 * Will NOT create an anonymous cookie — returns externalId=null if neither
 * Auth0 session nor anon cookie exist.
 */
export async function readIdentity(): Promise<Identity> {
  const auth = await fromAuth0();

  if (auth) return auth;
  const anon = await readAnonymousCandidateKey();

  return {
    externalId: anon,
    email: null,
    name: null,
    isAuthenticated: false,
    emailVerified: false,
  };
}

/**
 * Resolve identity for write paths (Server Actions, Route Handlers).
 * Will create an anonymous cookie if needed and rebind any existing
 * anonymous candidate row to the Auth0 sub on first authenticated call.
 */
export async function ensureIdentity(): Promise<Identity & { externalId: string }> {
  const auth = await fromAuth0();

  if (auth) {
    await rebindAnonymousCandidate(
      auth.externalId!,
      auth.emailVerified ? auth.email : null,
    );

    return auth as Identity & { externalId: string };
  }
  const anon = await ensureAnonymousCandidateKey();

  return {
    externalId: anon,
    email: null,
    name: null,
    isAuthenticated: false,
    emailVerified: false,
  };
}

/**
 * Claim the authenticated user's candidate row across two paths:
 * 1. Cookie-matched: migrate the row whose external_id = current browser's
 *    anonymous cookie UUID. Handles the common "guest saved profile, then
 *    signed up in the same browser" flow.
 * 2. Email-matched: if Auth0 verified an email, claim any orphan anon row
 *    (UUID-shaped external_id) holding that email. Handles "signed up on
 *    a new device / after clearing cookies", where the cookie-rebind would
 *    otherwise leave an orphan blocking the email UNIQUE constraint.
 *
 * Exported so read-path callers (e.g. loadProfileAction) can trigger the
 * claim without going through a Server Action first.
 */
export async function claimOrphanCandidatesForAuth(
  authExternalId: string,
  verifiedEmail: string | null,
) {
  return rebindAnonymousCandidate(authExternalId, verifiedEmail);
}

async function rebindAnonymousCandidate(
  authExternalId: string,
  verifiedEmail: string | null,
) {
  const anon = await readAnonymousCandidateKey();

  // (1) Cookie-matched rebind — migrate this browser's anonymous row to
  //     the authenticated external_id if no auth row exists yet.
  if (anon && anon !== authExternalId) {
    await sql`
      UPDATE candidates
      SET external_id = ${authExternalId}
      WHERE external_id = ${anon}
        AND NOT EXISTS (
          SELECT 1 FROM candidates WHERE external_id = ${authExternalId}
        )
    `;
  }

  if (!verifiedEmail) return;

  // (2) Verified-email ownership claim.
  //     Auth0 certified this user owns `verifiedEmail`. Any other row
  //     holding that email is either a stale guest, an impostor, or a
  //     recruiter-entered placeholder — by policy, the Auth0 verified
  //     owner takes possession.
  const authRows = (await sql`
    SELECT id FROM candidates WHERE external_id = ${authExternalId} LIMIT 1
  `) as unknown as { id: string }[];
  const authRow = authRows[0];

  if (!authRow) {
    // Nothing yet under our external_id — claim the oldest email match.
    await sql`
      UPDATE candidates
      SET external_id = ${authExternalId}
      WHERE id = (
        SELECT id FROM candidates
        WHERE lower(email) = lower(${verifiedEmail})
          AND external_id != ${authExternalId}
        ORDER BY created_at ASC
        LIMIT 1
      )
    `;

    return;
  }

  // We already have an auth row. Any *other* row carrying this email
  // blocks the UNIQUE(email) constraint on later updates. Fold each
  // blocker's saved_listings into our row then delete the blocker.
  const blockers = (await sql`
    SELECT id FROM candidates
    WHERE lower(email) = lower(${verifiedEmail})
      AND id != ${authRow.id}
  `) as unknown as { id: string }[];

  for (const b of blockers) {
    await sql`
      UPDATE saved_listings
      SET candidate_id = ${authRow.id}
      WHERE candidate_id = ${b.id}
        AND NOT EXISTS (
          SELECT 1 FROM saved_listings s2
          WHERE s2.candidate_id = ${authRow.id}
            AND s2.listing_id = saved_listings.listing_id
        )
    `;
    await sql`DELETE FROM candidates WHERE id = ${b.id}`;
  }
}
