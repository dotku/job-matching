import { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { QUOTA } from "@/lib/quota";
import { readIdentity } from "@/lib/identity";
import { getCandidateByExternalId } from "@/lib/candidates";
import { getBillingState } from "@/lib/billing";

import { CheckoutButton, PortalButton } from "./PricingButtons";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free for casual searches. Pro unlocks 50 auto-submissions per day and bulk queue execution.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — Job Matching",
    description: "Free for casual searches. Pro for the apply-to-everything crowd.",
    url: `${siteConfig.url}/pricing`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";

const MONTHLY_PRICE_USD = 14.99;
const YEARLY_PRICE_USD = 99;

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ canceled?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { externalId } = await readIdentity();
  const candidate = externalId
    ? await getCandidateByExternalId(externalId)
    : null;
  const billing = candidate ? await getBillingState(candidate.id) : null;
  const isPro = billing?.tier === "pro";

  return (
    <section className="py-10 max-w-5xl mx-auto">
      <div className="text-center flex flex-col gap-3 mb-10">
        <h1 className="text-3xl md:text-5xl font-semibold">Pricing</h1>
        <p className="text-default-500 text-base">
          Free is real. Pro is for the apply-to-everything crowd.
        </p>
        {params.canceled && (
          <p className="text-sm text-warning">
            Checkout canceled — no charge made.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlanCard
          cta={
            isPro ? null : (
              <button
                className="w-full h-10 rounded-medium border border-default-200 text-sm font-medium hover:bg-default-100"
                disabled
                type="button"
              >
                You&apos;re on Free
              </button>
            )
          }
          features={[
            `${QUOTA.free.daily} auto-submits per day`,
            `${QUOTA.free.weekly} auto-submits per week`,
            `${QUOTA.trial.daily}/day for the first 24 hours after signup`,
            "Live Summer 2026 listings",
            "Visa sponsorship filter",
          ]}
          price="$0"
          subtitle="Forever"
          title="Free"
        />

        <PlanCard
          cta={
            isPro ? (
              <PortalButton />
            ) : (
              <div className="flex flex-col gap-2">
                <CheckoutButton plan="monthly">
                  Subscribe — ${MONTHLY_PRICE_USD}/mo
                </CheckoutButton>
                <CheckoutButton plan="yearly" variant="bordered">
                  Or ${YEARLY_PRICE_USD}/year (save ~45%)
                </CheckoutButton>
              </div>
            )
          }
          features={[
            `${QUOTA.pro.daily} auto-submits per day`,
            `${QUOTA.pro.weekly} auto-submits per week`,
            "Priority queue during peak hiring weeks",
            "Saved-resume revisions",
            "Cancel anytime",
          ]}
          highlighted
          price={`$${MONTHLY_PRICE_USD}`}
          subtitle="per month"
          title={isPro ? "Pro · Active" : "Pro"}
        />
      </div>

      <p className="mt-10 text-center text-xs text-default-400">
        Failed submissions don&apos;t count against your quota. Quotas are
        aggregated across accounts that share an email or phone number.
      </p>
    </section>
  );
}

function PlanCard({
  title,
  subtitle,
  price,
  features,
  cta,
  highlighted,
}: {
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  cta: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col gap-5 p-6 rounded-large border " +
        (highlighted
          ? "border-primary bg-primary-50/40"
          : "border-default-200 bg-content1")
      }
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums">{price}</span>
          <span className="text-sm text-default-500">/ {subtitle}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span aria-hidden className="text-primary">
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">{cta}</div>
    </div>
  );
}
