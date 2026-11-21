"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Pricing = () => {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      priceMonthly: 29,
      priceAnnual: 24,
      description:
        "For teams setting up their initial documentation assistant.",
      features: [
        "1,000 monthly chat sessions",
        "Up to 25 crawled documentation URLs",
        "Weekly sitemap re-indexing",
        "Standard latency queue",
        "Email support",
      ],
      ctaText: "Choose Starter",
      highlighted: false,
    },
    {
      name: "Pro",
      priceMonthly: 79,
      priceAnnual: 65,
      description:
        "For scaling products requiring custom guardrails and high volume.",
      features: [
        "10,000 monthly chat sessions",
        "Unlimited documentation URLs",
        "Continuous automated re-indexing",
        "Custom strict guardrails & boundary rules",
        "Brand tone matching profiles",
        "Human escalation & webhook forwarding",
        "Priority support",
      ],
      ctaText: "Choose Pro",
      highlighted: true,
    },
    {
      name: "Enterprise",
      priceMonthly: null,
      priceAnnual: null,
      description:
        "For organizations requiring custom deployment and compliance agreements.",
      features: [
        "Custom chat session volume",
        "Dedicated isolated inference endpoint",
        "Custom LLM fine-tuning",
        "Custom data retention policies",
        "Uptime SLA agreement",
        "Dedicated account representative",
      ],
      ctaText: "Contact Sales",
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
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
            Clear usage-based tiers with no per-agent seat licenses.
          </p>

          {/* Billing switcher */}
          <div className="inline-flex items-center gap-1 p-1 rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium">
            <button
              onClick={() => setAnnual(false)}
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                !annual
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                annual
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Annual billing (discounted)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg p-6 flex flex-col justify-between ${
                plan.highlighted
                  ? "border-2 border-zinc-400 bg-zinc-900/80 shadow-md"
                  : "border border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h3>
                  {plan.highlighted && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-zinc-200 text-zinc-950 font-semibold">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 min-h-[36px] mb-6">
                  {plan.description}
                </p>

                <div className="mb-6">
                  {plan.priceMonthly !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        ${annual ? plan.priceAnnual : plan.priceMonthly}
                      </span>
                      <span className="text-xs text-zinc-400">/ month</span>
                    </div>
                  ) : (
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      Custom
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 mb-8 pt-4 border-t border-zinc-800">
                  {plan.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2.5 text-xs text-zinc-300"
                    >
                      <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/sign-up" className="w-full">
                <Button
                  className={`w-full h-10 text-sm font-medium rounded-md transition-colors ${
                    plan.highlighted
                      ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
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
