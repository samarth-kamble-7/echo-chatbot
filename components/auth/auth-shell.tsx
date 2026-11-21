import React from "react";
import Link from "next/link";
import { EchoLogo } from "@/components/landing/logo";
import { Bot, CheckCircle2, FileText, Sparkles } from "lucide-react";

interface AuthShellProps {
  mode: "sign-in" | "sign-up";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthShell = ({
  mode,
  title,
  subtitle,
  children,
}: AuthShellProps) => {
  const isSignIn = mode === "sign-in";

  return (
    <div className="w-full max-w-5xl rounded-3xl border border-zinc-800/80 bg-[#0c0c0e] shadow-2xl p-6 sm:p-8 lg:p-10 flex flex-col gap-8 transition-all">
      {/* Top Bar inside the canvas */}
      <header className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <EchoLogo className="size-6" />
          <span className="text-sm font-semibold tracking-tight text-white group-hover:text-zinc-300 transition-colors">
            Echo Support
          </span>
        </Link>

        <div className="text-xs text-zinc-400">
          {isSignIn ? (
            <span>
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-white font-medium hover:underline ml-1 cursor-pointer"
              >
                Sign up
              </Link>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-white font-medium hover:underline ml-1 cursor-pointer"
              >
                Log in
              </Link>
            </span>
          )}
        </div>
      </header>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Left Column: Auth Form */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                {subtitle}
              </p>
            </div>

            {children}
          </div>

          <div className="pt-6 border-t border-zinc-800/60 text-xs text-zinc-500 font-normal">
            &copy; 2026 Echo Support. All rights reserved.
          </div>
        </div>

        {/* Right Column: Product Showcase Panel */}
        <div className="hidden lg:flex lg:col-span-6 rounded-2xl border border-zinc-800/70 bg-[#09090b]/80 p-6 sm:p-8 flex-col justify-between relative overflow-hidden shadow-inner">
          {/* Subtle ambient background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none" />

          {/* Showcase Header */}
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-700/60 bg-zinc-900/60 text-[11px] font-medium text-zinc-300">
              <Sparkles className="size-3 text-zinc-400" />
              <span>Grounded Support Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
              The fastest way to resolve customer questions
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Connect your documentation, API guides, and knowledge base. Echo
              answers queries accurately with verifiable citations.
            </p>
          </div>

          {/* Interactive UI Mock Preview */}
          <div className="my-6 z-10 rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-xl space-y-3 text-xs">
            {/* Header of mock chat widget */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-200">
                  <Bot className="size-3.5" />
                </div>
                <span className="font-medium text-zinc-200">Echo Assistant</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live • 38ms
              </div>
            </div>

            {/* Mock User Message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg bg-zinc-800/80 px-3 py-2 text-zinc-200 text-xs">
                How do I set up webhooks to automatically re-index my docs?
              </div>
            </div>

            {/* Citation Pill */}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-md w-fit">
              <FileText className="size-3 text-zinc-400" />
              <span>docs/api/webhooks.md</span>
            </div>

            {/* Mock AI Response */}
            <div className="rounded-lg bg-zinc-900/90 border border-zinc-800/60 p-3 text-zinc-300 space-y-2">
              <p className="leading-relaxed">
                Add an endpoint listener pointing to{" "}
                <code className="text-zinc-200 bg-zinc-800/70 px-1 py-0.5 rounded font-mono text-[11px]">
                  /api/webhooks/reindex
                </code>
                . Echo automatically updates vector embeddings when documentation
                changes are committed.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="size-3" />
                <span>Verified answer with source citations</span>
              </div>
            </div>
          </div>

          {/* Showcase Footer with Pagination Indicator dots */}
          <div className="flex items-center justify-between z-10 pt-2 border-t border-zinc-800/50 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-1.5 rounded-full bg-white transition-all" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
            <span>End-to-end encrypted • Real-time sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
