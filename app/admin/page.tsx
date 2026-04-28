import { Metadata } from "next";
import { notFound } from "next/navigation";

import { readIdentity } from "@/lib/identity";
import {
  AdminFailureRow,
  computeAdminSummary,
  listRecentFailures,
} from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin — Pipeline diagnostics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return allow.includes(email.toLowerCase());
}

function extractScreenshot(note: string | null): string | null {
  if (!note) return null;
  const m = note.match(/screenshot:\s*(https?:\/\/\S+)/);

  return m?.[1] ?? null;
}

function extractVideo(note: string | null): string | null {
  if (!note) return null;
  const m = note.match(/video:\s*(https?:\/\/\S+)/);

  return m?.[1] ?? null;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "(bad url)";
  }
}

export default async function AdminPage() {
  const identity = await readIdentity();

  // Stealth 404 for unauthorized — avoids confirming the route exists.
  if (!identity.isAuthenticated || !isAdmin(identity.email)) {
    notFound();
  }

  const [summary, failures] = await Promise.all([
    computeAdminSummary(),
    listRecentFailures(200),
  ]);

  return (
    <section className="py-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Admin</h1>
          <p className="text-default-500 text-sm md:text-base">
            Submit pipeline diagnostics across all candidates. Signed in as{" "}
            <code className="text-xs">{identity.email}</code>.
          </p>
        </div>
        <nav className="flex items-center gap-2 text-xs">
          <a
            className="px-3 py-1.5 rounded-full bg-default-100 text-default-700 hover:bg-default-200"
            href="/admin/llm"
          >
            LLM usage →
          </a>
        </nav>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Candidates" value={summary.totalCandidates} />
        <KpiCard
          label="Submitted"
          tone="success"
          value={statusCount(summary, "submitted")}
        />
        <KpiCard
          label="Submitting"
          tone="warning"
          value={statusCount(summary, "submitting")}
        />
        <KpiCard
          label="Queued"
          tone="primary"
          value={statusCount(summary, "queued")}
        />
        <KpiCard
          label="Failed"
          tone="danger"
          value={statusCount(summary, "failed")}
        />
      </div>

      <Panel
        title={`Outcome funnel (${summary.outcomeFunnel.submitted} submitted)`}
        subtitle="Where submitted applications stand today — pending means submitted but no downstream signal yet."
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <FunnelCell
            label="Awaiting"
            n={summary.outcomeFunnel.pending + summary.outcomeFunnel.confirmed}
            sub={`${summary.outcomeFunnel.confirmed} confirmed + ${summary.outcomeFunnel.pending} pending`}
            tone="default"
          />
          <FunnelCell
            label="Screening"
            n={summary.outcomeFunnel.screening}
            tone="warning"
          />
          <FunnelCell
            label="Interview"
            n={summary.outcomeFunnel.interviewing}
            tone="primary"
          />
          <FunnelCell
            label="Offer"
            n={summary.outcomeFunnel.offer + summary.outcomeFunnel.accepted}
            sub={`${summary.outcomeFunnel.accepted} accepted · ${summary.outcomeFunnel.declined} declined`}
            tone="success"
          />
          <FunnelCell
            label="Rejected / Ghosted"
            n={summary.outcomeFunnel.rejected + summary.outcomeFunnel.ghosted}
            sub={`${summary.outcomeFunnel.rejected} rejected · ${summary.outcomeFunnel.ghosted} ghosted`}
            tone="danger"
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="By portal">
          <table className="w-full text-sm">
            <thead className="text-xs text-default-500">
              <tr>
                <th className="text-left py-1">Portal</th>
                <th className="text-right">Total</th>
                <th className="text-right">Failures</th>
                <th className="text-right">Fail %</th>
              </tr>
            </thead>
            <tbody>
              {summary.byPortal.map((p) => (
                <tr key={p.portal} className="border-t border-default-100">
                  <td className="py-1 font-mono text-xs">{p.portal}</td>
                  <td className="text-right tabular-nums">{p.count}</td>
                  <td className="text-right tabular-nums">{p.failures}</td>
                  <td className="text-right tabular-nums text-default-500">
                    {p.count > 0
                      ? `${Math.round((p.failures / p.count) * 100)}%`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Top failure reasons">
          <ul className="flex flex-col gap-2 text-sm">
            {summary.topFailureReasons.map((r) => (
              <li
                key={r.reason}
                className="flex items-start justify-between gap-3"
              >
                <span className="text-default-700 break-words min-w-0 flex-1">
                  {r.reason}
                </span>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-default-100 tabular-nums">
                  {r.count}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title={`Recent failures (${failures.length})`}
        subtitle="Latest failed or skipped submissions across all candidates. Click a screenshot to open full size."
      >
        {failures.length === 0 ? (
          <p className="text-sm text-default-500 text-center py-8">
            No recent failures. 🎉
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {failures.map((f) => (
              <FailureCard key={f.id} row={f} />
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}

function FailureCard({ row }: { row: AdminFailureRow }) {
  const shot = extractScreenshot(row.statusNote);
  const video = extractVideo(row.statusNote);
  const noteCleaned = row.statusNote
    ? row.statusNote
        .replace(/\s*\|\s*screenshot:\s*\S+/, "")
        .replace(/\s*\|\s*video:\s*\S+/, "")
    : "";
  const statusTone =
    row.status === "failed"
      ? "bg-danger-100 text-danger-700"
      : "bg-default-200 text-default-700";

  return (
    <div className="rounded-large border border-default-200 bg-content1 overflow-hidden flex flex-col">
      {shot ? (
        <a
          className="block relative bg-default-100 aspect-[16/10] overflow-hidden group"
          href={shot}
          rel="noopener noreferrer"
          target="_blank"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`${row.companyName} failure screenshot`}
            className="w-full h-full object-cover object-top group-hover:opacity-90 transition-opacity"
            loading="lazy"
            src={shot}
          />
          <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
            open full
          </span>
        </a>
      ) : (
        <div className="bg-default-100 aspect-[16/10] flex items-center justify-center text-xs text-default-400">
          no screenshot
        </div>
      )}

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <a
              className="font-medium text-primary hover:underline block truncate"
              href={row.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {row.companyName}
            </a>
            <div className="text-xs text-default-500 truncate">{row.title}</div>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide ${statusTone}`}
          >
            {row.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-default-500 flex-wrap">
          <span className="font-mono">{hostOf(row.url)}</span>
          <span>·</span>
          <span>{new Date(row.savedAt).toLocaleDateString()}</span>
          {video && (
            <>
              <span>·</span>
              <a
                className="text-primary hover:underline inline-flex items-center gap-1"
                href={video}
                rel="noopener noreferrer"
                target="_blank"
              >
                ▶ video
              </a>
            </>
          )}
        </div>

        <div className="text-xs text-default-600">
          <span className="text-default-500">Candidate:</span>{" "}
          <span className="font-medium">{row.candidateName}</span>{" "}
          <span className="text-default-500">({row.candidateEmail})</span>
        </div>

        {noteCleaned && (
          <p className="text-xs text-default-700 leading-snug break-words mt-auto pt-1 border-t border-default-100">
            {noteCleaned}
          </p>
        )}
      </div>
    </div>
  );
}

function statusCount(
  summary: { byStatus: { status: string; count: number }[] },
  status: string,
): number {
  return summary.byStatus.find((s) => s.status === status)?.count ?? 0;
}

function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger" | "primary" | "warning";
}) {
  const toneClasses: Record<string, string> = {
    default: "border-default-200 bg-content1",
    success: "border-success-200 bg-success-50/40",
    danger: "border-danger-200 bg-danger-50/40",
    primary: "border-primary-200 bg-primary-50/40",
    warning: "border-warning-200 bg-warning-50/40",
  };

  return (
    <div
      className={`rounded-large border p-4 flex flex-col gap-1 ${toneClasses[tone]}`}
    >
      <div className="text-xs uppercase tracking-wide text-default-500">
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function FunnelCell({
  label,
  n,
  sub,
  tone,
}: {
  label: string;
  n: number;
  sub?: string;
  tone: "default" | "primary" | "success" | "danger" | "warning";
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: "bg-default-100 text-default-700",
    primary: "bg-primary-100 text-primary-700",
    success: "bg-success-100 text-success-700",
    danger: "bg-danger-100 text-danger-700",
    warning: "bg-warning-100 text-warning-700",
  };

  return (
    <div className={`rounded-medium p-3 ${toneClasses[tone]}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">{n}</div>
      {sub && <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}


function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4">
      <div className="text-base font-semibold">{title}</div>
      {subtitle && (
        <div className="text-xs text-default-500 mt-0.5">{subtitle}</div>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}
