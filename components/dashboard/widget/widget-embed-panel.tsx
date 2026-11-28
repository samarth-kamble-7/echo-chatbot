"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, X } from "lucide-react";

interface WidgetEmbedPanelProps {
  orgId: string;
  origin: string;
  botName: string;
}

type IntegrationId =
  | "html"
  | "react"
  | "nextjs"
  | "javascript"
  | "vue"
  | "angular"
  | "svelte"
  | "astro"
  | "wordpress"
  | "shopify"
  | "laravel"
  | "django";

interface IntegrationItem {
  id: IntegrationId;
  label: string;
  category: string;
  logoSrc: string;
  note: string;
  code: string;
}

export function WidgetEmbedPanel({
  orgId,
  origin,
  botName,
}: WidgetEmbedPanelProps) {
  const [activeId, setActiveId] = useState<IntegrationId | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const scriptTag = `<script src="${origin}/widget.js" data-org-id="${orgId}" defer></script>`;

  const integrations: IntegrationItem[] = [
    {
      id: "html",
      label: "HTML",
      category: "Static",
      logoSrc: "/logo/HTML5.png",
      note: "Paste this script tag before the closing </body> tag in your index.html.",
      code: scriptTag,
    },
    {
      id: "react",
      label: "React",
      category: "Frontend",
      logoSrc: "/logo/React.png",
      note: "Mount the widget inside your root App component using useEffect.",
      code: `import { useEffect } from "react";

export function EchoWidget() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "${origin}/widget.js";
    s.setAttribute("data-org-id", "${orgId}");
    s.defer = true;
    (document.body || document.head).appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return null;
}`,
    },
    {
      id: "nextjs",
      label: "Next.js",
      category: "Full-stack",
      logoSrc: "/logo/Next.js.png",
      note: "Add next/script inside your root app/layout.tsx.",
      code: `import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${origin}/widget.js"
          data-org-id="${orgId}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`,
    },
    {
      id: "javascript",
      label: "JavaScript",
      category: "Vanilla JS",
      logoSrc: "/logo/JavaScript.png",
      note: "Drop this self-invoking snippet into any JavaScript file.",
      code: `(function () {
  var s = document.createElement("script");
  s.src = "${origin}/widget.js";
  s.setAttribute("data-org-id", "${orgId}");
  s.defer = true;
  (document.body || document.head).appendChild(s);
})();`,
    },
    {
      id: "vue",
      label: "Vue / Nuxt",
      category: "Frontend",
      logoSrc: "/logo/Vue.js.png",
      note: "Load the widget inside onMounted in App.vue (or add the script tag in index.html).",
      code: `<script setup>
import { onMounted } from "vue";

onMounted(() => {
  const s = document.createElement("script");
  s.src = "${origin}/widget.js";
  s.setAttribute("data-org-id", "${orgId}");
  s.defer = true;
  document.body.appendChild(s);
});
</script>`,
    },
    {
      id: "angular",
      label: "Angular",
      category: "Frontend",
      logoSrc: "/logo/Angular.png",
      note: "Add the script tag before </body> in your src/index.html.",
      code: scriptTag,
    },
    {
      id: "svelte",
      label: "SvelteKit",
      category: "Full-stack",
      logoSrc: "/logo/Svelte.png",
      note: "Add this inside src/app.html before %sveltekit.body% or </body>.",
      code: scriptTag,
    },
    {
      id: "astro",
      label: "Astro",
      category: "Static / SSR",
      logoSrc: "/logo/Astro.png",
      note: "Place this inside your BaseLayout.astro with is:inline.",
      code: `<script is:inline src="${origin}/widget.js" data-org-id="${orgId}" defer></script>`,
    },
    {
      id: "wordpress",
      label: "WordPress",
      category: "CMS",
      logoSrc: "/logo/WordPress.png",
      note: "Add this to your theme's footer.php (before </body>) or via WPCode.",
      code: scriptTag,
    },
    {
      id: "shopify",
      label: "Shopify",
      category: "E-commerce",
      logoSrc: "/logo/Shopify.png",
      note: "Paste this before </body> in Online Store → Themes → Edit code → theme.liquid.",
      code: scriptTag,
    },
    {
      id: "laravel",
      label: "Laravel",
      category: "PHP",
      logoSrc: "/logo/Laravel.png",
      note: "Paste this before </body> in resources/views/layouts/app.blade.php.",
      code: scriptTag,
    },
    {
      id: "django",
      label: "Django",
      category: "Python",
      logoSrc: "/logo/Django.png",
      note: "Paste this before </body> in your base.html template.",
      code: scriptTag,
    },
  ];

  const activeIntegration =
    integrations.find((item) => item.id === activeId) || null;

  const handleCopy = async (text: string, target: "id" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      if (target === "id") {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 1800);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1800);
      }
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
          Setup &amp; Integrations
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Choose the integration that&apos;s right for{" "}
          <span className="text-zinc-200 font-medium">{botName}</span>.
        </p>
      </div>

      {/* Organization ID Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-6 border-b border-zinc-800/80">
        <label className="text-xs font-medium text-zinc-300 sm:w-32 shrink-0">
          Organization ID
        </label>
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={orgId}
            className="flex-1 h-9 px-3 rounded-md border border-zinc-800 bg-[#09090b] text-xs font-mono text-zinc-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleCopy(orgId, "id")}
            className="h-9 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            {copiedId ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copiedId ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Integrations</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Click any framework to get the embed snippet for your website.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {integrations.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCopiedCode(false);
                setActiveId(item.id);
              }}
              className="p-4 rounded-xl border border-zinc-800 bg-[#09090b] hover:border-emerald-500/50 hover:bg-zinc-900/60 text-left flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <span className="size-9 rounded-lg border border-zinc-800 bg-zinc-900/70 inline-flex items-center justify-center shrink-0">
                <Image
                  src={item.logoSrc}
                  alt={item.label}
                  width={22}
                  height={22}
                  className={`size-5.5 object-contain ${
                    item.id === "nextjs" ? "invert" : ""
                  }`}
                />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                  {item.label}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  {item.category}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Embed Code Modal Dialog */}
      {activeIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setActiveId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-xl rounded-xl border border-zinc-800 bg-[#09090b] shadow-2xl overflow-hidden"
          >
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="size-9 rounded-lg border border-zinc-800 bg-zinc-900 inline-flex items-center justify-center shrink-0">
                  <Image
                    src={activeIntegration.logoSrc}
                    alt={activeIntegration.label}
                    width={22}
                    height={22}
                    className={`size-5.5 object-contain ${
                      activeIntegration.id === "nextjs" ? "invert" : ""
                    }`}
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Integrate with your website
                  </h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    Follow these steps to add the chatbox to your{" "}
                    {activeIntegration.label} site
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                aria-label="Close dialog"
                className="h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 inline-flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 space-y-5">
              {/* Step 1 */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="text-xs font-medium text-zinc-200">
                    Copy the following code
                  </span>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-[#050509] overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-400">
                      {activeIntegration.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeIntegration.code, "code")}
                      aria-label="Copy code"
                      className="h-7 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-[11px] font-medium text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedCode ? (
                        <Check className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <pre className="p-4 text-[11.5px] leading-relaxed font-mono text-emerald-300 overflow-x-auto max-h-64">
                    <code>{activeIntegration.code}</code>
                  </pre>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="text-xs font-medium text-zinc-200">
                    Add the code in your page
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-7">
                  {activeIntegration.note}
                </p>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-800 bg-[#050509] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="h-8 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
