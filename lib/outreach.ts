import "server-only";

import { sql } from "./db";
import { getResumeSignedUrl } from "./r2";
import { sendMail } from "./outreach-smtp";
import { personalizeEmail } from "./email-personalizer";

export interface OutreachCandidate {
  id: string;
  email: string;
  full_name: string;
  resume_key: string; // R2 key
  linkedin_url: string;
  target_roles: string | null;
}

export interface OutreachSettings {
  candidate_id: string;
  daily_cap: number;
  paused: boolean;
  template_subject: string | null;
  template_body: string | null;
}

export interface OutreachContact {
  id: string;
  apollo_id: string | null;
  full_name: string | null;
  first_name: string | null;
  email: string;
  title: string | null;
  company: string | null;
  linkedin_url: string | null;
}

const DEFAULT_SUBJECT = "Summer 2026 SWE / Data Internship — {{candidate_name}}";

const DEFAULT_BODY = `Hi {{first_name}},

I'm {{candidate_name}}, a CS undergrad looking for Summer 2026 SWE / data internships. I saw you're {{title}} at {{company}} — would love to be considered for any open intern roles on your team, or be pointed to whoever owns intern hiring there.

Quick snapshot:
- Targeting: {{target_roles}}
- LinkedIn: {{linkedin_url}}
- Resume (24h link): {{resume_url}}

Happy to share more or hop on a 15-minute chat any time. Thanks for the consideration.

— {{candidate_name}}
{{candidate_email}}`;

function render(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function startOfTodayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getCandidateByEmail(
  email: string,
): Promise<OutreachCandidate | null> {
  const rows = (await sql`
    SELECT id, email, full_name, resume_key, linkedin_url, target_roles
    FROM candidates
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `) as unknown as OutreachCandidate[];
  return rows[0] ?? null;
}

export async function getOutreachSettings(
  candidateId: string,
): Promise<OutreachSettings> {
  const rows = (await sql`
    SELECT candidate_id, daily_cap, paused, template_subject, template_body
    FROM outreach_settings
    WHERE candidate_id = ${candidateId}
    LIMIT 1
  `) as unknown as OutreachSettings[];
  return (
    rows[0] ?? {
      candidate_id: candidateId,
      daily_cap: 20,
      paused: false,
      template_subject: null,
      template_body: null,
    }
  );
}

export async function countSentToday(candidateId: string): Promise<number> {
  const rows = (await sql`
    SELECT count(*)::int AS n
    FROM outreach_log
    WHERE candidate_id = ${candidateId}
      AND status = 'sent'
      AND sent_at >= ${startOfTodayUTC()}
  `) as unknown as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function pickBatch(
  candidateId: string,
  limit: number,
): Promise<OutreachContact[]> {
  if (limit <= 0) return [];
  // Real-email contacts that have never been successfully sent to this candidate
  const rows = (await sql`
    SELECT c.id, c.apollo_id, c.full_name, c.first_name, c.email, c.title,
           c.company, c.linkedin_url
    FROM apollo_contacts c
    WHERE c.status = 'new'
      AND c.email IS NOT NULL
      AND c.email NOT LIKE 'email_not_unlocked@%'
      AND NOT EXISTS (
        SELECT 1 FROM outreach_log l
        WHERE l.candidate_id = ${candidateId}
          AND l.contact_id = c.id
          AND l.status = 'sent'
      )
    LIMIT ${limit}
  `) as unknown as OutreachContact[];
  return rows;
}

export async function buildEmail({
  candidate,
  contact,
  settings,
}: {
  candidate: OutreachCandidate;
  contact: OutreachContact;
  settings: OutreachSettings;
}): Promise<{ subject: string; text: string; html: string; personalized: boolean }> {
  const resumeUrl = candidate.resume_key
    ? await getResumeSignedUrl(candidate.resume_key)
    : "";
  // ^ candidate.resume_key holds the R2 object key; getResumeSignedUrl wraps it
  //   into a 24h-signed GET URL. Empty string means no resume uploaded yet.

  let subject: string;
  let text: string;
  let personalized = false;

  // Prefer GitHub-Models personalization when configured. If it fails for
  // any reason (rate limit, malformed JSON, network), fall back to the
  // hand-written template — we'd rather send a generic email than skip.
  if (process.env.GITHUB_MODELS_TOKEN) {
    try {
      const llm = await personalizeEmail({
        candidate: {
          full_name: candidate.full_name,
          email: candidate.email,
          linkedin_url: candidate.linkedin_url,
          resume_url: resumeUrl,
          target_roles: candidate.target_roles,
        },
        contact: {
          first_name: contact.first_name,
          full_name: contact.full_name,
          title: contact.title,
          company: contact.company,
        },
      });
      subject = llm.subject;
      text = llm.body;
      personalized = true;
    } catch (err) {
      console.warn(
        `[outreach] personalization failed for ${contact.email}, falling back to template: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  if (!personalized) {
    const vars: Record<string, string> = {
      first_name: contact.first_name || contact.full_name?.split(" ")[0] || "there",
      full_name: contact.full_name ?? "",
      title: contact.title ?? "your role",
      company: contact.company ?? "your team",
      candidate_name: candidate.full_name,
      candidate_email: candidate.email,
      linkedin_url: candidate.linkedin_url,
      resume_url: resumeUrl,
      target_roles:
        candidate.target_roles ||
        "SWE Intern, Data Science Intern (Summer 2026)",
    };
    subject = render(settings.template_subject || DEFAULT_SUBJECT, vars);
    text = render(settings.template_body || DEFAULT_BODY, vars);
  }

  const html = `<pre style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap;margin:0">${escapeHtml(text!)}</pre>`;
  return { subject: subject!, text: text!, html, personalized };
}

export async function sendOneOutreach({
  candidate,
  contact,
  settings,
}: {
  candidate: OutreachCandidate;
  contact: OutreachContact;
  settings: OutreachSettings;
}): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const { subject, text, html, personalized } = await buildEmail({
    candidate,
    contact,
    settings,
  });
  try {
    const info = await sendMail({
      fromEmail: candidate.email,
      fromName: candidate.full_name,
      to: contact.email,
      subject,
      text,
      html,
    });
    await sql`
      INSERT INTO outreach_log (
        candidate_id, contact_id, to_email, subject, body_text, body_html, status, message_id, personalized
      ) VALUES (
        ${candidate.id}, ${contact.id}, ${contact.email}, ${subject}, ${text}, ${html}, 'sent', ${info.messageId ?? null}, ${personalized}
      )
    `;
    await sql`UPDATE apollo_contacts SET status = 'sent' WHERE id = ${contact.id}`;
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sql`
      INSERT INTO outreach_log (
        candidate_id, contact_id, to_email, subject, body_text, body_html, status, error, personalized
      ) VALUES (
        ${candidate.id}, ${contact.id}, ${contact.email}, ${subject}, ${text}, ${html}, 'failed', ${msg}, ${personalized}
      )
    `;
    return { ok: false, error: msg };
  }
}

export interface RunDailyOutcome {
  candidate_email: string;
  cap: number;
  already_sent_today: number;
  attempted: number;
  succeeded: number;
  failed: number;
  paused?: boolean;
  results?: { contactId: string; ok: boolean; error?: string }[];
}

export async function runDailyOutreach(
  candidateEmail: string,
): Promise<RunDailyOutcome | { skipped: true; reason: string }> {
  const candidate = await getCandidateByEmail(candidateEmail);
  if (!candidate) {
    return { skipped: true, reason: `no candidate row for ${candidateEmail}` };
  }
  const settings = await getOutreachSettings(candidate.id);
  if (settings.paused) {
    return { skipped: true, reason: "paused" };
  }
  const cap = settings.daily_cap ?? 20;
  const alreadySent = await countSentToday(candidate.id);
  const remaining = Math.max(0, cap - alreadySent);
  if (remaining === 0) {
    return { skipped: true, reason: "daily_cap_reached" };
  }
  const batch = await pickBatch(candidate.id, remaining);
  const results: { contactId: string; ok: boolean; error?: string }[] = [];
  for (const contact of batch) {
    const r = await sendOneOutreach({ candidate, contact, settings });
    if (r.ok) {
      results.push({ contactId: contact.id, ok: true });
    } else {
      results.push({ contactId: contact.id, ok: false, error: r.error });
    }
    // Gentle spread so we don't fire 20 SMTP requests in 200ms
    await new Promise((res) => setTimeout(res, 1500));
  }
  return {
    candidate_email: candidate.email,
    cap,
    already_sent_today: alreadySent,
    attempted: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
