import React from "react";
import { Network, ShieldCheck, Sliders, Check } from "lucide-react";

export const Features = () => {
  return (
    <section id="features" className="py-20 md:py-28 px-6 border-b border-zinc-800 bg-[#09090b]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
            Core Architecture
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Designed for Accuracy and Brand Control
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Standard LLMs invent answers when information is missing. Echo uses deterministic retrieval and explicit boundary policies so customers receive only verified facts.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Knowledge Graph */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-5">
                <Network className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Knowledge Graph
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Automated crawling parses your sitemaps, API documentation, and help articles into structured vector chunks. When source documents update, changes are re-indexed automatically.
              </p>
            </div>

            <div className="p-3 rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[11px] space-y-2 text-zinc-400">
              <div className="flex items-center justify-between text-zinc-300 pb-1 border-b border-zinc-800">
                <span>Crawler Status</span>
                <span className="text-emerald-400">Idle / Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Indexed Sources:</span>
                <span className="text-zinc-200">Docs, Notion, OpenAPI</span>
              </div>
              <div className="flex justify-between">
                <span>Update Strategy:</span>
                <span className="text-zinc-200">Webhook &amp; Scheduled Poll</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Strict Guard Rails */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Strict Guard Rails
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Enforce strict boundary prompts that restrict responses strictly to cited documents. If an answer cannot be verified from the source material, Echo triggers an escalation to human support.
              </p>
            </div>

            <div className="p-3 rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[11px] space-y-2 text-zinc-400">
              <div className="flex items-center justify-between text-zinc-300 pb-1 border-b border-zinc-800">
                <span>Boundary Rules</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Out-of-scope question rejection</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>PII and secret masking</span>
              </div>
            </div>
          </div>

          {/* Feature 3: Tone Matching */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-5">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Tone Matching
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Configure your assistant to match your brand style guidelines. Set rules for formatting, code snippet inclusion, answer length, and technical vocabulary.
              </p>
            </div>

            <div className="p-3 rounded-md border border-zinc-800 bg-zinc-950 font-mono text-[11px] space-y-2 text-zinc-400">
              <div className="flex items-center justify-between text-zinc-300 pb-1 border-b border-zinc-800">
                <span>Profile Settings</span>
                <span className="text-zinc-300">Developer Docs</span>
              </div>
              <div className="flex justify-between">
                <span>Style:</span>
                <span className="text-zinc-200">Technical, Concise</span>
              </div>
              <div className="flex justify-between">
                <span>Code blocks:</span>
                <span className="text-zinc-200">Required when relevant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
