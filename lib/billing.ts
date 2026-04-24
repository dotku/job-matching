import "server-only";

import { sql } from "./db";
import { stripe } from "./stripe";

/**
 * Minimal shape we need from a Stripe subscription. Compatible with both
 * webhook payload objects and SDK retrieve() return values.
 */
interface SubscriptionLike {
  id: string;
  status: string;
  metadata?: Record<string, string> | null;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | null;

export interface BillingState {
  candidateId: string;
  tier: "free" | "pro";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

interface BillingRow {
  id: string;
  email: string;
  tier: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_current_period_end: string | null;
}

async function loadCandidate(candidateId: string): Promise<BillingRow> {
  const rows = (await sql`
    SELECT id, email, tier, stripe_customer_id, stripe_subscription_id,
           subscription_status, subscription_current_period_end
    FROM candidates WHERE id = ${candidateId} LIMIT 1
  `) as unknown as BillingRow[];
  const row = rows[0];

  if (!row) throw new Error(`Candidate ${candidateId} not found`);

  return row;
}

export async function getBillingState(
  candidateId: string,
): Promise<BillingState> {
  const row = await loadCandidate(candidateId);

  return {
    candidateId: row.id,
    tier: row.tier,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status,
    currentPeriodEnd: row.subscription_current_period_end,
  };
}

/**
 * Returns the Stripe customer ID for a candidate, creating one in Stripe and
 * persisting it locally if it doesn't exist yet.
 */
export async function ensureStripeCustomer(
  candidateId: string,
): Promise<string> {
  const row = await loadCandidate(candidateId);

  if (row.stripe_customer_id) return row.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: row.email,
    metadata: { candidateId: row.id },
  });

  await sql`
    UPDATE candidates SET stripe_customer_id = ${customer.id}
    WHERE id = ${candidateId}
  `;

  return customer.id;
}

interface SyncInput {
  candidateId?: string;
  customerId: string;
  subscription: SubscriptionLike;
}

/**
 * Single source of truth for translating a Stripe subscription into our DB.
 * Active/trialing → tier='pro'; everything else → tier='free'. Idempotent.
 */
export async function syncSubscription({
  candidateId,
  customerId,
  subscription,
}: SyncInput): Promise<void> {
  const status = subscription.status;
  const isActive = status === "active" || status === "trialing";
  const tier: "free" | "pro" = isActive ? "pro" : "free";
  const periodEndUnix = (
    subscription as unknown as { current_period_end?: number }
  ).current_period_end;
  const periodEnd =
    typeof periodEndUnix === "number"
      ? new Date(periodEndUnix * 1000).toISOString()
      : null;

  if (candidateId) {
    await sql`
      UPDATE candidates
      SET tier = ${tier},
          stripe_customer_id = ${customerId},
          stripe_subscription_id = ${subscription.id},
          subscription_status = ${status},
          subscription_current_period_end = ${periodEnd}
      WHERE id = ${candidateId}
    `;

    return;
  }

  await sql`
    UPDATE candidates
    SET tier = ${tier},
        stripe_subscription_id = ${subscription.id},
        subscription_status = ${status},
        subscription_current_period_end = ${periodEnd}
    WHERE stripe_customer_id = ${customerId}
  `;
}

/**
 * On hard cancel / customer deletion, drop everyone matching the customer
 * back to free.
 */
export async function downgradeByCustomer(customerId: string): Promise<void> {
  await sql`
    UPDATE candidates
    SET tier = 'free',
        subscription_status = 'canceled',
        stripe_subscription_id = NULL,
        subscription_current_period_end = NULL
    WHERE stripe_customer_id = ${customerId}
  `;
}
