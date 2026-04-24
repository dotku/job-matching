"use client";

import { useMemo, useState } from "react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";

import {
  InternshipListing,
  compensationLabel,
} from "@/lib/internships";
import {
  MatchProfile,
  ScoredListing,
  hasMatchableProfile,
  rankListings,
} from "@/lib/internships-match";
import { queueListingsAction, saveListingAction } from "@/app/apply/actions";

interface Props {
  listings: InternshipListing[];
  matchProfile: MatchProfile | null;
  source: string;
  fetchedAt: number;
}

const PAGE_SIZE = 30;
const RECOMMENDED_LIMIT = 12;
const QUEUE_ALL_LIMIT = 20;

export function InternshipsClient({
  listings,
  matchProfile,
  source,
  fetchedAt,
}: Props) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sponsorshipOnly, setSponsorshipOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [bulkState, setBulkState] = useState<
    { kind: "idle" } | { kind: "queueing" } | { kind: "done"; n: number } | { kind: "error"; msg: string }
  >({ kind: "idle" });

  const canMatch =
    !!matchProfile && hasMatchableProfile(matchProfile);

  const recommended: ScoredListing[] = useMemo(() => {
    if (!canMatch) return [];

    return rankListings(listings, matchProfile!).slice(0, RECOMMENDED_LIMIT);
  }, [listings, matchProfile, canMatch]);

  const categories = useMemo(() => {
    const set = new Set<string>();

    listings.forEach((l) => l.category && set.add(l.category));

    return ["All", ...Array.from(set).sort()];
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = location.trim().toLowerCase();

    return listings.filter((l) => {
      if (category !== "All" && l.category !== category) return false;
      if (sponsorshipOnly && l.sponsorship !== "Offers Sponsorship")
        return false;
      if (q && !`${l.company_name} ${l.title}`.toLowerCase().includes(q))
        return false;
      if (loc && !l.locations.some((x) => x.toLowerCase().includes(loc)))
        return false;

      return true;
    });
  }, [listings, query, location, category, sponsorshipOnly]);

  const visible = filtered.slice(0, visibleCount);

  async function handleQueueAll() {
    setBulkState({ kind: "queueing" });
    const top = rankListings(listings, matchProfile!).slice(0, QUEUE_ALL_LIMIT);
    const payload = top.map((s) => ({
      listingId: s.listing.id,
      companyName: s.listing.company_name,
      title: s.listing.title,
      url: s.listing.url,
      category: s.listing.category,
      locations: s.listing.locations,
      sponsorship: s.listing.sponsorship,
    }));
    const result = await queueListingsAction(payload);

    if (!result.ok) {
      if (result.error.includes("profile")) {
        window.location.href = "/apply";

        return;
      }
      setBulkState({ kind: "error", msg: result.error });

      return;
    }
    setQueuedIds((prev) => {
      const next = new Set(Array.from(prev));

      top.forEach((s) => next.add(s.listing.id));

      return next;
    });
    setBulkState({ kind: "done", n: result.data.queued });
  }

  return (
    <div className="flex flex-col gap-6">
      {canMatch ? (
        <RecommendedSection
          bulkState={bulkState}
          matchProfile={matchProfile!}
          queuedIds={queuedIds}
          recommended={recommended}
          onQueueAll={handleQueueAll}
          onQueuedOne={(id) =>
            setQueuedIds((prev) => {
              const next = new Set(Array.from(prev));

              next.add(id);

              return next;
            })
          }
        />
      ) : (
        <NoMatchHint hasProfile={!!matchProfile} />
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Browse all</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Company or role"
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setVisibleCount(PAGE_SIZE);
            }}
          />
          <Input
            placeholder="Location (e.g. San Francisco, Remote)"
            value={location}
            onValueChange={(v) => {
              setLocation(v);
              setVisibleCount(PAGE_SIZE);
            }}
          />
          <select
            aria-label="Category"
            className="h-10 rounded-medium border border-default-200 bg-default-100 px-3 text-sm"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={sponsorshipOnly}
              type="checkbox"
              onChange={(e) => {
                setSponsorshipOnly(e.target.checked);
                setVisibleCount(PAGE_SIZE);
              }}
            />
            Visa sponsorship only
          </label>
        </div>

        <p className="text-xs text-default-500">
          {filtered.length.toLocaleString()} matching · showing{" "}
          {Math.min(visibleCount, filtered.length)}
        </p>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((l) => (
            <ListingCard
              isQueued={queuedIds.has(l.id)}
              key={l.id}
              listing={l}
              onQueued={(id) =>
                setQueuedIds((prev) => {
              const next = new Set(Array.from(prev));

              next.add(id);

              return next;
            })
              }
            />
          ))}
        </ul>

        {visible.length < filtered.length && (
          <div className="flex justify-center pt-4">
            <Button
              variant="flat"
              onPress={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Show more
            </Button>
          </div>
        )}

        <p className="mt-6 text-xs text-default-400">
          Last refreshed {new Date(fetchedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function RecommendedSection({
  recommended,
  matchProfile,
  queuedIds,
  bulkState,
  onQueueAll,
  onQueuedOne,
}: {
  recommended: ScoredListing[];
  matchProfile: MatchProfile;
  queuedIds: Set<string>;
  bulkState:
    | { kind: "idle" }
    | { kind: "queueing" }
    | { kind: "done"; n: number }
    | { kind: "error"; msg: string };
  onQueueAll: () => void;
  onQueuedOne: (id: string) => void;
}) {
  if (recommended.length === 0) {
    return (
      <div className="rounded-large border border-default-200 bg-content1 p-4 text-sm flex flex-col gap-2">
        <div className="font-medium">Recommended for you</div>
        <p className="text-default-500 leading-relaxed">
          No strong matches found. We looked for{" "}
          <code className="text-default-700">
            {matchProfile.targetRoles || "(none)"}
          </code>
          {matchProfile.targetLocations
            ? ` in ${matchProfile.targetLocations}`
            : ""}
          . Try broadening your target roles on the{" "}
          <a className="underline" href="/apply">
            profile page
          </a>{" "}
          (e.g. add &ldquo;Data Science Intern&rdquo;, &ldquo;ML Intern&rdquo;)
          and reload, or browse below.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-large border border-primary-200 bg-primary-50/50 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold">Recommended for you</div>
          <div className="text-xs text-default-500">
            Matched against your resume, target roles, and work authorization.
          </div>
        </div>
        <Button
          color="primary"
          isDisabled={bulkState.kind === "queueing"}
          isLoading={bulkState.kind === "queueing"}
          size="sm"
          onPress={onQueueAll}
        >
          Queue top {QUEUE_ALL_LIMIT}
        </Button>
      </div>

      {bulkState.kind === "done" && (
        <p className="text-xs text-success-700">
          Queued {bulkState.n} listing{bulkState.n === 1 ? "" : "s"}. Review on{" "}
          <a className="underline" href="/apply">/apply</a>.
        </p>
      )}
      {bulkState.kind === "error" && (
        <p className="text-xs text-danger">{bulkState.msg}</p>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommended.map((s) => (
          <ListingCard
            isQueued={queuedIds.has(s.listing.id)}
            key={s.listing.id}
            listing={s.listing}
            reasons={s.reasons}
            score={s.score}
            onQueued={onQueuedOne}
          />
        ))}
      </ul>
    </div>
  );
}

function NoMatchHint({ hasProfile }: { hasProfile: boolean }) {
  return (
    <div className="rounded-large border border-default-200 bg-content1 p-4 text-sm">
      <div className="font-medium mb-1">Get personalized recommendations</div>
      <p className="text-default-500">
        {hasProfile
          ? "Add your target roles on the profile page so we can rank these listings for you."
          : "Upload your resume on the profile page — we'll parse it and rank these listings for you."}{" "}
        <a className="underline" href="/apply">
          Go to profile →
        </a>
      </p>
    </div>
  );
}

function ListingCard({
  listing,
  reasons,
  score,
  isQueued,
  onQueued,
}: {
  listing: InternshipListing;
  reasons?: string[];
  score?: number;
  isQueued: boolean;
  onQueued: (id: string) => void;
}) {
  const pay = compensationLabel(listing);

  return (
    <li className="rounded-large border border-default-200 bg-content1 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-default-500">
            {listing.company_name}
          </div>
          <h3 className="text-base font-semibold leading-tight">
            {listing.title}
          </h3>
        </div>
        <span
          className={
            pay.tone === "success"
              ? "shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-success-100 text-success-700"
              : "shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-default-200 text-default-700"
          }
          title={pay.note}
        >
          {pay.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 text-xs text-default-500">
        {listing.locations.slice(0, 3).map((loc) => (
          <span
            key={loc}
            className="px-2 py-0.5 rounded-full bg-default-100"
          >
            {loc}
          </span>
        ))}
        {listing.locations.length > 3 && (
          <span className="px-2 py-0.5">
            +{listing.locations.length - 3} more
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
          {listing.category}
        </span>
        {listing.sponsorship === "Offers Sponsorship" && (
          <span className="px-2 py-0.5 rounded-full bg-secondary-50 text-secondary-700">
            Sponsorship offered
          </span>
        )}
        {listing.sponsorship === "Does Not Offer Sponsorship" && (
          <span className="px-2 py-0.5 rounded-full bg-warning-50 text-warning-700">
            No sponsorship
          </span>
        )}
        {listing.sponsorship === "U.S. Citizenship Required" && (
          <span className="px-2 py-0.5 rounded-full bg-danger-50 text-danger-700">
            US citizen only
          </span>
        )}
        {typeof score === "number" && (
          <span
            className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-800"
            title={reasons?.join(" · ")}
          >
            Match {score}
          </span>
        )}
      </div>

      {reasons && reasons.length > 0 && (
        <p className="text-xs text-default-500 leading-snug">
          {reasons.slice(0, 2).join(" · ")}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between">
        <Link isExternal className="text-sm" href={listing.url} size="sm">
          View posting →
        </Link>
        <ApplyButton
          isQueued={isQueued}
          listing={listing}
          onQueued={onQueued}
        />
      </div>
    </li>
  );
}

function ApplyButton({
  listing,
  isQueued,
  onQueued,
}: {
  listing: InternshipListing;
  isQueued: boolean;
  onQueued: (id: string) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<
    "idle" | "saved" | "needs-profile" | "error"
  >(isQueued ? "saved" : "idle");

  const handleClick = async () => {
    setIsPending(true);
    try {
      const result = await saveListingAction({
        listingId: listing.id,
        companyName: listing.company_name,
        title: listing.title,
        url: listing.url,
        category: listing.category,
        locations: listing.locations,
        sponsorship: listing.sponsorship,
      });

      if (result.ok) {
        setState("saved");
        onQueued(listing.id);
      } else if (result.error.includes("profile")) {
        setState("needs-profile");
        window.location.href = "/apply";
      } else {
        setState("error");
      }
    } finally {
      setIsPending(false);
    }
  };

  if (state === "saved" || isQueued) {
    return (
      <Button isDisabled color="success" size="sm" variant="flat">
        Queued ✓
      </Button>
    );
  }

  return (
    <Button
      color="primary"
      isLoading={isPending}
      size="sm"
      onPress={handleClick}
    >
      {state === "error" ? "Retry" : "Save & apply"}
    </Button>
  );
}
