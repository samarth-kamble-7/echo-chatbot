"use client";

import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { KnowledgeChunk, KnowledgeSource } from "@/db/schema";
import {
  deleteKnowledgeSource,
  getKnowledgeSourceWithChunks,
  resyncKnowledgeSource,
} from "@/lib/actions/knowledge";
import { AddSourceModal } from "./add-source-modal";
import { KnowledgeTable } from "./knowledge-table";
import { ChunksDrawer } from "./chunks-drawer";

interface KnowledgeClientProps {
  initialSources: KnowledgeSource[];
}

export function KnowledgeClient({ initialSources }: KnowledgeClientProps) {
  const [sources, setSources] = useState<KnowledgeSource[]>(initialSources);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "url" | "file" | "text">(
    "all",
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(
    null,
  );
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);

  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const matchesType = typeFilter === "all" || s.type === typeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.sourceUrl && s.sourceUrl.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [sources, typeFilter, searchQuery]);

  const totalChunks = useMemo(
    () => sources.reduce((sum, s) => sum + (s.chunkCount || 0), 0),
    [sources],
  );

  const handleCreated = (newSource: KnowledgeSource) => {
    setSources((prev) => [newSource, ...prev]);
  };

  const handleViewChunks = async (source: KnowledgeSource) => {
    setSelectedSource(source);
    setChunks([]);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setActionError(null);

    const res = await getKnowledgeSourceWithChunks(source.id);
    setDrawerLoading(false);

    if (!res.success) {
      setActionError(res.error);
      return;
    }

    setChunks(res.data.chunks);
  };

  const handleResync = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    const res = await resyncKnowledgeSource(id);
    setBusyId(null);

    if (!res.success) {
      setActionError(res.error);
      return;
    }

    setSources((prev) => prev.map((s) => (s.id === id ? res.data : s)));
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    const res = await deleteKnowledgeSource(id);
    setBusyId(null);

    if (!res.success) {
      setActionError(res.error);
      return;
    }

    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Knowledge
            </h1>
            <span className="px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-[11px] font-mono text-zinc-400">
              {sources.length} {sources.length === 1 ? "source" : "sources"} ·{" "}
              {totalChunks} chunks
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Documentation URLs, uploaded files, and text snippets used to ground
            AI responses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="h-8 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 shadow-[0_0_20px_-5px_rgba(16,185,129,0.45)] transition-all cursor-pointer shrink-0 w-fit"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>Add source</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#09090b] border border-zinc-800/80 w-fit">
          {(["all", "url", "file", "text"] as const).map((tab) => {
            const active = typeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTypeFilter(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
                  active
                    ? "bg-zinc-800/90 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-zinc-800/80 bg-[#09090b] focus-within:border-zinc-600 transition-colors text-xs">
          <Search className="size-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-500 w-44 sm:w-56"
          />
        </div>
      </div>

      {actionError && (
        <div className="px-3.5 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
          {actionError}
        </div>
      )}

      {/* Sources Table */}
      <KnowledgeTable
        sources={filteredSources}
        busyId={busyId}
        onViewChunks={handleViewChunks}
        onResync={handleResync}
        onDelete={handleDelete}
        onAddClick={() => setIsAddOpen(true)}
      />

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={handleCreated}
      />

      {/* Chunks Preview Drawer */}
      <ChunksDrawer
        isOpen={drawerOpen}
        isLoading={drawerLoading}
        source={selectedSource}
        chunks={chunks}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
