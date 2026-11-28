import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";
import type { PlanId } from "@/lib/actions/billing";

export interface PlanLimits {
  conversations: number | null;
  sources: number | null;
  members: number | null;
  sections: number | null;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  starter: {
    conversations: 1000,
    sources: 10,
    members: 2,
    sections: 3,
  },
  pro: {
    conversations: 5000,
    sources: 50,
    members: 10,
    sections: 20,
  },
  enterprise: {
    conversations: null,
    sources: null,
    members: null,
    sections: null,
  },
};

export async function getOrgPlanAndLimits(orgId: string): Promise<{
  isActive: boolean;
  plan: PlanId | null;
  label: string;
  limits: PlanLimits;
}> {
  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.organizationId, orgId))
    .limit(1);

  const isActive = Boolean(
    sub && (sub.status === "active" || sub.status === "trialing")
  );
  const plan: PlanId | null =
    isActive &&
    (sub?.plan === "starter" ||
      sub?.plan === "pro" ||
      sub?.plan === "enterprise")
      ? sub.plan
      : null;

  if (!plan) {
    return {
      isActive: false,
      plan: null,
      label: "No Active Plan",
      limits: { conversations: 0, sources: 0, members: 1, sections: 0 },
    };
  }

  const label =
    plan === "starter"
      ? "Starter Plan"
      : plan === "pro"
      ? "Pro Plan"
      : "Enterprise Plan";

  return {
    isActive: true,
    plan,
    label,
    limits: PLAN_LIMITS[plan],
  };
}
