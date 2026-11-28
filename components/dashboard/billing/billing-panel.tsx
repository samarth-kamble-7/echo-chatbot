"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  CreditCard,
  Loader2,
  Sparkles,
  MessageSquare,
  Library,
  Users,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import type { PlanId } from "@/lib/actions/billing";

interface UsageStats {
  conversations: number;
  knowledgeSources: number;
  indexedChunks: number;
  sections: number;
  members: number;
}

interface BillingPanelProps {
  orgName: string;
  initialPlan: PlanId | null;
  subscriptionStatus: string | null;
  stripeConfigured: boolean;
  hasStripeCustomer: boolean;
  checkoutStatus: string | null;
  usage: UsageStats;
}

interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  limits: {
    conversations: number | null;
    sources: number | null;
    members: number | null;
    sections: number | null;
  };
  features: string[];
}

const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Core AI support for growing websites.",
    monthlyPrice: 149,
    limits: {
      conversations: 1000,
      sources: 10,
      members: 2,
      sections: 3,
    },
    features: [
      "Up to 1,000 conversations / month",
      "10 knowledge sources (URL, PDF, text)",
      "2 team members",
      "3 support sections",
      "Embeddable chat widget + AI Q&A",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For teams with human handoff & custom rules.",
    monthlyPrice: 549,
    limits: {
      conversations: 5000,
      sources: 50,
      members: 10,
      sections: 20,
    },
    features: [
      "Up to 5,000 conversations / month",
      "50 knowledge sources",
      "10 team members",
      "20 support sections",
      "Real-time operator inbox & sound alerts",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Unlimited scale for high-volume support teams.",
    monthlyPrice: 949,
    limits: {
      conversations: null,
      sources: null,
      members: null,
      sections: null,
    },
    features: [
      "Unlimited conversations",
      "Unlimited knowledge sources",
      "Unlimited team members",
      "Unlimited support sections",
      "Custom AI routing & priority support",
    ],
  },
];

function UsageBar({
  label,
  used,
  limit,
  icon,
}: {
  label: string;
  used: number;
  limit: number | null;
  icon: React.ReactNode;
}) {
  const pct =
    limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#050509] p-4 space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 text-zinc-300 font-medium">
          {icon}
          <span>{label}</span>
        </span>
        <span className="font-mono text-zinc-400">
          {used} / {limit === null ? "Unlimited" : limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            limit !== null && pct >= 90 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: limit === null ? "15%" : `${Math.max(4, pct)}%` }}
        />
      </div>
    </div>
  );
}

export function BillingPanel({
  orgName,
  initialPlan,
  subscriptionStatus,
  stripeConfigured,
  hasStripeCustomer,
  checkoutStatus,
  usage,
}: BillingPanelProps) {
  const [updatingPlan, setUpdatingPlan] = useState<PlanId | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(() => {
    if (checkoutStatus === "success") {
      return {
        type: "ok",
        text: "Payment completed! Your subscription is active.",
      };
    }
    if (checkoutStatus === "canceled") {
      return {
        type: "err",
        text: "Checkout was canceled. No changes were made.",
      };
    }
    return null;
  });

  useEffect(() => {
    if (checkoutStatus) {
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, [checkoutStatus]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const activeConfig = initialPlan
    ? PLANS.find((p) => p.id === initialPlan) || null
    : null;

  const handleOpenPortal = async () => {
    if (openingPortal) return;
    setOpeningPortal(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setFeedback({
          type: "err",
          text: data.error || "Unable to open Stripe billing portal.",
        });
        return;
      }
      window.location.assign(data.url);
    } catch {
      setFeedback({
        type: "err",
        text: "Failed to connect to Stripe billing portal.",
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === initialPlan || updatingPlan) return;
    setUpdatingPlan(planId);
    setFeedback(null);

    if (!stripeConfigured) {
      setUpdatingPlan(null);
      setFeedback({
        type: "err",
        text: "Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env to test Stripe Checkout.",
      });
      return;
    }

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setFeedback({
          type: "err",
          text: data.error || "Could not start Stripe Checkout.",
        });
        setUpdatingPlan(null);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setFeedback({
        type: "err",
        text: "Failed to start Stripe Checkout.",
      });
      setUpdatingPlan(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Billing &amp; Plans
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage subscription plan and live resource usage for{" "}
            <span className="text-zinc-200 font-medium">{orgName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {hasStripeCustomer && stripeConfigured && (
            <button
              type="button"
              disabled={openingPortal}
              onClick={handleOpenPortal}
              className="h-9 px-3.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {openingPortal ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ExternalLink className="size-3.5 text-zinc-400" />
              )}
              <span>Manage Billing</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Plan Summary & Live Usage */}
      <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <span className="size-10 rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 inline-flex items-center justify-center shrink-0">
              <CreditCard className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {activeConfig
                    ? `${activeConfig.name} Plan`
                    : "No Active Subscription"}
                </h2>
                {activeConfig ? (
                  <span className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium capitalize">
                    {subscriptionStatus || "Active"}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                    Choose a plan below
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeConfig
                  ? activeConfig.description
                  : "Subscribe to a paid plan to unlock full workspace access."}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xl font-semibold text-zinc-100 tabular-nums">
              ${activeConfig ? activeConfig.monthlyPrice : 0}
              <span className="text-xs font-normal text-zinc-500"> / mo</span>
            </div>
            <div className="text-[11px] text-zinc-500">
              {usage.indexedChunks} indexed knowledge chunks
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <UsageBar
            label="Conversations"
            used={usage.conversations}
            limit={activeConfig?.limits.conversations ?? 0}
            icon={<MessageSquare className="size-3.5 text-emerald-400" />}
          />
          <UsageBar
            label="Knowledge Sources"
            used={usage.knowledgeSources}
            limit={activeConfig?.limits.sources ?? 0}
            icon={<Library className="size-3.5 text-emerald-400" />}
          />
          <UsageBar
            label="Sections"
            used={usage.sections}
            limit={activeConfig?.limits.sections ?? 0}
            icon={<Layers className="size-3.5 text-emerald-400" />}
          />
          <UsageBar
            label="Team Members"
            used={usage.members}
            limit={activeConfig?.limits.members ?? 0}
            icon={<Users className="size-3.5 text-emerald-400" />}
          />
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === initialPlan;
          const isPro = plan.id === "pro";
          const price = plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 flex flex-col justify-between space-y-6 ${
                isCurrent
                  ? "border-emerald-500/60 bg-[#09090b]"
                  : "border-zinc-800 bg-[#09090b]"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {plan.name}
                  </h3>
                  {isPro && !isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                      <Sparkles className="size-2.5" />
                      Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">
                      Current
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-2xl font-semibold text-zinc-100 tabular-nums">
                    ${price}
                    <span className="text-xs font-normal text-zinc-500">
                      {" "}
                      / month
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-xs text-zinc-300"
                    >
                      <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={isCurrent || Boolean(updatingPlan)}
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full h-9 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-default ${
                  isCurrent
                    ? "border border-zinc-800 bg-zinc-900 text-zinc-400"
                    : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-60"
                }`}
              >
                {updatingPlan === plan.id && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                <span>
                  {isCurrent ? "Current Plan" : `Subscribe to ${plan.name}`}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating Toast Notification */}
      {feedback && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-50 max-w-sm w-full rounded-lg border bg-[#0c0c10] shadow-2xl p-3.5 flex items-start gap-2.5 ${
            feedback.type === "ok"
              ? "border-emerald-500/40"
              : "border-red-500/40"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0 text-xs text-zinc-200 leading-relaxed">
            {feedback.text}
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss notification"
            className="text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
