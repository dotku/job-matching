import { generateObject } from "ai";
import { z } from "zod";

import type { CandidateRow } from "./db.js";

const MODEL = "google/gemini-2.5-flash-lite";
const MAX_LEN = 500;

export type QuestionType = "short" | "long" | "select" | "yes_no";

export interface AnswerRequest {
  candidate: CandidateRow;
  resumeText: string;
  companyName: string;
  roleTitle: string;
  question: string;
  questionType: QuestionType;
  /** For select fields: the option labels the adapter found */
  options?: string[];
  /** If the portal has a maxlength attribute we honored */
  maxLength?: number;
}

export interface GeneratedAnswer {
  answer: string;
  rationale: string;
}

const schema = z.object({
  answer: z
    .string()
    .describe(
      "The candidate's response, <= 500 characters, no preamble, no quotes, concise and concrete, grounded in the resume facts provided.",
    ),
  rationale: z
    .string()
    .describe(
      "One sentence explaining which resume facts drove the answer. Used for user debugging — not submitted to the employer.",
    ),
});

function buildResumeContext(
  candidate: CandidateRow,
  resumeText: string,
): string {
  const trimmedResume = resumeText.slice(0, 6000).trim();

  return [
    `NAME: ${candidate.full_name}`,
    `EMAIL: ${candidate.email}`,
    candidate.phone ? `PHONE: ${candidate.phone}` : null,
    candidate.linkedin_url ? `LINKEDIN: ${candidate.linkedin_url}` : null,
    candidate.graduation_year
      ? `GRADUATION YEAR: ${candidate.graduation_year}`
      : null,
    candidate.work_authorization
      ? `WORK AUTHORIZATION: ${candidate.work_authorization}`
      : null,
    candidate.target_roles ? `TARGET ROLES: ${candidate.target_roles}` : null,
    candidate.target_locations
      ? `TARGET LOCATIONS: ${candidate.target_locations}`
      : null,
    "",
    "RESUME TEXT (truncated):",
    trimmedResume,
  ]
    .filter((x) => x !== null)
    .join("\n");
}

function buildPrompt(req: AnswerRequest, context: string): string {
  const lengthHint = Math.min(req.maxLength ?? MAX_LEN, MAX_LEN);
  const typeHint = (() => {
    switch (req.questionType) {
      case "yes_no":
        return 'Respond with exactly "Yes" or "No" only.';
      case "select":
        return `Pick exactly one option from this list and return only the option label verbatim: ${(req.options ?? []).map((o) => `"${o}"`).join(", ")}`;
      case "short":
        return `Keep the answer <= ${Math.min(lengthHint, 120)} characters, single line.`;
      case "long":
      default:
        return `Keep the answer <= ${lengthHint} characters. One short paragraph. No preamble like "I am excited" — get to the specifics.`;
    }
  })();

  return [
    `You are filling out a job application on behalf of ${req.candidate.full_name}.`,
    `Company: ${req.companyName}`,
    `Role: ${req.roleTitle}`,
    "",
    "CANDIDATE PROFILE:",
    context,
    "",
    `QUESTION: ${req.question}`,
    "",
    `INSTRUCTIONS: ${typeHint}`,
    "Ground every claim in the resume. If the resume doesn't support something, don't invent it. Never include placeholders like [company] or [your skill]. Write in first person.",
  ].join("\n");
}

/**
 * Answer an open-ended custom question on a job application. Returns the
 * answer (clipped to 500 chars hard limit) plus a rationale for user review.
 */
export async function answerQuestion(
  req: AnswerRequest,
): Promise<GeneratedAnswer> {
  const context = buildResumeContext(req.candidate, req.resumeText);
  const prompt = buildPrompt(req, context);

  const { object } = await generateObject({
    model: MODEL,
    schema,
    prompt,
  });

  return {
    answer: object.answer.slice(0, MAX_LEN),
    rationale: object.rationale.slice(0, 400),
  };
}
