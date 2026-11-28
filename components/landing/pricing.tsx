"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      priceMonthly: 149,
      description: "Core AI support for growing websites.",
      features: [
        "Up to 1,000 conversations / month",
        "10 knowledge sources (URL, PDF, text)",
        "2 team members",
        "3 support sections",
        "Embeddable chat widget + AI Q&A",
      ],
      ctaText: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      priceMonthly: 549,
      description:
        "For scaling teams requiring human handoff and custom guardrails.",
      features: [
        "Up to 5,000 conversations / month",
        "50 knowledge sources",
        "10 team members",
        "20 support sections",
        "Real-time operator inbox & sound alerts",
        "Custom widget branding & themes",
      ],
      ctaText: "Choose Pro",
      highlighted: true,
    },
    {
      name: "Enterprise",
      priceMonthly: 949,
      description:
        "Unlimited scale for high-volume customer support teams.",
      features: [
        "Unlimited conversations",
        "Unlimited knowledge sources",
        "Unlimited team members",
        "Unlimited support sections",
        "Custom AI routing & priority support",
      ],
      ctaText: "Choose Enterprise",
      highlighted: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="py-20 md:py-28 px-6 border-b border-zinc-800 bg-[#09090b]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
            Pricing
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Simple, Transparent Plans
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Straightforward monthly pricing built for production customer
            support teams.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg p-6 flex flex-col justify-between ${
                plan.highlighted
                  ? "border-2 border-emerald-500/70 bg-zinc-900/80 shadow-md"
                  : "border border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h3>
                  {plan.highlighted && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-emerald-500 text-zinc-950 font-semibold">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 min-h-[36px] mb-6">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-8 pt-4 border-t border-zinc-800">
                  {plan.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2.5 text-xs text-zinc-300"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/sign-up" className="w-full">
                <Button
                  className={`w-full h-10 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    plan.highlighted
                      ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
                      : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {plan.ctaText}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
