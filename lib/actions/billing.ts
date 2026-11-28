"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import { subscription, type Subscription } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import type { ActionResult } from "@/lib/actions/knowledge";

export type PlanId = "starter" | "pro" | "enterprise";

const VALID_PLANS = new Set<PlanId>(["starter", "pro", "enterprise"]);

export async function getWorkspaceSubscription(
  orgId: string
): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.organizationId, orgId))
    .limit(1);
  return row ?? null;
}

export async function updateWorkspacePlan(
  plan: PlanId
): Promise<ActionResult<{ plan: PlanId }>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  if (!VALID_PLANS.has(plan)) {
    return { success: false, error: "Invalid plan selected" };
  }

  try {
    const now = new Date().toISOString();
    await db
      .insert(subscription)
      .values({
        id: crypto.randomUUID(),
        organizationId: ctx.orgId,
        plan,
        status: "active",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: subscription.organizationId,
        set: {
          plan,
          status: "active",
          updatedAt: now,
        },
      });

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard");
    return { success: true, data: { plan } };
  } catch (err) {
    console.error("Failed to update workspace plan:", err);
    return { success: false, error: "Failed to update workspace plan" };
  }
}
