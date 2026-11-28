import React from "react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  Gem,
  Bot,
  BookOpen,
  Layers,
  Inbox,
  Users,
  Palette,
} from "lucide-react";
import { db } from "@/db/client";
import { subscription } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";

const PREMIUM_FEATURES = [
  {
    icon: Bot,
    title: "AI Customer Support",
    description: "Intelligent automated responses 24/7",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Train AI on your URLs, PDFs, and docs",
  },
  {
    icon: Layers,
    title: "Support Sections",
    description: "Custom tone and topic guardrails",
  },
  {
    icon: Inbox,
    title: "Human Escalation & Inbox",
    description: "Real-time operator handoff and alerts",
  },
  {
    icon: Users,
    title: "Team Access",
    description: "Collaborate with operators in your workspace",
  },
  {
    icon: Palette,
    title: "Widget Customization",
    description: "Customize your chat widget appearance",
  },
];

export async function SubscriptionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return <>{children}</>;
  }

  let hasActivePlan = false;
  try {
    const [sub] = await db
      .select({ status: subscription.status })
      .from(subscription)
      .where(eq(subscription.organizationId, ctx.orgId))
      .limit(1);
    hasActivePlan = Boolean(
      sub && (sub.status === "active" || sub.status === "trialing")
    );
  } catch {
    hasActivePlan = false;
  }

  if (hasActivePlan) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Blurred Preview Behind Paywall */}
      <div
        aria-hidden="true"
        className="blur-sm opacity-35 pointer-events-none select-none overflow-hidden max-h-[calc(100vh-8rem)]"
      >
        {children}
      </div>

      {/* Centered Premium Feature Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#09090b] shadow-2xl p-6 sm:p-7 space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto size-11 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Gem className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Premium Feature
            </h2>
            <p className="text-xs text-zinc-400">
              This feature requires an active subscription
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {PREMIUM_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="flex items-start gap-3">
                  <span className="size-8 rounded-lg border border-zinc-800 bg-[#050509] text-zinc-300 inline-flex items-center justify-center shrink-0">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-100">
                      {feat.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {feat.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/dashboard/billing"
            className="w-full h-10 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center justify-center transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
