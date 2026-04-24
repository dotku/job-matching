import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  downgradeByCustomer,
  syncSubscription,
} from "@/lib/billing";
import { stripe, STRIPE_CONFIGURED } from "@/lib/stripe";

type StripeEvent = ReturnType<typeof stripe.webhooks.constructEvent>;
interface CheckoutSession {
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
  customer?: string | { id: string } | null;
  subscription?: string | { id: string } | null;
}
interface SubscriptionPayload {
  id: string;
  status: string;
  customer: string | { id: string };
  metadata?: Record<string, string> | null;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!STRIPE_CONFIGURED) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not set" },
      { status: 503 },
    );
  }

  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: StripeEvent;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad signature";

    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as CheckoutSession;
        const candidateId =
          session.client_reference_id ||
          (session.metadata?.candidateId as string | undefined);
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (!customerId) break;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );

          await syncSubscription({
            candidateId: candidateId ?? undefined,
            customerId,
            subscription,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as unknown as SubscriptionPayload;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await syncSubscription({
          candidateId:
            (subscription.metadata?.candidateId as string | undefined) ??
            undefined,
          customerId,
          subscription,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as SubscriptionPayload;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await downgradeByCustomer(customerId);
        break;
      }

      default:
        // Ignore everything else; still respond 200 so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
