import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" as any })
  : null;

export const PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || "",
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
};

export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
