import { Suspense } from "react";
import NextLink from "next/link";
import { Button } from "@nextui-org/button";

import { fetchInternships } from "@/lib/internships";

export default async function HomePage() {
  return (
    <section className="py-10 md:py-16 flex flex-col gap-12">
      <div className="flex flex-col items-center text-center gap-5 max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-widest text-default-500">
          Job Matching · Student Edition
        </span>
        <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
          Find a paid summer internship.
          <br className="hidden md:inline" />
          <span className="text-primary"> Auto-apply with one click.</span>
        </h1>
        <p className="text-default-500 text-base md:text-lg">
          Bring your resume and LinkedIn. We pull live tech internship listings
          and submit applications on your behalf.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            as={NextLink}
            color="primary"
            href="/internships"
            size="lg"
          >
            Browse internships
          </Button>
          <Button
            as={NextLink}
            href="/apply"
            size="lg"
            variant="bordered"
          >
            Set up auto-apply
          </Button>
        </div>
        <Suspense fallback={null}>
          <LiveCount />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          body="Live Summer 2026 listings refreshed hourly. Filter by category, location, and visa sponsorship."
          title="Real listings, not scraped junk"
        />
        <FeatureCard
          body="Save your resume URL, LinkedIn, target roles, locations, and work authorization once. Reuse across every application."
          title="One profile, every application"
        />
        <FeatureCard
          body="Sponsorship status surfaced upfront. Never waste a click on US-citizen-only roles when you're on F-1."
          title="F-1 friendly"
        />
      </div>
    </section>
  );
}

async function LiveCount() {
  try {
    const { listings } = await fetchInternships();

    return (
      <p className="text-xs text-default-500">
        {listings.length.toLocaleString()} active Summer 2026 listings right now
      </p>
    );
  } catch {
    return null;
  }
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-large border border-default-200 bg-content1 p-5 flex flex-col gap-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-default-500 leading-relaxed">{body}</p>
    </div>
  );
}
