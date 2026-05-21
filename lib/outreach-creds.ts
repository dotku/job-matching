import "server-only";

/**
 * Reads sender credentials from the CANDIDATES env var. The format is a
 * Python-dict-ish blob, e.g.:
 *
 *   CANDIDATES={'chenhanwu2006@gmail.com': abcd-efgh-ijkl-mnop}
 *
 * Quotes are optional around both key and value; multiple pairs separated by
 * commas are supported. The value is the Gmail app password (16 chars,
 * spaces stripped by Google's UI but accepted either way).
 */
export function loadCandidateCredentials(): Record<string, string> {
  const raw = process.env.CANDIDATES ?? "";
  if (!raw) return {};
  const map: Record<string, string> = {};
  const re =
    /['"]?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})['"]?\s*:\s*['"]?([^,'"}\s]+)['"]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    map[m[1].toLowerCase()] = m[2];
  }
  return map;
}

export function getAppPasswordFor(email: string): string {
  const creds = loadCandidateCredentials();
  const pw = creds[email.toLowerCase()];
  if (!pw) {
    throw new Error(
      `No app password for ${email} in CANDIDATES env var. Format: CANDIDATES={'email@example.com': app-password}`,
    );
  }
  return pw;
}
