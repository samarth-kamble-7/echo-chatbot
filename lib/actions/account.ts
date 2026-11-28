"use server";

import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { organization, subscription, user } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import { getStripe } from "@/lib/stripe";
import type { ActionResult } from "@/lib/actions/knowledge";

async function cancelOrgStripeSubscription(orgId: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  const [sub] = await db
    .select({
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      status: subscription.status,
    })
    .from(subscription)
    .where(eq(subscription.organizationId, orgId))
    .limit(1);

  if (
    sub?.stripeSubscriptionId &&
    sub.status !== "canceled" &&
    sub.status !== "inactive"
  ) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      console.warn(
        `Stripe subscription cancel warning for org ${orgId}:`,
        err
      );
    }
  }
}

export async function deleteCurrentOrganization(): Promise<
  ActionResult<{ redirectTo: string }>
> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const client = await clerkClient();

    // 1. Verify current user is an admin of this organization
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: ctx.orgId,
      limit: 50,
    });
    const currentMembership = memberships.data.find(
      (m) => m.publicUserData?.userId === ctx.userId
    );
    if (!currentMembership || currentMembership.role !== "org:admin") {
      return {
        success: false,
        error: "Only workspace admins can delete the organization.",
      };
    }

    // 2. Cancel active Stripe subscription if present
    await cancelOrgStripeSubscription(ctx.orgId);

    // 3. Delete organization from Clerk
    await client.organizations.deleteOrganization(ctx.orgId);

    // 4. Delete organization from Neon (cascades to sessions, messages, knowledge, sections, subscription)
    await db.delete(organization).where(eq(organization.id, ctx.orgId));

    // Check if user still belongs to another organization
    const remaining = await client.users.getOrganizationMembershipList({
      userId: ctx.userId,
      limit: 1,
    });
    const redirectTo =
      remaining.data.length > 0 ? "/dashboard" : "/create-organization";

    return { success: true, data: { redirectTo } };
  } catch (err) {
    console.error("Failed to delete organization:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to delete organization.",
    };
  }
}

export async function deleteCurrentUserAccount(): Promise<ActionResult<void>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const client = await clerkClient();

    // 1. For any organization where this user is the sole member, cancel Stripe & clean up org
    const userOrgs = await client.users.getOrganizationMembershipList({
      userId: ctx.userId,
      limit: 50,
    });

    for (const membership of userOrgs.data) {
      const orgId = membership.organization.id;
      const orgMembers =
        await client.organizations.getOrganizationMembershipList({
          organizationId: orgId,
          limit: 5,
        });
      if (orgMembers.data.length <= 1) {
        await cancelOrgStripeSubscription(orgId);
        await client.organizations.deleteOrganization(orgId).catch(() => {});
        await db.delete(organization).where(eq(organization.id, orgId));
      }
    }

    // 2. Delete user from Neon
    await db.delete(user).where(eq(user.id, ctx.userId));

    // 3. Delete user from Clerk
    await client.users.deleteUser(ctx.userId);

    return { success: true, data: undefined };
  } catch (err) {
    console.error("Failed to delete user account:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to delete user account.",
    };
  }
}
