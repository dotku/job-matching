import { Suspense } from "react";
import { Metadata } from "next";
import Script from "next/script";

import { fetchInternships } from "@/lib/internships";
import { siteConfig } from "@/config/site";
import { readIdentity } from "@/lib/identity";
import { getCandidateByExternalId } from "@/lib/candidates";
import { InternshipsClient } from "./InternshipsClient";

export const metadata: Metadata = {
  title: "Summer 2026 Internships",
  description:
    "Browse 1000+ active Summer 2026 tech internships — Software, Hardware, Quant, Data, Product, Design. Filter by location, category, and visa sponsorship.",
  alternates: { canonical: "/internships" },
  openGraph: {
    title: "Summer 2026 Internships",
    description:
      "Live tech internship listings refreshed hourly. Sponsorship status surfaced upfront — F-1 students don't waste clicks.",
    url: `${siteConfig.url}/internships`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Summer 2026 Internships",
    description:
      "Live tech internship listings — filter by location, category, sponsorship.",
  },
};

export const dynamic = "force-dynamic";

export default async function InternshipsPage() {
  const [{ listings, source, fetchedAt }, { externalId }] = await Promise.all([
    fetchInternships(),
    readIdentity(),
  ]);
  const candidate = externalId
    ? await getCandidateByExternalId(externalId)
    : null;
  const matchProfile = candidate
    ? {
        targetRoles: candidate.targetRoles ?? null,
        targetLocations: candidate.targetLocations ?? null,
        workAuthorization: candidate.workAuthorization ?? null,
      }
    : null;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Summer 2026 Internships",
    url: `${siteConfig.url}/internships`,
    description: `${listings.length.toLocaleString()} active Summer 2026 internship listings, refreshed every 6 hours.`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 10).map((l, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "JobPosting",
          title: l.title,
          hiringOrganization: {
            "@type": "Organization",
            name: l.company_name,
          },
          jobLocation: l.locations.slice(0, 1).map((loc) => ({
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: loc },
          })),
          datePosted: new Date(l.date_posted * 1000).toISOString(),
          employmentType: "INTERN",
          url: l.url,
        },
      })),
    },
  };

  return (
    <section className="py-6">
      <Script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
        id="ld-internships"
        type="application/ld+json"
      />
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Summer 2026 Internships
        </h1>
        <p className="text-default-500 text-sm md:text-base">
          {listings.length.toLocaleString()} active listings — refreshed every
          6 hours. Pay info is shown when available; otherwise verify on the
          company posting.
        </p>
      </div>

      <Suspense>
        <InternshipsClient
          fetchedAt={fetchedAt}
          listings={listings}
          matchProfile={matchProfile}
          source={source}
        />
      </Suspense>
    </section>
  );
}
