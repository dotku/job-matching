import "server-only";

/**
 * Gmail integration for verifying submission outcomes. Uses the user's
 * stored Google access token (via Auth0 → Management API → user.identities)
 * to search their inbox for "application received" emails from employers.
 *
 * Required Auth0 config (user-facing):
 *   - Google connection: gmail.readonly scope enabled
 *   - Google connection: "Store tokens" ON
 *   - M2M application with `read:users` scope → AUTH0_MGMT_CLIENT_ID / _SECRET
 *
 * Required env:
 *   AUTH0_DOMAIN           (already present)
 *   AUTH0_MGMT_CLIENT_ID   (new)
 *   AUTH0_MGMT_CLIENT_SECRET (new)
 */

interface Auth0Identity {
  provider: string;
  user_id: string;
  access_token?: string;
}

interface Auth0User {
  user_id: string;
  identities?: Auth0Identity[];
}

let cachedMgmtToken: { token: string; expiresAt: number } | null = null;

async function getMgmtToken(): Promise<string> {
  if (cachedMgmtToken && cachedMgmtToken.expiresAt > Date.now() + 60_000) {
    return cachedMgmtToken.token;
  }
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_MGMT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      "Missing AUTH0_MGMT_CLIENT_ID / AUTH0_MGMT_CLIENT_SECRET. Create an M2M application in Auth0 with read:users scope.",
    );
  }

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Auth0 M2M token request failed: ${res.status} ${await res.text()}`,
    );
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };

  cachedMgmtToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  return json.access_token;
}

export async function getGoogleAccessToken(
  auth0UserId: string,
): Promise<string | null> {
  const domain = process.env.AUTH0_DOMAIN;

  if (!domain) throw new Error("Missing AUTH0_DOMAIN");

  const mgmtToken = await getMgmtToken();
  const res = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
    {
      headers: { authorization: `Bearer ${mgmtToken}` },
    },
  );

  if (!res.ok) return null;
  const user = (await res.json()) as Auth0User;
  const google = user.identities?.find((i) => i.provider === "google-oauth2");

  return google?.access_token ?? null;
}

export interface GmailMessageMeta {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  internalDate: number;
  snippet: string;
}

/** Search Gmail and return lightweight metadata for matching. */
export async function searchGmail(
  accessToken: string,
  query: string,
  max = 50,
): Promise<GmailMessageMeta[]> {
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");

  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("maxResults", String(max));
  const listRes = await fetch(listUrl.toString(), {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    throw new Error(
      `Gmail list failed: ${listRes.status} ${await listRes.text()}`,
    );
  }
  const listJson = (await listRes.json()) as {
    messages?: { id: string; threadId: string }[];
  };
  const messages = listJson.messages ?? [];

  // Fetch metadata in parallel — sequentially this is ~100ms × 200 = 20s+.
  // Gmail's per-user rate limit allows ~250 quota/sec, so 50 concurrent
  // metadata fetches are well within bounds.
  const settled = await Promise.allSettled(
    messages.map(async (m) => {
      const detailUrl = new URL(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`,
      );

      detailUrl.searchParams.set("format", "metadata");
      detailUrl.searchParams.append("metadataHeaders", "From");
      detailUrl.searchParams.append("metadataHeaders", "Subject");

      const detailRes = await fetch(detailUrl.toString(), {
        headers: { authorization: `Bearer ${accessToken}` },
      });

      if (!detailRes.ok) {
        throw new Error(`message fetch ${m.id}: ${detailRes.status}`);
      }
      const detail = (await detailRes.json()) as {
        id: string;
        threadId: string;
        internalDate: string;
        snippet?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const headers = detail.payload?.headers ?? [];
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "";

      return {
        id: detail.id,
        threadId: detail.threadId,
        from,
        subject,
        internalDate: parseInt(detail.internalDate, 10) || 0,
        snippet: detail.snippet ?? "",
      } satisfies GmailMessageMeta;
    }),
  );

  return settled
    .filter(
      (r): r is PromiseFulfilledResult<GmailMessageMeta> => r.status === "fulfilled",
    )
    .map((r) => r.value);
}
