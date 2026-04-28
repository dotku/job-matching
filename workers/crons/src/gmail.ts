import type { Env } from "./env.js";

interface Auth0Identity {
  provider: string;
  access_token?: string;
}

interface Auth0User {
  user_id: string;
  identities?: Auth0Identity[];
}

// In-worker cache — survives a single invocation only (each cron run gets
// a fresh isolate). Still useful to dedupe token refresh within one run.
let cachedMgmt: { token: string; expiresAt: number } | null = null;

async function getMgmtToken(env: Env): Promise<string> {
  if (cachedMgmt && cachedMgmt.expiresAt > Date.now() + 60_000) {
    return cachedMgmt.token;
  }
  const res = await fetch(`https://${env.AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: env.AUTH0_MGMT_CLIENT_ID,
      client_secret: env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${env.AUTH0_DOMAIN}/api/v2/`,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Auth0 M2M token request failed: ${res.status} ${await res.text()}`,
    );
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedMgmt = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  return json.access_token;
}

export async function getGoogleAccessToken(
  env: Env,
  auth0UserId: string,
): Promise<string | null> {
  const mgmt = await getMgmtToken(env);
  const res = await fetch(
    `https://${env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
    { headers: { authorization: `Bearer ${mgmt}` } },
  );

  if (!res.ok) return null;
  const user = (await res.json()) as Auth0User;
  const google = user.identities?.find((i) => i.provider === "google-oauth2");

  return google?.access_token ?? null;
}

export interface GmailMessageMeta {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  internalDate: number;
}

export async function searchGmail(
  accessToken: string,
  query: string,
  max = 50,
): Promise<GmailMessageMeta[]> {
  const listUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  );

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
    messages?: { id: string }[];
  };
  const messages = listJson.messages ?? [];

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
        throw new Error(`gmail message ${m.id}: ${detailRes.status}`);
      }
      const detail = (await detailRes.json()) as {
        id: string;
        internalDate: string;
        snippet?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const headers = detail.payload?.headers ?? [];
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "";

      return {
        id: detail.id,
        from,
        subject,
        snippet: detail.snippet ?? "",
        internalDate: parseInt(detail.internalDate, 10) || 0,
      } satisfies GmailMessageMeta;
    }),
  );

  return settled
    .filter(
      (r): r is PromiseFulfilledResult<GmailMessageMeta> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);
}
