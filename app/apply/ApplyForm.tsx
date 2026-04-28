"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";

import { Candidate, CandidateInput } from "@/lib/candidates";
import { VISA_LABELS } from "@/lib/visa";

import {
  clearSavedAction,
  parseResumeAction,
  saveProfileAction,
  submitAllQueuedAction,
} from "./actions";

type ProfileFields = Omit<CandidateInput, "resumeKey">;

const EMPTY: ProfileFields = {
  fullName: "",
  email: "",
  linkedinUrl: "",
  targetRoles: "",
  targetLocations: "",
  graduationYear: "",
  workAuthorization: "Student Visa (F-1)",
  notes: "",
};

interface Props {
  initialCandidate: Candidate | null;
  initialResumeViewUrl: string;
  initialSavedCount: number;
  isAuthenticated: boolean;
}

export function ApplyForm({
  initialCandidate,
  initialResumeViewUrl,
  initialSavedCount,
  isAuthenticated,
}: Props) {
  const [profile, setProfile] = useState<ProfileFields>(
    initialCandidate
      ? {
          email: initialCandidate.email,
          fullName: initialCandidate.fullName,
          linkedinUrl: initialCandidate.linkedinUrl,
          targetRoles: initialCandidate.targetRoles ?? "",
          targetLocations: initialCandidate.targetLocations ?? "",
          graduationYear: initialCandidate.graduationYear ?? "",
          workAuthorization:
            initialCandidate.workAuthorization ?? "Student Visa (F-1)",
          notes: initialCandidate.notes ?? "",
        }
      : EMPTY,
  );
  const [resumeViewUrl, setResumeViewUrl] = useState(initialResumeViewUrl);
  const [hasResume, setHasResume] = useState(!!initialCandidate?.resumeKey);
  const [pendingResumeKey, setPendingResumeKey] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [autofilledFields, setAutofilledFields] = useState<string[]>([]);
  const [visaDetection, setVisaDetection] = useState<
    | {
        status: string;
        label: string;
        needsSponsorship: boolean | null;
        signal: string | null;
      }
    | null
  >(null);
  const [isParsing, setIsParsing] = useState(false);
  const [savedCount, setSavedCount] = useState(initialSavedCount);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "saved"; at: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [isPending, setIsPending] = useState(false);
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function update<K extends keyof ProfileFields>(
    key: K,
    value: ProfileFields[K],
  ) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    setPickedFileName(file?.name ?? null);
    setAutofilledFields([]);
    if (!file) return;

    setIsParsing(true);
    setStatus({ kind: "idle" });
    const formData = new FormData();

    formData.set("resumeFile", file);

    try {
      const result = await parseResumeAction(formData);

      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setPickedFileName(null);

        return;
      }

      const { parsed, resumeKey, resumeViewUrl: newUrl } = result.data;

      setPendingResumeKey(resumeKey);
      setPendingPhone(parsed.phone);
      setResumeViewUrl(newUrl);
      setHasResume(true);

      const filled: string[] = [];

      setProfile((p) => {
        const next = { ...p };

        if (!next.fullName.trim() && parsed.fullName) {
          next.fullName = parsed.fullName;
          filled.push("Full name");
        }
        if (!next.email.trim() && parsed.email) {
          next.email = parsed.email;
          filled.push("Email");
        }
        if (!next.linkedinUrl.trim() && parsed.linkedinUrl) {
          next.linkedinUrl = parsed.linkedinUrl;
          filled.push("LinkedIn URL");
        }
        if (!(next.graduationYear ?? "").trim() && parsed.graduationYear) {
          next.graduationYear = parsed.graduationYear;
          filled.push("Graduation year");
        }
        if (!(next.targetRoles ?? "").trim() && parsed.targetRoles) {
          next.targetRoles = parsed.targetRoles;
          filled.push("Target roles");
        }
        if (!(next.targetLocations ?? "").trim() && parsed.targetLocations) {
          next.targetLocations = parsed.targetLocations;
          filled.push("Target locations");
        }
        // Only overwrite when the stored value is empty OR the sentinel default,
        // so we don't clobber a user who explicitly picked one.
        const currentAuth = (next.workAuthorization ?? "").trim();
        const isDefault =
          currentAuth === "" || currentAuth === "Student Visa (F-1)";
        const detected =
          parsed.visaStatus !== "unknown"
            ? VISA_LABELS[parsed.visaStatus]
            : "";

        if (isDefault && detected) {
          next.workAuthorization = detected;
          filled.push(
            parsed.needsSponsorship === false
              ? `Work authorization (${detected}, no sponsorship)`
              : `Work authorization (${detected}, needs sponsorship)`,
          );
        }

        return next;
      });
      setAutofilledFields(filled);
      setVisaDetection(
        parsed.visaStatus !== "unknown"
          ? {
              status: parsed.visaStatus,
              label: VISA_LABELS[parsed.visaStatus],
              needsSponsorship: parsed.needsSponsorship,
              signal: parsed.visaSignal,
            }
          : null,
      );
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData();

    formData.set("email", profile.email);
    formData.set("fullName", profile.fullName);
    formData.set("linkedinUrl", profile.linkedinUrl);
    formData.set("targetRoles", profile.targetRoles ?? "");
    formData.set("targetLocations", profile.targetLocations ?? "");
    formData.set("graduationYear", profile.graduationYear ?? "");
    formData.set(
      "workAuthorization",
      profile.workAuthorization ?? "Student Visa (F-1)",
    );
    formData.set("notes", profile.notes ?? "");

    if (pendingResumeKey) formData.set("resumeKey", pendingResumeKey);
    if (pendingPhone) formData.set("resumePhone", pendingPhone);

    try {
      const result = await saveProfileAction(formData);

      if (result.ok) {
        setStatus({ kind: "saved", at: Date.now() });
        setResumeViewUrl(result.data.resumeViewUrl);
        setHasResume(!!result.data.candidate.resumeKey);
        setPendingResumeKey("");
        setPendingPhone("");
        setPickedFileName(null);
        setAutofilledFields([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setStatus({ kind: "error", message: result.error });
      }
    } finally {
      setIsPending(false);
    }
  }

  async function handleAutoSubmit() {
    setIsPending(true);
    try {
      const result = await submitAllQueuedAction();

      if (result.ok) {
        const { enqueued, skipped, reason } = result.data;

        if (enqueued === 0) {
          setStatus({
            kind: "error",
            message: reason ?? "Nothing queued to submit.",
          });
        } else {
          setStatus({
            kind: "saved",
            at: Date.now(),
          });
        }
      } else {
        setStatus({ kind: "error", message: result.error });
      }
    } finally {
      setIsPending(false);
    }
  }

  async function handleClearSaved() {
    setIsPending(true);
    try {
      const result = await clearSavedAction();

      if (result.ok) setSavedCount(0);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-default-700">
          Resume (PDF){hasResume ? "" : " — required"}
        </span>
        <input
          accept="application/pdf"
          className="rounded-medium border border-default-200 bg-default-100 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-default-200 file:px-3 file:py-1 file:text-sm"
          disabled={isParsing || isPending}
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
        />
        <span className="text-xs text-default-400 leading-relaxed">
          Stored privately on R2. We parse the PDF and auto-fill your contact
          info. Max 5 MB.
          {isParsing && (
            <span className="ml-1 text-primary">
              Parsing resume…
            </span>
          )}
          {!isParsing && hasResume && resumeViewUrl ? (
            <>
              {" "}
              Current resume:{" "}
              <a
                className="underline"
                href={resumeViewUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                view
              </a>{" "}
              <span className="text-default-300">(link valid 24h)</span>.
              Upload a new file to replace it.
            </>
          ) : null}
          {!isParsing && pickedFileName ? ` Selected: ${pickedFileName}` : null}
        </span>
        {autofilledFields.length > 0 && (
          <span className="text-xs text-success-600 leading-relaxed">
            Auto-filled from your resume: {autofilledFields.join(", ")}. Review
            before saving.
          </span>
        )}
        {visaDetection && (
          <div className="rounded-medium border border-primary-200 bg-primary-50/50 p-3 flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wide text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded-full">
                Visa detected
              </span>
              <span className="font-medium text-default-700">
                {visaDetection.label}
              </span>
              {visaDetection.needsSponsorship === true && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-700">
                  Needs sponsorship
                </span>
              )}
              {visaDetection.needsSponsorship === false && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success-100 text-success-700">
                  No sponsorship needed
                </span>
              )}
            </div>
            {visaDetection.signal && (
              <div className="text-default-600 italic">
                &ldquo;{visaDetection.signal}&rdquo;
              </div>
            )}
            <div className="text-default-500">
              If wrong, edit the Work authorization field below — we use that
              when answering sponsorship questions on applications.
            </div>
          </div>
        )}
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          isRequired
          label="Full name"
          value={profile.fullName}
          onValueChange={(v) => update("fullName", v)}
        />
        <Input
          isRequired
          label="Email"
          type="email"
          value={profile.email}
          onValueChange={(v) => update("email", v)}
        />
      </div>

      <Input
        isRequired
        label="LinkedIn URL"
        placeholder="https://www.linkedin.com/in/..."
        value={profile.linkedinUrl}
        onValueChange={(v) => update("linkedinUrl", v)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Target roles"
          placeholder="Software Engineer Intern, Data Science Intern"
          value={profile.targetRoles ?? ""}
          onValueChange={(v) => update("targetRoles", v)}
        />
        <Input
          label="Target locations"
          placeholder="San Francisco, Seattle, Remote"
          value={profile.targetLocations ?? ""}
          onValueChange={(v) => update("targetLocations", v)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Graduation year"
          placeholder="2027"
          value={profile.graduationYear ?? ""}
          onValueChange={(v) => update("graduationYear", v)}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-default-700">Work authorization</span>
          <select
            className="h-10 rounded-medium border border-default-200 bg-default-100 px-3 text-sm"
            value={profile.workAuthorization ?? "Student Visa (F-1)"}
            onChange={(e) => update("workAuthorization", e.target.value)}
          >
            <option>US Citizen</option>
            <option>Permanent Resident</option>
            <option>Student Visa (F-1)</option>
            <option>Other</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-default-700">
          Notes (optional, e.g. preferred industries)
        </span>
        <textarea
          className="min-h-24 rounded-medium border border-default-200 bg-default-100 px-3 py-2 text-sm"
          value={profile.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
        />
      </label>

      {status.kind === "error" && (
        <p className="text-sm text-danger">{status.message}</p>
      )}
      {status.kind === "saved" && (
        <p className="text-sm text-success">
          Saved at {new Date(status.at).toLocaleTimeString()}.{" "}
          <a className="underline" href="/internships">
            View your matches →
          </a>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-sm text-default-500">
          {savedCount > 0 ? (
            <>
              {savedCount} internship{savedCount === 1 ? "" : "s"} queued
              <button
                className="ml-3 underline text-default-400 hover:text-default-700 disabled:opacity-50"
                disabled={isPending}
                type="button"
                onClick={handleClearSaved}
              >
                clear
              </button>
            </>
          ) : (
            <>No internships queued yet</>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            isDisabled={isParsing}
            isLoading={isPending}
            type="submit"
          >
            Save profile
          </Button>
          <Button
            color="secondary"
            isDisabled={isPending || savedCount === 0}
            isLoading={isPending}
            title={
              savedCount === 0
                ? "Queue some internships first"
                : "Enqueue all queued listings for auto-submission"
            }
            onPress={handleAutoSubmit}
          >
            Auto-submit ({savedCount})
          </Button>
        </div>
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-default-500 leading-relaxed">
          <strong>Guest limit:</strong> 5 auto-submits per day.{" "}
          <a className="underline text-primary" href="/auth/login">
            Sign up
          </a>{" "}
          to unlock a 24-hour 20/day trial and keep your profile across
          devices.
        </p>
      )}
      <p className="text-xs text-default-400 leading-relaxed">
        <strong>Heads up:</strong> the auto-submit button is currently
        disabled while we wire up the Playwright job runner. Your profile and
        saved listings are persisted to Postgres (Neon).
      </p>
    </form>
  );
}
