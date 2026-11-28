import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import type Stripe from "stripe";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";
import { getConfiguredPriceId, getStripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/actions/billing";

function parsePlan(raw: string | undefined, priceId?: string): PlanId {
  if (raw === "pro" || raw === "enterprise" || raw === "starter") {
    return raw;
  }
  if (priceId) {
    if (priceId === getConfiguredPriceId("enterprise")) return "enterprise";
    if (priceId === getConfiguredPriceId("pro")) return "pro";
    if (priceId === getConfiguredPriceId("starter")) return "starter";
  }
  return "starter";
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const now = new Date().toISOString();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.organizationId;
      const plan = parsePlan(session.metadata?.plan);
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id || null;

      if (orgId) {
        await db
          .insert(subscription)
          .values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            status: "active",
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: subscription.organizationId,
            set: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              plan,
              status: "active",
              updatedAt: now,
            },
          });
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id;
      const plan = parsePlan(sub.metadata?.plan, priceId);
      const periodEndSec = sub.items.data[0]?.current_period_end;
      const currentPeriodEnd = periodEndSec
        ? new Date(periodEndSec * 1000).toISOString()
        : null;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const orgId = sub.metadata?.organizationId;

      if (orgId) {
        await db
          .insert(subscription)
          .values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId || null,
            plan,
            status: sub.status,
            currentPeriodEnd,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: subscription.organizationId,
            set: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId || null,
              plan,
              status: sub.status,
              currentPeriodEnd,
              updatedAt: now,
            },
          });
      } else {
        await db
          .update(subscription)
          .set({
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId || null,
            plan,
            status: sub.status,
            currentPeriodEnd,
            updatedAt: now,
          })
          .where(eq(subscription.stripeCustomerId, customerId));
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const orgId = sub.metadata?.organizationId;

      if (orgId) {
        await db
          .update(subscription)
          .set({
            status: "canceled",
            updatedAt: now,
          })
          .where(eq(subscription.organizationId, orgId));
      } else {
        await db
          .update(subscription)
          .set({
            status: "canceled",
            updatedAt: now,
          })
          .where(eq(subscription.stripeCustomerId, customerId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
