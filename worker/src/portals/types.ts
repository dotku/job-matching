import type { Page } from "playwright";

import type { CandidateRow } from "../db.js";

export interface SubmitContext {
  page: Page;
  candidate: CandidateRow;
  listingUrl: string;
  resumePdf: Buffer;
  resumeFileName: string;
  /** Plain text of the candidate's resume (pdf-parsed once per job) */
  resumeText: string;
  /** Used to identify the role in LLM prompts */
  companyName: string;
  roleTitle: string;
  /** saved_listings.id — used for naming debug artifacts */
  savedListingId: string;
  /** Record a custom-question answer the adapter had to fill */
  recordAnswer: (answer: RecordedAnswer) => Promise<void>;
  /** Look up an existing user_override for a question, returns null if none */
  lookupOverride: (question: string) => Promise<string | null>;
  /** Persist a diagnostic screenshot to R2 and return its 7-day signed URL */
  captureDebugShot: (buffer: Buffer) => Promise<string>;
  /** True if authenticated session cookies were injected into the context */
  isLoggedIn: boolean;
}

export interface RecordedAnswer {
  question: string;
  questionType: "short" | "long" | "select" | "yes_no";
  generatedAnswer: string;
  finalAnswer: string;
}

export interface SubmitResult {
  status: "submitted" | "failed" | "skipped";
  note: string;
}

export interface PortalAdapter {
  name: string;
  matches: (url: string) => boolean;
  submit: (ctx: SubmitContext) => Promise<SubmitResult>;
}
