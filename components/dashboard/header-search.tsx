"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Inbox,
  Library,
  Layers,
  LayoutDashboard,
  Palette,
  Settings,
  Loader2,
} from "lucide-react";

interface SearchResults {
  conversations: Array<{
    id: string;
    visitorName: string;
    visitorEmail: string;
    status: string;
  }>;
  knowledge: Array<{
    id: string;
    title: string;
    sourceType: string;
  }>;
  sections: Array<{
    id: string;
    name: string;
    tone: string;
  }>;
}

const NAV_PAGES = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Conversion", href: "/dashboard/conversion", icon: Inbox },
  { title: "Knowledge", href: "/dashboard/knowledge", icon: Library },
  { title: "Sections", href: "/dashboard/sections", icon: Layers },
  { title: "Chatbot", href: "/dashboard/chatbot", icon: Palette },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function HeaderSearch() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    conversations: [],
    knowledge: [],
    sections: [],
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileOpen) {
      mobileInputRef.current?.focus();
    }
  }, [mobileOpen]);

  // Bind Cmd+K / Ctrl+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setMobileOpen(true);
        } else {
          setDesktopOpen(true);
          desktopInputRef.current?.focus();
        }
      } else if (e.key === "Escape") {
        setDesktopOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDesktopOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = (await res.json()) as SearchResults;
          setResults(data);
        }
      } catch {
        // ignore transient search errors
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const activeResults: SearchResults = query.trim()
    ? results
    : { conversations: [], knowledge: [], sections: [] };
  const isSearching = Boolean(query.trim()) && loading;

  const matchingPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_PAGES;
    return NAV_PAGES.filter((p) => p.title.toLowerCase().includes(q));
  }, [query]);

  const navigateTo = (href: string) => {
    setDesktopOpen(false);
    setMobileOpen(false);
    setQuery("");
    router.push(href);
  };

  const renderDropdown = () => {
    const hasResults =
      matchingPages.length > 0 ||
      activeResults.conversations.length > 0 ||
      activeResults.knowledge.length > 0 ||
      activeResults.sections.length > 0;

    return (
      <div className="absolute top-[calc(100%+6px)] right-0 w-full sm:w-80 rounded-lg border border-zinc-800 bg-[#0c0c10] shadow-2xl overflow-hidden z-40 max-h-96 overflow-y-auto">
        {isSearching && (
          <div className="px-3 py-2 flex items-center gap-2 text-[11px] text-zinc-400 border-b border-zinc-800/70">
            <Loader2 className="size-3 animate-spin text-emerald-400" />
            <span>Searching...</span>
          </div>
        )}

        {!hasResults && !isSearching ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            No matching results found.
          </div>
        ) : (
          <div className="p-1.5 space-y-2">
            {activeResults.conversations.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Conversations
                </div>
                {activeResults.conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigateTo("/dashboard/conversion")}
                    className="w-full px-2.5 py-1.5 rounded text-left text-xs text-zinc-200 hover:bg-zinc-800/70 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Inbox className="size-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{c.visitorName}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 capitalize shrink-0">
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeResults.knowledge.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Knowledge
                </div>
                {activeResults.knowledge.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => navigateTo("/dashboard/knowledge")}
                    className="w-full px-2.5 py-1.5 rounded text-left text-xs text-zinc-200 hover:bg-zinc-800/70 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Library className="size-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{k.title}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase shrink-0">
                      {k.sourceType}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeResults.sections.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Sections
                </div>
                {activeResults.sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigateTo("/dashboard/sections")}
                    className="w-full px-2.5 py-1.5 rounded text-left text-xs text-zinc-200 hover:bg-zinc-800/70 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Layers className="size-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 capitalize shrink-0">
                      {s.tone}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {matchingPages.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Pages
                </div>
                {matchingPages.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.href}
                      type="button"
                      onClick={() => navigateTo(p.href)}
                      className="w-full px-2.5 py-1.5 rounded text-left text-xs text-zinc-300 hover:bg-zinc-800/70 flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="size-3.5 text-zinc-400 shrink-0" />
                      <span>{p.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Desktop / Tablet Search Input */}
      <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
        <Search className="size-3.5 text-zinc-500" />
        <input
          ref={desktopInputRef}
          type="text"
          value={query}
          onFocus={() => setDesktopOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setDesktopOpen(true);
          }}
          placeholder="Search docs, bots, chats..."
          className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-500 w-52 md:w-60"
        />
        <kbd className="font-mono text-[10px] text-zinc-500 border border-zinc-700/60 rounded px-1">
          ⌘K
        </kbd>
      </div>

      {desktopOpen && (
        <div className="hidden sm:block">{renderDropdown()}</div>
      )}

      {/* Mobile Search Icon Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open search"
        className="sm:hidden h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 inline-flex items-center justify-center transition-colors cursor-pointer"
      >
        <Search className="size-4" />
      </button>

      {/* Mobile Expanded Search Bar */}
      {mobileOpen && (
        <div className="sm:hidden fixed top-0 inset-x-0 h-14 px-4 bg-[#09090b] border-b border-zinc-800 z-30 flex items-center gap-2">
          <div className="relative flex-1 flex items-center gap-2 h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900/80 text-xs">
            <Search className="size-3.5 text-zinc-500 shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs, bots, chats..."
              className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-500 w-full"
            />
            {renderDropdown()}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close search"
            className="h-9 w-9 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
