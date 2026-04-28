import "server-only";

import { generateObject } from "ai";
import { PDFParse } from "pdf-parse";
import parsePhoneNumberFromString from "libphonenumber-js";
import { z } from "zod";

import { VISA_LABELS, type VisaStatus } from "./visa";

export { VISA_LABELS, type VisaStatus };

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
  /** Best-guess preferred work locations, comma-separated (city names). */
  targetLocations: string | null;
  /** Detected US work-authorization bucket — used to prefill the form. */
  visaStatus: VisaStatus;
  /**
   * True when the candidate almost certainly needs employer-sponsored work
   * authorization now or within ~3 years. Null when unknown.
   */
  needsSponsorship: boolean | null;
  /** Human-readable evidence phrase copied from the resume, or null if inferred with no direct quote. */
  visaSignal: string | null;
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
  targetLocations: z
    .string()
    .nullable()
    .describe(
      "Short comma-separated list of preferred US work locations. Sources in order of priority: (1) an explicit 'seeking roles in X, Y' line in the objective/summary; (2) the candidate's current city from the contact header; (3) the university city. Prefer city names (e.g. 'San Francisco, Seattle, New York'). Add 'Remote' only if the resume explicitly says so. Return null when no location signal is present. Never invent.",
    ),
  visaStatus: z
    .enum([
      "citizen",
      "permanent_resident",
      "opt_f1",
      "cpt_f1",
      "f1_pre_opt",
      "h1b",
      "other_visa",
      "unknown",
    ])
    .describe(
      [
        "Best US work-authorization bucket you can infer from the resume. Use these rules:",
        "- 'citizen' when the resume explicitly says US citizen, US national, or mentions active-duty US military service / US federal security clearance.",
        "- 'permanent_resident' for green card / permanent resident / LPR.",
        "- 'opt_f1' when OPT, EAD, Optional Practical Training is mentioned.",
        "- 'cpt_f1' when CPT or Curricular Practical Training is mentioned (typical for summer interns on F-1).",
        "- 'f1_pre_opt' when F-1 or 'international student' is stated or strongly implied but OPT/CPT isn't mentioned yet — e.g. a current undergrad studying in the US with a non-US home address.",
        "- 'h1b' when H-1B is mentioned.",
        "- 'other_visa' for TN, L-1, O-1, J-1, or any other non-immigrant work visa.",
        "- 'unknown' when none of the above is supported by the resume. Do NOT guess — only use 'unknown' as the default.",
        "A Chinese/Indian/other non-US name by itself is NOT sufficient evidence; require explicit visa or international-student wording.",
      ].join(" "),
    ),
  needsSponsorship: z
    .boolean()
    .nullable()
    .describe(
      "True when the candidate will need employer-sponsored work authorization (now or within ~3 years): OPT/CPT/F-1/H-1B/other non-immigrant visa. False only when you see explicit citizen or permanent_resident evidence. Null when visaStatus is 'unknown' — do not guess.",
    ),
  visaSignal: z
    .string()
    .nullable()
    .describe(
      "Short direct quote from the resume that supported your visa decision — e.g. 'Authorized to work in the US with OPT EAD'. Return null when visaStatus is 'unknown' or when the decision was inferred without a direct quote.",
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

  const needsSponsorship = (() => {
    if (fields.visaStatus === "citizen" || fields.visaStatus === "permanent_resident") {
      return false;
    }
    if (fields.visaStatus === "unknown") {
      return fields.needsSponsorship ?? null;
    }

    return true;
  })();

  return {
    phone: parsedPhone.number,
    fullName: fields.fullName,
    email: fields.email,
    linkedinUrl: fields.linkedinUrl,
    graduationYear: fields.graduationYear,
    targetRoles: fields.targetRoles,
    targetLocations: fields.targetLocations,
    visaStatus: fields.visaStatus,
    needsSponsorship,
    visaSignal: fields.visaSignal,
  };
}

