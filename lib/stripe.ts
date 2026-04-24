import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(key ?? "sk_test_missing", {
  // Pin the API version so behavior is stable across Stripe updates.
  apiVersion: "2026-04-22.dahlia",
  appInfo: {
    name: "Job Matching",
    url: "https://jobmatching.us",
  },
});

export const STRIPE_CONFIGURED = Boolean(key);

export const PRICE_IDS = {
  proMonthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY ?? "",
  proYearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY ?? "",
};
