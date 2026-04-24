import "server-only";

import { generateObject } from "ai";
import { PDFParse } from "pdf-parse";
import parsePhoneNumberFromString from "libphonenumber-js";
import { z } from "zod";

export type ResumeParseErrorCode =
  | "unreadable_pdf"
  | "no_phone_found"
  | "invalid_phone";

export class ResumeParseError extends Error {
  constructor(
    public code: ResumeParseErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ResumeParseError";
  }
}

export interface ParsedResume {
  /** E.164 phone number. Required (throws if missing or invalid). */
  phone: string;
  fullName: string | null;
  email: string | null;
  linkedinUrl: string | null;
  graduationYear: string | null;
  /** Best-guess target roles the candidate is seeking, comma-separated. Used for match ranking. */
  targetRoles: string | null;
}

const MIN_TEXT_CHARS = 50;
const MAX_TEXT_CHARS = 20_000;

async function extractText(pdfBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdfBuffer });

  try {
    const result = await parser.getText();

    return result.text;
  } finally {
    await parser.destroy();
  }
}

const resumeSchema = z.object({
  phone: z
    .string()
    .nullable()
    .describe(
      "The candidate's personal phone number exactly as it appears in the resume, or null if none is present. Do not invent; do not return employer phone numbers, GPA values, zip codes, or student IDs.",
    ),
  fullName: z
    .string()
    .nullable()
    .describe(
      "The candidate's full legal name as printed at the top of the resume, or null if not clearly present.",
    ),
  email: z
    .string()
    .nullable()
    .describe(
      "The candidate's personal email address (usually in the contact header), or null if none is present. Do not return company emails from work experience.",
    ),
  linkedinUrl: z
    .string()
    .nullable()
    .describe(
      "The candidate's LinkedIn profile URL (e.g. 'https://www.linkedin.com/in/...'), or null if not present. Normalize partial links like 'linkedin.com/in/xxx' to a full https URL.",
    ),
  graduationYear: z
    .string()
    .nullable()
    .describe(
      "The candidate's graduation year from their most recent/current education (e.g. '2027'), or null if not stated. Prefer expected graduation if they are still a student.",
    ),
  targetRoles: z
    .string()
    .nullable()
    .describe(
      "Short comma-separated list of role titles the candidate is pursuing, derived from their stated objective, recent experience, and major. Examples: 'Software Engineer Intern, Machine Learning Intern'. Return null if unclear. Do not invent roles the resume doesn't support.",
    ),
});

async function askLlmForFields(resumeText: string) {
  const trimmed = resumeText.slice(0, MAX_TEXT_CHARS);

  const { object } = await generateObject({
    model: "google/gemini-2.5-flash-lite",
    schema: resumeSchema,
    prompt: `Extract the following fields from this resume. Return null for any field that isn't clearly present. Do not guess or invent values.\n\n---\n${trimmed}`,
  });

  return object;
}

/**
 * Parse a resume PDF buffer: returns phone (E.164, required) + best-effort
 * metadata for auto-fill (fullName, email, linkedinUrl, graduationYear).
 * Throws ResumeParseError with a specific code on failure.
 */
export async function parseResumeFromPdfBuffer(
  pdfBuffer: Buffer,
): Promise<ParsedResume> {
  const text = await extractText(pdfBuffer);

  if (text.trim().length < MIN_TEXT_CHARS) {
    throw new ResumeParseError(
      "unreadable_pdf",
      "Couldn't extract text from your resume. Is it a scanned image or an empty PDF? Free tier requires a text-based PDF.",
    );
  }

  const fields = await askLlmForFields(text);

  if (!fields.phone) {
    throw new ResumeParseError(
      "no_phone_found",
      "No phone number found in your resume. Please add one and re-save.",
    );
  }

  const parsedPhone = parsePhoneNumberFromString(fields.phone, "US");

  if (!parsedPhone || !parsedPhone.isValid()) {
    throw new ResumeParseError(
      "invalid_phone",
      `The phone number in your resume ("${fields.phone}") isn't a valid phone number. Please correct it and re-save.`,
    );
  }

  return {
    phone: parsedPhone.number,
    fullName: fields.fullName,
    email: fields.email,
    linkedinUrl: fields.linkedinUrl,
    graduationYear: fields.graduationYear,
    targetRoles: fields.targetRoles,
  };
}
