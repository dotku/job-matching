"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Link as NextUILink } from "@nextui-org/link";

import type { SavedListing, SubmissionAnswer } from "@/lib/candidates";
import {
  getListingAnswersAction,
  getLlmStatusAction,
  markListingSubmittedAction,
  removeSavedListingAction,
  retrySavedListingAction,
  submitAllQueuedAction,
  updateAnswerOverrideAction,
  verifySubmissionsViaGmailAction,
} from "@/app/apply/actions";

type StatusFilter = "all" | SavedListing["status"];

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "queued", label: "Queued" },
  { key: "submitting", label: "In progress" },
  { key: "submitted", label: "Submitted" },
  { key: "failed", label: "Failed" },
  { key: "skipped", label: "Skipped" },
];

interface Props {
  listings: SavedListing[];
  initialTargetLocations: string;
}

export function DashboardClient({ listings, initialTargetLocations }: Props) {
  const [items, setItems] = useState<SavedListing[]>(listings);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkInfo, setBulkInfo] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyInfo, setVerifyInfo] = useState<string | null>(null);
  const [verifyDiag, setVerifyDiag] = useState<
    {
      from: string;
      subject: string;
      outcome: "confirmed" | "not-confirmation" | "no-matching-listing";
      llmCompanyName: string | null;
      rationale: string;
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      byok: boolean;
      costMicroCents: number;
    }[]
  >([]);

  const queuedCount = useMemo(
    () => items.filter((l) => l.status === "queued").length,
    [items],
  );

  async function handleVerifyGmail() {
    setIsVerifying(true);
    setVerifyInfo(null);
    setVerifyDiag([]);
    setError(null);
    try {
      const result = await verifySubmissionsViaGmailAction();

      if (!result.ok) {
        setError(result.error);

        return;
      }
      const {
        scanned,
        updated,
        llmCalls,
        matched,
        scannedEmails,
        skippedReason,
      } = result.data;

      setVerifyDiag(scannedEmails ?? []);

      if (skippedReason) {
        setVerifyInfo(skippedReason);

        return;
      }

      const callsSuffix =
        llmCalls > 0 ? ` · ${llmCalls} LLM call${llmCalls === 1 ? "" : "s"}` : "";

      if (updated === 0) {
        setVerifyInfo(
          `Scanned ${scanned} email${scanned === 1 ? "" : "s"}, no new confirmations matched${callsSuffix}.`,
        );
      } else {
        setVerifyInfo(
          `Found ${updated} confirmation${updated === 1 ? "" : "s"}${callsSuffix}: ${matched
            .map((m) => m.matchedListingCompany)
            .join(", ")}. Rows updated to submitted.`,
        );
        // Flip matched rows locally so user sees them without refresh
        const matchedListingCompanies = new Set(
          matched.map((m) => m.matchedListingCompany),
        );

        setItems((prev) =>
          prev.map((l) =>
            matchedListingCompanies.has(l.companyName) && l.status !== "submitted"
              ? {
                  ...l,
                  status: "submitted" as const,
                  submittedAt: new Date().toISOString(),
                }
              : l,
          ),
        );
      }
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSubmitAll() {
    setIsBulkRunning(true);
    setError(null);
    setBulkInfo(null);
    try {
      const result = await submitAllQueuedAction();

      if (!result.ok) {
        setError(result.error);

        return;
      }
      const { enqueued, skipped, reason } = result.data;

      if (enqueued === 0) {
        setBulkInfo(reason ?? "Nothing to enqueue.");
      } else {
        setBulkInfo(
          `Enqueued ${enqueued} listing${enqueued === 1 ? "" : "s"} to the worker.${
            skipped > 0 ? ` ${skipped} skipped (over quota).` : ""
          } Refresh in a minute to see updated statuses.`,
        );
      }
    } finally {
      setIsBulkRunning(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (
        q &&
        !`${l.companyName} ${l.title}`.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [items, filter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const shown = filtered.slice(pageStart, pageEnd);

  async function handleRemove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await removeSavedListingAction(id);

      if (result.ok) {
        setItems((prev) => prev.filter((l) => l.id !== id));
      } else {
        setError(result.error);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleRetry(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await retrySavedListingAction(id);

      if (result.ok) {
        setItems((prev) =>
          prev.map((l) => (l.id === id ? result.data : l)),
        );
      } else {
        setError(result.error);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkSubmitted(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await markListingSubmittedAction(id);

      if (result.ok) {
        setItems((prev) =>
          prev.map((l) => (l.id === id ? result.data : l)),
        );
      } else {
        setError(result.error);
      }
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: items.length,
      queued: 0,
      submitting: 0,
      submitted: 0,
      failed: 0,
      skipped: 0,
    };

    items.forEach((l) => {
      c[l.status] = (c[l.status] ?? 0) + 1;
    });

    return c;
  }, [items]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardSettingsSection initialTargetLocations={initialTargetLocations} />

      <div className="rounded-large border border-primary-200 bg-primary-50/40 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col">
          <div className="text-sm font-medium">
            {queuedCount > 0
              ? `${queuedCount} listing${queuedCount === 1 ? "" : "s"} ready to auto-submit`
              : "No queued listings"}
          </div>
          <div className="text-xs text-default-500">
            Runs via the Fly worker. Only pulls as many as your daily/weekly
            quota allows.
          </div>
          {bulkInfo && (
            <div className="text-xs text-success-700 mt-1">{bulkInfo}</div>
          )}
          {verifyInfo && (
            <div className="text-xs text-success-700 mt-1">{verifyInfo}</div>
          )}
          {verifyDiag.length > 0 && (
            <VerifyDiagTable rows={verifyDiag} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            isDisabled={isVerifying}
            isLoading={isVerifying}
            size="sm"
            variant="flat"
            onPress={handleVerifyGmail}
          >
            Verify via Gmail
          </Button>
          <Button
            color="primary"
            isDisabled={queuedCount === 0 || isBulkRunning}
            isLoading={isBulkRunning}
            onPress={handleSubmitAll}
          >
            Auto-submit all ({queuedCount})
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={
              filter === f.key
                ? "text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground"
                : "text-xs px-3 py-1.5 rounded-full bg-default-100 text-default-700 hover:bg-default-200"
            }
            type="button"
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
          >
            {f.label} ({counts[f.key] ?? 0})
          </button>
        ))}
      </div>

      <Input
        placeholder="Search by company or title"
        value={query}
        onValueChange={(v) => {
          setQuery(v);
          setPage(1);
        }}
      />

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <p className="text-xs text-default-500">
        {filtered.length.toLocaleString()} matching ·{" "}
        {filtered.length === 0
          ? "none to show"
          : `showing ${pageStart + 1}–${pageEnd}`}
      </p>

      <ul className="flex flex-col gap-2">
        {shown.map((l) => (
          <ListingRow
            isBusy={busyId === l.id}
            key={l.id}
            listing={l}
            onMarkSubmitted={() => handleMarkSubmitted(l.id)}
            onRemove={() => handleRemove(l.id)}
            onRetry={() => handleRetry(l.id)}
          />
        ))}
      </ul>
      <style>{`
        details[open] > summary .jm-chevron { transform: rotate(90deg); }
      `}</style>

      {shown.length === 0 && (
        <p className="text-sm text-default-500 text-center py-10">
          No listings match the current filter.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            isDisabled={currentPage <= 1}
            size="sm"
            variant="flat"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <span className="text-xs text-default-500 tabular-nums">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            isDisabled={currentPage >= totalPages}
            size="sm"
            variant="flat"
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ListingRow({
  listing,
  isBusy,
  onRemove,
  onRetry,
  onMarkSubmitted,
}: {
  listing: SavedListing;
  isBusy: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onMarkSubmitted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const canRetry = listing.status === "failed" || listing.status === "skipped";
  const canMarkSubmitted = listing.status !== "submitted";

  return (
    <li className="rounded-medium border border-default-200 bg-content1 flex flex-col">
      <div className="p-3 flex flex-col md:flex-row md:items-center gap-3">
        {listing.answerCount > 0 ? (
          <button
            aria-label={expanded ? "Collapse" : "Expand"}
            className="shrink-0 text-default-400 hover:text-default-700"
            type="button"
            onClick={() => setExpanded((v) => !v)}
          >
            <span
              className="jm-chevron inline-block transition-transform"
              style={{ transform: expanded ? "rotate(90deg)" : "none" }}
            >
              ▸
            </span>
          </button>
        ) : (
          <span className="shrink-0 w-4" aria-hidden="true" />
        )}

        <div className="min-w-0 flex-1">
          <div className="text-xs text-default-500">{listing.companyName}</div>
          <div className="font-medium leading-tight truncate">
            {listing.title}
          </div>
          <div className="text-xs text-default-500 mt-1 flex flex-wrap gap-x-2">
            {listing.locations && listing.locations.length > 0 && (
              <span>{listing.locations.slice(0, 2).join(" · ")}</span>
            )}
            {listing.category && <span>· {listing.category}</span>}
            {listing.submittedAt && (
              <span>
                · submitted {new Date(listing.submittedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {listing.statusNote && (
            <div className="text-xs text-default-500 mt-1 leading-snug break-words">
              <span className="text-default-400">note:</span>{" "}
              {listing.statusNote}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {listing.answerCount > 0 && (
            <span
              className="text-xs px-2 py-1 rounded-full bg-secondary-100 text-secondary-700"
              title="AI answered this many custom questions. Expand to review/edit."
            >
              💬 {listing.answerCount}
            </span>
          )}
          <StatusChip status={listing.status} />
          <NextUILink
            isExternal
            className="text-xs"
            href={listing.url}
            size="sm"
          >
            View
          </NextUILink>
          {canMarkSubmitted && (
            <Button
              color="success"
              isDisabled={isBusy}
              isLoading={isBusy}
              size="sm"
              title="I submitted this manually — mark it as done so it won't be retried."
              variant="flat"
              onPress={onMarkSubmitted}
            >
              Mark submitted
            </Button>
          )}
          {canRetry && (
            <Button
              isDisabled={isBusy}
              isLoading={isBusy}
              size="sm"
              variant="flat"
              onPress={onRetry}
            >
              Retry
            </Button>
          )}
          <Button
            color="danger"
            isDisabled={isBusy}
            isLoading={isBusy}
            size="sm"
            variant="light"
            onPress={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-default-200 bg-default-50/50 p-3">
          <AnswersPanel savedListingId={listing.id} />
        </div>
      )}
    </li>
  );
}

function AnswersPanel({ savedListingId }: { savedListingId: string }) {
  const [answers, setAnswers] = useState<SubmissionAnswer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const result = await getListingAnswersAction(savedListingId);

    if (result.ok) setAnswers(result.data);
    else setError(result.error);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedListingId]);

  if (error) return <p className="text-xs text-danger">{error}</p>;
  if (answers === null)
    return <p className="text-xs text-default-500">Loading Q&amp;A…</p>;

  if (answers.length === 0) {
    return (
      <p className="text-xs text-default-500">
        No custom questions were answered for this submission.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-medium text-default-600">
        Custom questions we answered ({answers.length})
      </div>
      {answers.map((a) => (
        <AnswerItem answer={a} key={a.id} />
      ))}
      <p className="text-xs text-default-400">
        Override an answer to have it reused automatically on the next
        submission that asks the same question.
      </p>
    </div>
  );
}

function AnswerItem({ answer }: { answer: SubmissionAnswer }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    answer.userOverride ?? answer.finalAnswer,
  );
  const [current, setCurrent] = useState(answer);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const result = await updateAnswerOverrideAction(current.id, draft);

      if (result.ok) {
        setCurrent(result.data);
        setEditing(false);
      } else {
        setErr(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  async function clearOverride() {
    setBusy(true);
    setErr(null);
    try {
      const result = await updateAnswerOverrideAction(current.id, "");

      if (result.ok) {
        setCurrent(result.data);
        setDraft(result.data.finalAnswer);
        setEditing(false);
      } else {
        setErr(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-medium border border-default-200 bg-content1 p-3 flex flex-col gap-2">
      <div className="text-xs font-medium text-default-700">
        {current.question}
      </div>

      {!editing ? (
        <>
          <div className="text-xs text-default-600 whitespace-pre-wrap break-words">
            {current.userOverride ?? current.finalAnswer}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {current.userOverride ? (
              <span className="text-[10px] uppercase tracking-wide text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                Your override
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide text-default-500 bg-default-100 px-2 py-0.5 rounded-full">
                AI generated
              </span>
            )}
            <span className="text-[10px] text-default-400">
              {(current.userOverride ?? current.finalAnswer).length}/500
            </span>
            <button
              className="text-xs text-primary underline"
              type="button"
              onClick={() => {
                setDraft(current.userOverride ?? current.finalAnswer);
                setEditing(true);
              }}
            >
              Edit
            </button>
            {current.userOverride && (
              <button
                className="text-xs text-default-500 underline"
                disabled={busy}
                type="button"
                onClick={clearOverride}
              >
                Use AI version
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <textarea
            className="min-h-20 rounded-medium border border-default-200 bg-content1 px-3 py-2 text-sm"
            maxLength={500}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-default-400">
              {draft.length}/500
            </span>
            <Button
              color="primary"
              isDisabled={busy}
              isLoading={busy}
              size="sm"
              onPress={save}
            >
              Save override
            </Button>
            <Button
              isDisabled={busy}
              size="sm"
              variant="flat"
              onPress={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {err && <p className="text-xs text-danger">{err}</p>}
    </div>
  );
}

/**
 * Compact summary of profile-level settings (credits, BYOK, preferred
 * locations) with a link to /profile for editing. Settings themselves
 * live on /profile — this is just the at-a-glance view so users don't
 * need to leave the dashboard to see their status.
 */
function DashboardSettingsSection({
  initialTargetLocations,
}: {
  initialTargetLocations: string;
}) {
  const [summary, setSummary] = useState<{
    creditsMicroCents: number;
    activeProvider: string | null;
    activeModel: string | null;
  }>({
    creditsMicroCents: 0,
    activeProvider: null,
    activeModel: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getLlmStatusAction();

      if (cancelled || !result.ok) return;
      setSummary({
        creditsMicroCents: result.data.creditsMicroCents,
        activeProvider: result.data.activeKey?.provider ?? null,
        activeModel: result.data.activeKey?.model ?? null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const creditsDisplay = (() => {
    const usd = summary.creditsMicroCents / 1e8;

    if (!Number.isFinite(usd)) return "$0.00";
    if (Math.abs(usd) >= 1) return `$${usd.toFixed(2)}`;

    return `$${usd.toFixed(4)}`;
  })();
  const providerDisplay = summary.activeProvider
    ? `BYOK ${summary.activeProvider}/${summary.activeModel ?? ""}`
    : "default provider";
  const trimmed = initialTargetLocations.trim();
  const locationsDisplay = trimmed
    ? trimmed.length > 40
      ? `${trimmed.slice(0, 40)}…`
      : trimmed
    : "no preferred locations";

  return (
    <div className="rounded-large border border-default-200 bg-content1 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium whitespace-nowrap">
          Settings
        </span>
        <span className="text-xs text-default-500 truncate">
          credits {creditsDisplay} · {providerDisplay} · {locationsDisplay}
        </span>
      </div>
      <NextUILink
        className="text-xs whitespace-nowrap"
        href="/profile"
        size="sm"
      >
        Manage →
      </NextUILink>
    </div>
  );
}


function VerifyDiagTable({
  rows,
}: {
  rows: {
    from: string;
    subject: string;
    outcome: "confirmed" | "not-confirmation" | "no-matching-listing";
    llmCompanyName: string | null;
    rationale: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    byok: boolean;
    costMicroCents: number;
  }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const confirmed = rows.filter((r) => r.outcome === "confirmed").length;
  const noMatch = rows.filter((r) => r.outcome === "no-matching-listing").length;
  const rejected = rows.filter((r) => r.outcome === "not-confirmation").length;
  const totalIn = rows.reduce((a, r) => a + r.inputTokens, 0);
  const totalOut = rows.reduce((a, r) => a + r.outputTokens, 0);
  const totalCost = rows.reduce((a, r) => a + r.costMicroCents, 0);

  return (
    <details
      className="mt-2"
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
      open={expanded}
    >
      <summary className="cursor-pointer text-xs text-default-600 hover:text-default-800">
        Details: {confirmed} confirmed · {noMatch} had no matching saved
        listing · {rejected} rejected · {totalIn.toLocaleString()} in +{" "}
        {totalOut.toLocaleString()} out tokens
        {totalCost > 0 && ` · ${formatMicroCentsUsd(totalCost)}`}
      </summary>
      <div className="mt-2 flex flex-col gap-1">
        {rows.map((r, i) => (
          <div
            className="text-[11px] rounded-medium border border-default-200 bg-content1 p-2"
            key={i}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={
                  r.outcome === "confirmed"
                    ? "text-[10px] px-1.5 py-0.5 rounded-full bg-success-100 text-success-700"
                    : r.outcome === "no-matching-listing"
                      ? "text-[10px] px-1.5 py-0.5 rounded-full bg-warning-100 text-warning-700"
                      : "text-[10px] px-1.5 py-0.5 rounded-full bg-default-200 text-default-700"
                }
              >
                {r.outcome}
              </span>
              {r.llmCompanyName && (
                <span className="text-default-600">
                  → {r.llmCompanyName}
                </span>
              )}
              <span className="ml-auto font-mono text-default-500">
                {r.provider}/{r.model}
                {r.byok ? " (BYOK)" : ""} · {r.inputTokens}+{r.outputTokens}{" "}
                tok
                {!r.byok && r.costMicroCents > 0 ? (
                  <> · {formatMicroCentsUsd(r.costMicroCents)}</>
                ) : null}
              </span>
            </div>
            <div className="text-default-700 mt-1 truncate">
              <span className="text-default-500">From:</span> {r.from}
            </div>
            <div className="text-default-700 truncate">
              <span className="text-default-500">Subject:</span> {r.subject}
            </div>
            {r.rationale && (
              <div className="text-default-500 mt-1 italic">
                {r.rationale}
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

/** Micro-cents → "$0.0001" for tiny values, "$0.12" above 1¢. */
function formatMicroCentsUsd(microCents: number): string {
  const usd = microCents / 1e8;

  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  if (usd >= 0.0001) return `$${usd.toFixed(4)}`;

  return `$${usd.toFixed(6)}`;
}

function StatusChip({ status }: { status: SavedListing["status"] }) {
  const styles: Record<SavedListing["status"], string> = {
    queued: "bg-primary-100 text-primary-700",
    submitting: "bg-warning-100 text-warning-700 animate-pulse",
    submitted: "bg-success-100 text-success-700",
    failed: "bg-danger-100 text-danger-700",
    skipped: "bg-default-200 text-default-700",
  };
  const label = status === "submitting" ? "in progress" : status;

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}
    >
      {label}
    </span>
  );
}
