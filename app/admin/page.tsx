import { Metadata } from "next";
import { notFound } from "next/navigation";

import { readIdentity } from "@/lib/identity";
import { computeAdminSummary, listRecentFailures } from "@/lib/admin";

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
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">Admin</h1>
        <p className="text-default-500 text-sm md:text-base">
          Pipeline diagnostics across all candidates. Signed in as{" "}
          <code className="text-xs">{identity.email}</code>.
        </p>
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
        subtitle="Latest failed or skipped submissions across all candidates"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-default-500 text-left">
              <tr>
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Candidate</th>
                <th className="py-2 pr-3">Portal</th>
                <th className="py-2 pr-3">Company / Role</th>
                <th className="py-2 pr-3">Note</th>
                <th className="py-2 pr-3">Shot</th>
                <th className="py-2">Video</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((f) => {
                const shot = extractScreenshot(f.statusNote);
                const video = extractVideo(f.statusNote);
                const noteCleaned = f.statusNote
                  ? f.statusNote
                      .replace(/\s*\|\s*screenshot:\s*\S+/, "")
                      .replace(/\s*\|\s*video:\s*\S+/, "")
                  : "";

                return (
                  <tr
                    key={f.id}
                    className="border-t border-default-100 align-top"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(f.savedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="font-medium">{f.candidateName}</div>
                      <div className="text-default-500">
                        {f.candidateEmail}
                      </div>
                    </td>
                    <td className="py-2 pr-3 font-mono">{hostOf(f.url)}</td>
                    <td className="py-2 pr-3">
                      <a
                        className="font-medium text-primary hover:underline"
                        href={f.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {f.companyName}
                      </a>
                      <div className="text-default-500">{f.title}</div>
                    </td>
                    <td className="py-2 pr-3 text-default-700 max-w-md break-words">
                      {noteCleaned || "(no note)"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {shot ? (
                        <a
                          className="text-primary underline"
                          href={shot}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          view
                        </a>
                      ) : (
                        <span className="text-default-300">—</span>
                      )}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      {video ? (
                        <a
                          className="text-primary underline"
                          href={video}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          play
                        </a>
                      ) : (
                        <span className="text-default-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
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
