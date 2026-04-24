"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Link as NextUILink } from "@nextui-org/link";

import type { SavedListing, SubmissionAnswer } from "@/lib/candidates";
import {
  getListingAnswersAction,
  removeSavedListingAction,
  retrySavedListingAction,
  submitAllQueuedAction,
  updateAnswerOverrideAction,
  updateTargetLocationsAction,
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
  const [visible, setVisible] = useState(50);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkInfo, setBulkInfo] = useState<string | null>(null);

  const queuedCount = useMemo(
    () => items.filter((l) => l.status === "queued").length,
    [items],
  );

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

  const shown = filtered.slice(0, visible);

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
      <TargetLocationsEditor initial={initialTargetLocations} />

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
        </div>
        <Button
          color="primary"
          isDisabled={queuedCount === 0 || isBulkRunning}
          isLoading={isBulkRunning}
          onPress={handleSubmitAll}
        >
          Auto-submit all ({queuedCount})
        </Button>
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
              setVisible(50);
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
          setVisible(50);
        }}
      />

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <p className="text-xs text-default-500">
        {filtered.length.toLocaleString()} matching · showing{" "}
        {Math.min(visible, filtered.length)}
      </p>

      <ul className="flex flex-col gap-2">
        {shown.map((l) => (
          <ListingRow
            isBusy={busyId === l.id}
            key={l.id}
            listing={l}
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

      {visible < filtered.length && (
        <div className="flex justify-center pt-4">
          <Button variant="flat" onPress={() => setVisible((n) => n + 50)}>
            Show more
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
}: {
  listing: SavedListing;
  isBusy: boolean;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const canRetry = listing.status === "failed" || listing.status === "skipped";

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

function TargetLocationsEditor({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<
    | { kind: "idle" }
    | { kind: "saved"; at: number }
    | { kind: "error"; m: string }
  >({ kind: "idle" });

  const dirty = value.trim() !== saved.trim();

  async function handleSave() {
    setBusy(true);
    setMsg({ kind: "idle" });
    try {
      const result = await updateTargetLocationsAction(value);

      if (result.ok) {
        setSaved(result.data.targetLocations ?? "");
        setMsg({ kind: "saved", at: Date.now() });
      } else {
        setMsg({ kind: "error", m: result.error });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">Preferred locations</div>
        {msg.kind === "saved" && (
          <span className="text-xs text-success-600">
            Saved at {new Date(msg.at).toLocaleTimeString()}
          </span>
        )}
        {msg.kind === "error" && (
          <span className="text-xs text-danger">{msg.m}</span>
        )}
      </div>
      <Input
        isDisabled={busy}
        placeholder="e.g. San Francisco, Seattle, Remote, or Anywhere in the US"
        value={value}
        onValueChange={setValue}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-default-500">
          Used when the LLM answers &ldquo;Where are you looking to work?&rdquo;
          on applications and to filter match recommendations.
        </span>
        <Button
          color="primary"
          isDisabled={!dirty || busy}
          isLoading={busy}
          size="sm"
          onPress={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
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
