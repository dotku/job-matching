import "server-only";

// GitHub Models (https://github.com/marketplace/models) — free/low-cost
// inference for OpenAI / Llama / Phi / Mistral via an OpenAI-compatible API.
// Token format: a fine-grained PAT with the `models:read` scope.

const ENDPOINT = "https://models.github.ai/inference/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

export interface PersonalizeInput {
  candidate: {
    full_name: string;
    email: string;
    linkedin_url: string;
    resume_url: string; // signed URL or ""
    target_roles: string | null;
  };
  contact: {
    first_name: string | null;
    full_name: string | null;
    title: string | null;
    company: string | null;
  };
}

const SYSTEM_PROMPT = `You draft a short cold outreach email from a CS undergraduate (the candidate) to a recruiter or hiring manager (the recipient).

Hard rules — never break:
- Body length: 80-110 words. One short paragraph, or two if you must.
- Only use facts provided in the user message. Do NOT invent GPA, school, graduation year, project names, frameworks, internships, or skills. If a fact isn't there, leave it out.
- Tone: respectful, direct, plain English. No "I came across your profile", no flattery, no superlatives.
- Exactly one ask: ask to be considered for any open SWE / Data Science intern roles, or be redirected to whoever owns intern hiring.
- Always include "LinkedIn: <linkedin_url>" on its own line.
- If candidate_resume_url is non-empty, include "Resume: <resume_url>" on its own line.
- Sign off on its own line with the candidate's full name, then their email on the next line.
- Subject: 6-9 words, mention "Summer 2026" and the role keyword (SWE / Data Science Intern). Do NOT put the recipient's name in the subject.

Output strict JSON only — no prose, no markdown fences:
{"subject": "...", "body": "..."}`;

export async function personalizeEmail(
  input: PersonalizeInput,
): Promise<{ subject: string; body: string }> {
  const token = process.env.GITHUB_MODELS_TOKEN;
  if (!token) throw new Error("GITHUB_MODELS_TOKEN is not set");
  const model = process.env.GITHUB_MODELS_MODEL ?? DEFAULT_MODEL;

  const { candidate, contact } = input;
  const facts = {
    candidate_name: candidate.full_name,
    candidate_email: candidate.email,
    candidate_linkedin: candidate.linkedin_url,
    candidate_resume_url: candidate.resume_url,
    candidate_target_roles:
      candidate.target_roles ??
      "Software Engineer Intern, Data Science Intern (Summer 2026)",
    recipient_first_name:
      contact.first_name ||
      contact.full_name?.split(" ")[0] ||
      "there",
    recipient_title: contact.title ?? "your role",
    recipient_company: contact.company ?? "your team",
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(facts) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `GitHub Models call failed (${res.status}): ${(await res.text()).slice(0, 300)}`,
    );
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  let parsed: { subject?: string; body?: string };
  try {
    parsed = JSON.parse(content) as { subject?: string; body?: string };
  } catch {
    throw new Error(
      `GitHub Models returned non-JSON content: ${content.slice(0, 200)}`,
    );
  }
  if (!parsed.subject || !parsed.body) {
    throw new Error("GitHub Models returned incomplete JSON (missing subject or body)");
  }
  return { subject: parsed.subject.trim(), body: parsed.body.trim() };
}
