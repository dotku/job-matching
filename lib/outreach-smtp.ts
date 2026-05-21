import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getAppPasswordFor } from "./outreach-creds";

// One transporter per sender mailbox, cached for the life of the process.
const transporters = new Map<string, Transporter>();

function getTransporter(fromEmail: string): Transporter {
  const key = fromEmail.toLowerCase();
  const cached = transporters.get(key);
  if (cached) return cached;
  const pass = getAppPasswordFor(fromEmail).replace(/\s+/g, "");
  const t = nodemailer.createTransport({
    service: "gmail",
    auth: { user: fromEmail, pass },
  });
  transporters.set(key, t);
  return t;
}

export interface SendMailParams {
  fromEmail: string;
  fromName?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType?: string;
  }[];
}

export interface SendMailResult {
  messageId?: string;
  accepted: (string | { address: string })[];
  rejected: (string | { address: string })[];
}

export async function sendMail(params: SendMailParams): Promise<SendMailResult> {
  const { fromEmail, fromName, ...rest } = params;
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const info = await getTransporter(fromEmail).sendMail({ from, ...rest });
  return {
    messageId: info.messageId,
    accepted: info.accepted ?? [],
    rejected: info.rejected ?? [],
  };
}
