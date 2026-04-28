import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { computeLlmSpend } from "@/lib/admin";
import { readIdentity } from "@/lib/identity";

export const metadata: Metadata = {
  title: "Admin — LLM usage",
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

export default async function AdminLlmPage() {
  const identity = await readIdentity();

  if (!identity.isAuthenticated || !isAdmin(identity.email)) {
    notFound();
  }

  const spend = await computeLlmSpend();

  return (
    <section className="py-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-default-500 mb-1">
            <Link className="hover:underline" href="/admin">
              ← Admin
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold">LLM usage</h1>
          <p className="text-default-500 text-sm md:text-base">
            Aggregate across all candidates. BYOK calls cost us nothing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStat
          label="Total calls"
          value={spend.totalCalls.toLocaleString()}
        />
        <MiniStat
          hint={`${spend.byokCandidates} candidate${spend.byokCandidates === 1 ? "" : "s"} on BYOK`}
          label="BYOK calls"
          value={spend.byokCalls.toLocaleString()}
        />
        <MiniStat
          label="Paid calls"
          value={spend.paidCalls.toLocaleString()}
        />
        <MiniStat
          hint={`${spend.totalInputTokens.toLocaleString()} in · ${spend.totalOutputTokens.toLocaleString()} out`}
          label="Total tokens"
          value={(
            spend.totalInputTokens + spend.totalOutputTokens
          ).toLocaleString()}
        />
        <MiniStat
          hint="Only paid (non-BYOK) calls"
          label="Our spend"
          value={formatMicroCentsUsd(spend.totalSpentMicroCents)}
        />
      </div>

      <div className="rounded-large border border-default-200 bg-content1 p-4">
        <div className="text-base font-semibold mb-3">By provider · model</div>
        <table className="w-full text-sm">
          <thead className="text-xs text-default-500">
            <tr>
              <th className="text-left py-1">Provider · Model</th>
              <th className="text-right">Calls</th>
              <th className="text-right">BYOK</th>
              <th className="text-right">Paid spend</th>
            </tr>
          </thead>
          <tbody>
            {spend.byModel.map((m) => (
              <tr
                key={`${m.provider}/${m.model}`}
                className="border-t border-default-100"
              >
                <td className="py-1 font-mono text-xs">
                  {m.provider}/{m.model}
                </td>
                <td className="text-right tabular-nums">
                  {m.calls.toLocaleString()}
                </td>
                <td className="text-right tabular-nums text-default-500">
                  {m.byokCalls.toLocaleString()}
                </td>
                <td className="text-right tabular-nums">
                  {m.costMicroCents > 0
                    ? formatMicroCentsUsd(m.costMicroCents)
                    : "—"}
                </td>
              </tr>
            ))}
            {spend.byModel.length === 0 && (
              <tr>
                <td
                  className="py-3 text-center text-default-400 text-xs"
                  colSpan={4}
                >
                  No LLM calls logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-medium border border-default-200 bg-default-50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-default-500">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      {hint && (
        <div className="text-[10px] text-default-500 mt-0.5">{hint}</div>
      )}
    </div>
  );
}

function formatMicroCentsUsd(microCents: number): string {
  const usd = microCents / 1e8;

  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  if (usd >= 0.0001) return `$${usd.toFixed(4)}`;

  return `$${usd.toFixed(6)}`;
}
