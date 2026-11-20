"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export const Integrations = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"script" | "react" | "npm">("script");

  const codeSnippets = {
    script: `<!-- Echo Support Embed Script -->
<script
  src="https://cdn.echo.io/v1/widget.js"
  data-project-id="proj_829104"
  defer
></script>`,
    react: `// React / Next.js Component Embed
import { EchoWidget } from "@echo-support/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <EchoWidget projectId="proj_829104" position="bottom-right" />
    </>
  );
}`,
    npm: `// JavaScript SDK Initialization
import { initEcho } from "@echo-support/sdk";

initEcho({
  projectId: "proj_829104",
  theme: "auto",
});`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="integrations" className="py-20 md:py-28 px-6 border-b border-zinc-800 bg-[#09090b]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Description */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Integration
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Embed with One Script Tag
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Add the widget to any website or single-page application. The widget runs inside an isolated Shadow DOM so styles never conflict with your existing CSS.
            </p>

            <ul className="pt-3 space-y-2.5 text-xs text-zinc-300 font-mono">
              <li className="flex items-center gap-2">
                <span className="text-zinc-500">/</span>
                <span>Self-contained client widget</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-500">/</span>
                <span>Configurable CSS variables for brand colors</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-zinc-500">/</span>
                <span>Keyboard accessible and responsive layout</span>
              </li>
            </ul>
          </div>

          {/* Right Code Block */}
          <div className="lg:col-span-7">
            <div className="rounded-lg border border-zinc-800 bg-[#0c0c0e] overflow-hidden">
              {/* Header Tabs */}
              <div className="h-10 border-b border-zinc-800 px-3 flex items-center justify-between bg-zinc-900/60">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab("script")}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                      activeTab === "script"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setActiveTab("react")}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                      activeTab === "react"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    React
                  </button>
                  <button
                    onClick={() => setActiveTab("npm")}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
                      activeTab === "npm"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    NPM SDK
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code */}
              <div className="p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                <pre>
                  <code>{codeSnippets[activeTab]}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
