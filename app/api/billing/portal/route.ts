import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 }
    );
  }

  try {
    const [sub] = await db
      .select({ stripeCustomerId: subscription.stripeCustomerId })
      .from(subscription)
      .where(eq(subscription.organizationId, ctx.orgId))
      .limit(1);

    if (!sub?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing customer found for this workspace yet." },
        { status: 400 }
      );
    }

    const reqUrl = new URL(req.url);
    const origin = req.headers.get("origin") || reqUrl.origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to open Stripe billing portal",
      },
      { status: 500 }
    );
  }
}
