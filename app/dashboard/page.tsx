import { Metadata } from "next";
import Link from "next/link";

import { loadProfileAction } from "@/app/apply/actions";
import type { SavedListing } from "@/lib/candidates";

import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track your auto-submit pipeline — status, failures, history.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

interface Stats {
  total: number;
  queued: number;
  submitting: number;
  submitted: number;
  failed: number;
  skipped: number;
  submittedToday: number;
  submittedThisWeek: number;
}

function computeStats(saved: SavedListing[]): Stats {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  let queued = 0;
  let submitting = 0;
  let submitted = 0;
  let failed = 0;
  let skipped = 0;
  let submittedToday = 0;
  let submittedThisWeek = 0;

  for (const s of saved) {
    if (s.status === "queued") queued += 1;
    else if (s.status === "submitting") submitting += 1;
    else if (s.status === "submitted") {
      submitted += 1;
      if (s.submittedAt) {
        const age = now - new Date(s.submittedAt).getTime();

        if (age < DAY) submittedToday += 1;
        if (age < 7 * DAY) submittedThisWeek += 1;
      }
    } else if (s.status === "failed") failed += 1;
    else if (s.status === "skipped") skipped += 1;
  }

  return {
    total: saved.length,
    queued,
    submitting,
    submitted,
    failed,
    skipped,
    submittedToday,
    submittedThisWeek,
  };
}

export default async function DashboardPage() {
  const { candidate, saved, quota } = await loadProfileAction();

  if (!candidate) {
    return (
      <section className="py-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-default-500 text-sm mb-6">
          Set up your profile to start tracking auto-submits.
        </p>
        <Link
          className="text-sm rounded-medium bg-primary text-primary-foreground px-4 py-2 inline-block"
          href="/apply"
        >
          Go to profile →
        </Link>
      </section>
    );
  }

  const stats = computeStats(saved);

  return (
    <section className="py-6 max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">Dashboard</h1>
        <p className="text-default-500 text-sm md:text-base">
          Every internship you&apos;ve queued, submitted, or hit an error on.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          hint={`${stats.submittedToday} today · ${stats.submittedThisWeek} this week`}
          label="Submitted"
          tone="success"
          value={stats.submitted}
        />
        <StatCard
          hint="Worker is actively submitting"
          label="In progress"
          tone="warning"
          value={stats.submitting}
        />
        <StatCard
          hint="Ready for the next auto-submit run"
          label="Queued"
          tone="primary"
          value={stats.queued}
        />
        <StatCard
          hint="Click Retry on a row to re-queue"
          label="Failed"
          tone="danger"
          value={stats.failed}
        />
        <StatCard
          hint={
            quota
              ? `${quota.remainingToday}/${quota.dailyCap} today · ${quota.remainingThisWeek}/${quota.weeklyCap} week`
              : ""
          }
          label="Quota left"
          tone="default"
          value={quota ? quota.remainingToday : 0}
        />
      </div>

      <DashboardClient
        initialTargetLocations={candidate.targetLocations ?? ""}
        listings={saved}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "success" | "primary" | "danger" | "warning" | "default";
}) {
  const toneClasses: Record<typeof tone, string> = {
    success: "border-success-200 bg-success-50/40",
    primary: "border-primary-200 bg-primary-50/40",
    danger: "border-danger-200 bg-danger-50/40",
    warning: "border-warning-200 bg-warning-50/40",
    default: "border-default-200 bg-content1",
  };

  return (
    <div
      className={`rounded-large border p-4 flex flex-col gap-1 ${toneClasses[tone]}`}
    >
      <div className="text-xs uppercase tracking-wide text-default-500">
        {label}
      </div>
      <div className="text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-default-500 leading-snug">{hint}</div>
    </div>
  );
}
