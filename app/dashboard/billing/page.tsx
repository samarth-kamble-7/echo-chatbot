import React from "react";
import { eq, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { chatSession, knowledgeSource, section, subscription } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import { isStripeConfigured } from "@/lib/stripe";
import { BillingPanel } from "@/components/dashboard/billing/billing-panel";
import type { PlanId } from "@/lib/actions/billing";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string }>;
}) {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return null;
  }

  const client = await clerkClient();

  const [
    resolvedParams,
    org,
    membershipsRes,
    subRows,
    sessCountRows,
    sources,
    secCountRows,
  ] = await Promise.all([
    searchParams ?? Promise.resolve({} as { checkout?: string }),
    client.organizations.getOrganization({ organizationId: ctx.orgId }),
    client.organizations.getOrganizationMembershipList({
      organizationId: ctx.orgId,
      limit: 50,
    }),
    db
      .select()
      .from(subscription)
      .where(eq(subscription.organizationId, ctx.orgId))
      .limit(1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatSession)
      .where(eq(chatSession.organizationId, ctx.orgId)),
    db
      .select({ chunkCount: knowledgeSource.chunkCount })
      .from(knowledgeSource)
      .where(eq(knowledgeSource.organizationId, ctx.orgId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(section)
      .where(eq(section.organizationId, ctx.orgId)),
  ]);

  const sub = subRows[0];
  const isActive =
    sub && (sub.status === "active" || sub.status === "trialing");
  const initialPlan: PlanId | null =
    isActive &&
    (sub.plan === "starter" || sub.plan === "pro" || sub.plan === "enterprise")
      ? sub.plan
      : null;

  const indexedChunks = sources.reduce(
    (sum, s) => sum + (s.chunkCount || 0),
    0
  );

  return (
    <BillingPanel
      orgName={org.name}
      initialPlan={initialPlan}
      subscriptionStatus={isActive ? sub.status : null}
      stripeConfigured={isStripeConfigured()}
      hasStripeCustomer={Boolean(sub?.stripeCustomerId)}
      checkoutStatus={resolvedParams?.checkout || null}
      usage={{
        conversations: sessCountRows[0]?.count || 0,
        knowledgeSources: sources.length,
        indexedChunks,
        sections: secCountRows[0]?.count || 0,
        members: membershipsRes.data?.length || 1,
      }}
    />
  );
}
