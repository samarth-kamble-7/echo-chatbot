import Stripe from "stripe";
import type { PlanId } from "@/lib/actions/billing";

let stripeInstance: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export function getConfiguredPriceId(plan: PlanId): string | null {
  const map: Record<PlanId, string | undefined> = {
    starter:
      process.env.STRIPE_STARTER_PRICE_ID ||
      process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    pro:
      process.env.STRIPE_PRO_PRICE_ID ||
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    enterprise:
      process.env.STRIPE_ENTERPRISE_PRICE_ID ||
      process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
  };
  const val = map[plan]?.trim();
  return val || null;
}

export function getInlinePlanUnitAmount(plan: PlanId): number {
  if (plan === "starter") return 14900; // $149/mo
  if (plan === "pro") return 54900; // $549/mo
  return 94900; // $949/mo
}
