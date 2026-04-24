"use server";

import { redirect } from "next/navigation";

import { ensureIdentity, readIdentity } from "@/lib/identity";
import { getCandidateByExternalId } from "@/lib/candidates";
import { ensureStripeCustomer, getBillingState } from "@/lib/billing";
import { stripe, PRICE_IDS, STRIPE_CONFIGURED } from "@/lib/stripe";
import { siteConfig } from "@/config/site";

export type CheckoutPlan = "monthly" | "yearly";

export interface ActionError {
  ok: false;
  error: string;
}

function priceFor(plan: CheckoutPlan): string {
  return plan === "yearly" ? PRICE_IDS.proYearly : PRICE_IDS.proMonthly;
}

export async function startCheckoutAction(
  plan: CheckoutPlan,
): Promise<ActionError | never> {
  if (!STRIPE_CONFIGURED) {
    return { ok: false, error: "Stripe is not configured." };
  }
  const priceId = priceFor(plan);

  if (!priceId) {
    return {
      ok: false,
      error: `No price ID configured for ${plan}. Set STRIPE_PRICE_ID_PRO_${plan.toUpperCase()}.`,
    };
  }

  const { externalId, isAuthenticated } = await ensureIdentity();
  const candidate = await getCandidateByExternalId(externalId);

  if (!candidate) {
    return {
      ok: false,
      error: "Save your profile on /apply before subscribing.",
    };
  }

  const customerId = await ensureStripeCustomer(candidate.id);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteConfig.url}/apply?upgraded=1`,
    cancel_url: `${siteConfig.url}/pricing?canceled=1`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: false },
    client_reference_id: candidate.id,
    metadata: {
      candidateId: candidate.id,
      authenticated: String(isAuthenticated),
    },
    subscription_data: {
      metadata: { candidateId: candidate.id },
    },
  });

  if (!session.url) {
    return { ok: false, error: "Stripe did not return a checkout URL." };
  }
  redirect(session.url);
}

export async function startPortalAction(): Promise<ActionError | never> {
  if (!STRIPE_CONFIGURED) {
    return { ok: false, error: "Stripe is not configured." };
  }

  const { externalId } = await readIdentity();

  if (!externalId) return { ok: false, error: "Not signed in." };

  const candidate = await getCandidateByExternalId(externalId);

  if (!candidate) return { ok: false, error: "No profile found." };

  const billing = await getBillingState(candidate.id);

  if (!billing.stripeCustomerId) {
    return { ok: false, error: "No Stripe customer for this account yet." };
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${siteConfig.url}/apply`,
  });

  redirect(portal.url);
}
