import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import {
  getConfiguredPriceId,
  getInlinePlanUnitAmount,
  getStripe,
} from "@/lib/stripe";
import type { PlanId } from "@/lib/actions/billing";

export async function POST(req: Request) {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured yet. Add STRIPE_SECRET_KEY to your .env file.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as {
      plan?: PlanId;
    };
    const plan = body.plan;

    if (plan !== "starter" && plan !== "pro" && plan !== "enterprise") {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const [existingSub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.organizationId, ctx.orgId))
      .limit(1);

    let customerId = existingSub?.stripeCustomerId || null;

    if (!customerId) {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({
        organizationId: ctx.orgId,
      });
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: {
          organizationId: ctx.orgId,
        },
      });
      customerId = customer.id;

      const now = new Date().toISOString();
      await db
        .insert(subscription)
        .values({
          id: crypto.randomUUID(),
          organizationId: ctx.orgId,
          stripeCustomerId: customerId,
          plan: "starter",
          status: "inactive",
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: subscription.organizationId,
          set: {
            stripeCustomerId: customerId,
            updatedAt: now,
          },
        });
    }

    const reqUrl = new URL(req.url);
    const origin = req.headers.get("origin") || reqUrl.origin;

    const planLabel =
      plan === "starter"
        ? "Starter"
        : plan === "pro"
        ? "Pro"
        : "Enterprise";
    const configuredPriceId = getConfiguredPriceId(plan);
    const lineItem = configuredPriceId
      ? { price: configuredPriceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Echo Support ${planLabel} (Monthly)`,
            },
            unit_amount: getInlinePlanUnitAmount(plan),
            recurring: {
              interval: "month" as const,
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [lineItem],
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard/billing?checkout=success`,
      cancel_url: `${origin}/dashboard/billing?checkout=canceled`,
      metadata: {
        organizationId: ctx.orgId,
        plan,
      },
      subscription_data: {
        metadata: {
          organizationId: ctx.orgId,
          plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create Stripe checkout session",
      },
      { status: 500 }
    );
  }
}
