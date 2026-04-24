import { Metadata } from "next";
import NextLink from "next/link";

import { getCandidateCookiesEnc } from "@/lib/candidates";

import { ApplyForm } from "./ApplyForm";
import { AutoApplyCookies } from "./AutoApplyCookies";
import { loadProfileAction } from "./actions";

export const metadata: Metadata = {
  title: "Auto-Apply Profile",
  description:
    "Save your resume URL and LinkedIn once. Auto-submit applications to every internship you queue.",
  alternates: { canonical: "/apply" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Auto-Apply Profile — Job Matching",
    description:
      "Set up your resume + LinkedIn once. Queue internships and submit in bulk.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const { candidate, saved, quota, resumeViewUrl, isAuthenticated } =
    await loadProfileAction();
  const cookiesBlob = candidate
    ? await getCandidateCookiesEnc(candidate.id)
    : null;

  return (
    <section className="py-6 max-w-2xl mx-auto">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Auto-Apply Profile
        </h1>
        <p className="text-default-500 text-sm md:text-base">
          We&apos;ll use this profile to submit applications to the internships
          you save. Stored in our Postgres DB and keyed to a secure cookie on
          your device.
        </p>
      </div>

      {quota && (
        <div className="mb-6 rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-default-500">
                {quota.tier === "pro"
                  ? "Pro plan"
                  : quota.inTrial
                    ? "Free · 24h trial bonus"
                    : "Free plan"}
              </div>
              <div className="text-base font-medium">
                Submission quota
              </div>
            </div>
            {quota.tier === "free" ? (
              <NextLink
                className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90"
                href="/pricing"
              >
                Upgrade to Pro · 50/day
              </NextLink>
            ) : (
              <NextLink
                className="text-xs px-3 py-1.5 rounded-full bg-default-200 text-default-700 hover:bg-default-300"
                href="/pricing"
              >
                Manage billing
              </NextLink>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <QuotaBar
              cap={quota.dailyCap}
              label="Today"
              used={quota.dailyUsed}
            />
            <QuotaBar
              cap={quota.weeklyCap}
              label="This week"
              used={quota.weeklyUsed}
            />
          </div>

          <p className="text-xs text-default-500 leading-relaxed">
            Failed submissions don&apos;t count against your quota — only
            successful submits.
            {quota.inTrial &&
              " You're on your first-day trial: 20/day instead of 5 for the next 24h."}
          </p>

          {quota.blockedReason && (
            <p className="text-xs text-warning">{quota.blockedReason}</p>
          )}
        </div>
      )}

      <ApplyForm
        initialCandidate={candidate}
        initialResumeViewUrl={resumeViewUrl}
        initialSavedCount={saved.length}
        isAuthenticated={isAuthenticated}
      />

      {candidate && (
        <div className="mt-6">
          <AutoApplyCookies initiallyHasCookies={!!cookiesBlob} />
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3">
            Queued internships ({saved.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {saved.slice(0, 20).map((s) => (
              <li
                key={s.id}
                className="rounded-medium border border-default-200 bg-content1 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs text-default-500">
                    {s.companyName}
                  </div>
                  <div className="font-medium leading-tight truncate">
                    {s.title}
                  </div>
                  <div className="text-xs text-default-500 mt-1">
                    {(s.locations ?? []).slice(0, 2).join(" · ")} ·{" "}
                    {s.category}
                  </div>
                </div>
                <span
                  className={
                    s.status === "submitted"
                      ? "text-xs px-2 py-1 rounded-full bg-success-100 text-success-700"
                      : "text-xs px-2 py-1 rounded-full bg-default-200 text-default-700"
                  }
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
          {saved.length > 20 && (
            <p className="text-xs text-default-400 mt-2">
              +{saved.length - 20} more
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function QuotaBar({
  label,
  used,
  cap,
}: {
  label: string;
  used: number;
  cap: number;
}) {
  const pct = Math.min(100, cap > 0 ? (used / cap) * 100 : 0);
  const tone =
    pct >= 100
      ? "bg-danger-500"
      : pct >= 80
        ? "bg-warning-500"
        : "bg-primary-500";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-default-500">{label}</span>
        <span className="font-medium tabular-nums">
          {used}/{cap}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-default-200 overflow-hidden">
        <div className={`${tone} h-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
