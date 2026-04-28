"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";

import type { Candidate } from "@/lib/candidates";
import { VISA_LABELS, type VisaStatus } from "@/lib/visa";

import { updateProfileDetailsAction } from "@/app/apply/actions";

const VISA_CHOICES: { value: VisaStatus; label: string }[] = [
  { value: "unknown", label: "— Select —" },
  { value: "citizen", label: VISA_LABELS.citizen },
  { value: "permanent_resident", label: VISA_LABELS.permanent_resident },
  { value: "opt_f1", label: VISA_LABELS.opt_f1 },
  { value: "cpt_f1", label: VISA_LABELS.cpt_f1 },
  { value: "f1_pre_opt", label: VISA_LABELS.f1_pre_opt },
  { value: "h1b", label: VISA_LABELS.h1b },
  { value: "other_visa", label: VISA_LABELS.other_visa },
];

/** Reverse-map a stored free-text work_authorization back into the enum value, best-effort. */
function matchVisaChoice(stored: string | undefined): VisaStatus {
  if (!stored) return "unknown";
  const exact = VISA_CHOICES.find((c) => c.label === stored);

  if (exact) return exact.value;

  return "unknown";
}

export function ProfileDetails({ candidate }: { candidate: Candidate }) {
  const [fullName, setFullName] = useState(candidate.fullName);
  const [linkedinUrl, setLinkedinUrl] = useState(candidate.linkedinUrl);
  const [targetRoles, setTargetRoles] = useState(candidate.targetRoles ?? "");
  const [graduationYear, setGraduationYear] = useState(
    candidate.graduationYear ?? "",
  );
  const [visa, setVisa] = useState<VisaStatus>(
    matchVisaChoice(candidate.workAuthorization),
  );
  const [visaCustom, setVisaCustom] = useState(
    matchVisaChoice(candidate.workAuthorization) === "unknown"
      ? (candidate.workAuthorization ?? "")
      : "",
  );
  const [notes, setNotes] = useState(candidate.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<
    | { kind: "idle" }
    | { kind: "saved"; at: number }
    | { kind: "error"; m: string }
  >({ kind: "idle" });

  const authLabel =
    visa === "unknown" ? visaCustom.trim() : VISA_LABELS[visa];

  async function handleSave() {
    setBusy(true);
    setMsg({ kind: "idle" });
    try {
      const result = await updateProfileDetailsAction({
        fullName,
        linkedinUrl,
        targetRoles,
        graduationYear,
        workAuthorization: authLabel,
        notes,
      });

      if (result.ok) {
        setMsg({ kind: "saved", at: Date.now() });
      } else {
        setMsg({ kind: "error", m: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">Profile details</div>
        {msg.kind === "saved" && (
          <span className="text-xs text-success-600">
            Saved at {new Date(msg.at).toLocaleTimeString()}
          </span>
        )}
        {msg.kind === "error" && (
          <span className="text-xs text-danger">{msg.m}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          isRequired
          label="Full name"
          value={fullName}
          onValueChange={setFullName}
        />
        <Input
          isRequired
          label="LinkedIn URL"
          placeholder="https://www.linkedin.com/in/..."
          value={linkedinUrl}
          onValueChange={setLinkedinUrl}
        />
        <Input
          label="Target roles"
          placeholder="Software Engineer Intern, ML Intern"
          value={targetRoles}
          onValueChange={setTargetRoles}
        />
        <Input
          label="Graduation year"
          placeholder="2027"
          value={graduationYear}
          onValueChange={setGraduationYear}
        />
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs text-default-500">Work authorization</label>
          <select
            className="rounded-medium border border-default-200 bg-content1 px-3 py-2 text-sm"
            value={visa}
            onChange={(e) => setVisa(e.target.value as VisaStatus)}
          >
            {VISA_CHOICES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {visa === "unknown" && (
            <Input
              description="Pick from the dropdown above, or type a custom value here."
              placeholder="e.g. EAD (pending adjustment of status)"
              size="sm"
              value={visaCustom}
              onValueChange={setVisaCustom}
            />
          )}
          <p className="text-[11px] text-default-500">
            Used to answer sponsorship questions on application forms. Filled
            automatically when you upload a resume — edit here if we got it
            wrong.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-default-500">Notes</label>
        <textarea
          className="min-h-20 rounded-medium border border-default-200 bg-content1 px-3 py-2 text-sm"
          placeholder="Anything else we should know — e.g. 'prefer hybrid', 'open to relocation'"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          color="primary"
          isDisabled={busy || !fullName.trim() || !linkedinUrl.trim()}
          isLoading={busy}
          size="sm"
          onPress={handleSave}
        >
          Save changes
        </Button>
        <span className="text-[11px] text-default-400">
          Email and resume upload live on the Apply page.
        </span>
      </div>
    </div>
  );
}
