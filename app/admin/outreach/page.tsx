import { Metadata } from "next";
import { notFound } from "next/navigation";

import { readIdentity } from "@/lib/identity";
import { sql } from "@/lib/db";
import {
  countSentToday,
  getCandidateByEmail,
  getOutreachSettings,
} from "@/lib/outreach";

export const metadata: Metadata = {
  title: "Outreach console — JobMatching.us",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

interface LogRow {
  id: string;
  to_email: string;
  subject: string | null;
  status: string;
  error: string | null;
  sent_at: string;
}

export default async function OutreachAdmin() {
  const identity = await readIdentity();
  if (!isAdmin(identity?.email)) notFound();

  const email =
    process.env.OUTREACH_CANDIDATE_EMAIL ?? "chenhanwu2006@gmail.com";
  const candidate = await getCandidateByEmail(email);
  if (!candidate) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Outreach console</h1>
        <p className="mt-4 text-red-600">
          No candidate row for <code>{email}</code>. Run{" "}
          <code>pnpm run seed:chenhan</code>.
        </p>
      </main>
    );
  }

  const settings = await getOutreachSettings(candidate.id);
  const sentToday = await countSentToday(candidate.id);
  const recentRows = (await sql`
    SELECT id, to_email, subject, status, error, sent_at
    FROM outreach_log
    WHERE candidate_id = ${candidate.id}
    ORDER BY sent_at DESC
    LIMIT 25
  `) as unknown as LogRow[];
  const queueRows = (await sql`
    SELECT count(*)::int AS n
    FROM apollo_contacts
    WHERE status = 'new'
      AND email IS NOT NULL
      AND email NOT LIKE 'email_not_unlocked@%'
  `) as unknown as { n: number }[];

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Outreach console</h1>

      <section className="rounded border p-4">
        <h2 className="font-medium">Candidate</h2>
        <p>
          <strong>{candidate.full_name}</strong> &lt;{candidate.email}&gt;
        </p>
        <p className="text-sm">
          LinkedIn:{" "}
          <a className="underline" href={candidate.linkedin_url}>
            {candidate.linkedin_url}
          </a>
        </p>
        <p className="text-sm">
          Resume key:{" "}
          {candidate.resume_url ? (
            <code>{candidate.resume_url}</code>
          ) : (
            <em>not uploaded — link will be omitted from emails until /apply upload</em>
          )}
        </p>
        <p className="text-sm">
          Target roles: {candidate.target_roles ?? <em>not set</em>}
        </p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium">Today</h2>
        <p>
          Sent today: <strong>{sentToday}</strong> / cap{" "}
          <strong>{settings.daily_cap}</strong>
          {settings.paused && (
            <span className="ml-2 text-red-600">(PAUSED)</span>
          )}
        </p>
        <p>
          Queue (real-email contacts not yet sent):{" "}
          <strong>{queueRows[0]?.n ?? 0}</strong>
        </p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-medium">Recent sends</h2>
        {recentRows.length === 0 ? (
          <p className="text-sm italic">No sends yet.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">When</th>
                <th className="text-left">To</th>
                <th className="text-left">Subject</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td>{new Date(r.sent_at).toLocaleString()}</td>
                  <td>{r.to_email}</td>
                  <td>{r.subject}</td>
                  <td className={r.status === "sent" ? "text-green-700" : "text-red-700"}>
                    {r.status}
                    {r.error ? `: ${r.error}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded border p-4 text-sm">
        <h2 className="font-medium">Endpoints</h2>
        <ul className="list-disc pl-6">
          <li><code>POST /api/apollo/sync</code> — pull new contacts from Apollo</li>
          <li><code>POST /api/outreach/send</code> — send today&apos;s batch now (respects daily cap)</li>
          <li><code>GET /api/cron/send-outreach</code> — Vercel Cron entry point (15:00 UTC daily)</li>
        </ul>
      </section>
    </main>
  );
}
