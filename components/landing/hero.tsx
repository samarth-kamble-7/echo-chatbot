"use client";

import Link from "next/link";
import { Bot, User, CheckCircle, FileText, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 px-6 border-b border-zinc-800">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Release Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-zinc-800 bg-zinc-900/80 mb-6 text-xs text-zinc-400 font-mono">
          <span>Echo Support</span>
          <span className="text-zinc-600">|</span>
          <span>Documentation Indexing &amp; Live Chat Widget</span>
        </div>

        {/* Clear, Concrete Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          AI Customer Support Grounded in Your Documentation
        </h1>

        {/* Concise, Direct Subtitle */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Index your Markdown docs, Notion databases, and API references. Echo
          generates accurate responses based solely on your certified content,
          with automatic fallback to human agents.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
          <Link href="#pricing" className="w-full sm:w-auto cursor-pointer">
            <Button className="w-full sm:w-auto h-11 px-7 text-sm font-medium rounded-md bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer">
              Start for free
            </Button>
          </Link>

          <a href="#demo" className="w-full sm:w-auto cursor-pointer">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 px-7 text-sm font-medium rounded-md border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              View demo
            </Button>
          </a>
        </div>
      </div>

      {/* Visual Placeholder for Chat Interface Simulation */}
      <div id="demo" className="max-w-3xl mx-auto">
        <div className="rounded-lg border border-zinc-800 bg-[#0c0c0e] shadow-xl overflow-hidden">
          {/* Header Bar */}
          <div className="h-10 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-900/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="text-zinc-600 mx-1">/</span>
              <span className="text-zinc-300 font-mono">
                support.acme.dev (Preview)
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Guardrails active</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-6 space-y-4 text-xs">
            {/* User message */}
            <div className="flex items-start gap-3 justify-end">
              <div className="bg-zinc-800 text-zinc-100 p-3 rounded-md max-w-md leading-relaxed">
                How do I initialize the widget with custom user metadata in
                Next.js?
              </div>
              <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-zinc-400">
                <User className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* AI Assistant message */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-950">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-md max-w-lg space-y-2.5 leading-relaxed text-zinc-200">
                <p>
                  Pass the user identity object directly inside the{" "}
                  <code>initEcho</code> call within your client layout:
                </p>
                <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                  {`initEcho({
  projectId: "proj_948a27bc",
  user: { id: "usr_102", plan: "pro" }
});`}
                </pre>
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400">
                  <FileText className="w-3 h-3 text-zinc-500" />
                  <span>Source: docs/sdk/client-initialization.md</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input Placeholder */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/30 flex items-center gap-2">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-500 flex items-center justify-between">
              <span>Ask a question about your product documentation...</span>
              <CornerDownLeft className="w-3.5 h-3.5 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
