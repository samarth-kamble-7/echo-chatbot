"use client";

import React from "react";
import {
  Globe,
  FileUp,
  FileText,
  RefreshCw,
  Trash2,
  Eye,
  Plus,
  BookOpen,
} from "lucide-react";
import type { KnowledgeSource } from "@/db/schema";

interface KnowledgeTableProps {
  sources: KnowledgeSource[];
  busyId: string | null;
  onViewChunks: (source: KnowledgeSource) => void;
  onResync: (id: string) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

function getTypeStyle(type: string) {
  if (type === "url") {
    return {
      Icon: Globe,
      iconClass: "text-emerald-400",
      boxClass: "bg-emerald-500/10 border-emerald-500/20",
    };
  }
  if (type === "file") {
    return {
      Icon: FileUp,
      iconClass: "text-sky-400",
      boxClass: "bg-sky-500/10 border-sky-500/20",
    };
  }
  return {
    Icon: FileText,
    iconClass: "text-amber-400",
    boxClass: "bg-amber-500/10 border-amber-500/20",
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function KnowledgeTable({
  sources,
  busyId,
  onViewChunks,
  onResync,
  onDelete,
  onAddClick,
}: KnowledgeTableProps) {
  if (sources.length === 0) {
    return (
      <div className="relative rounded-xl border border-zinc-800/80 bg-[#09090b] py-16 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-24 w-64 bg-emerald-500/10 blur-3xl" />
        <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
          <BookOpen className="size-4" />
        </div>
        <p className="text-sm font-medium text-zinc-100">
          Your knowledge base is empty
        </p>
        <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
          Connect a documentation URL, upload Markdown or text files, or paste
          raw FAQs to ground your chatbot.
        </p>
        <button
          type="button"
          onClick={onAddClick}
          className="mt-5 h-8 px-3.5 rounded-lg border border-zinc-700/80 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="size-3.5 text-emerald-400" />
          <span>Add your first source</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#09090b] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800/80 bg-zinc-900/30 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <th className="py-2.5 px-4 font-medium">Source</th>
              <th className="py-2.5 px-4 font-medium">Type</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 font-medium">Chunks</th>
              <th className="py-2.5 px-4 font-medium">Last Synced</th>
              <th className="py-2.5 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-xs">
            {sources.map((src) => {
              const { Icon, iconClass, boxClass } = getTypeStyle(src.type);
              const isBusy = busyId === src.id;

              return (
                <tr
                  key={src.id}
                  className="group hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-8 rounded-lg border flex items-center justify-center shrink-0 ${boxClass}`}
                      >
                        <Icon className={`size-3.5 ${iconClass}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-100 truncate max-w-[240px] sm:max-w-xs">
                          {src.name}
                        </div>
                        {src.sourceUrl &&
                          (src.sourceUrl.startsWith("http://") ||
                          src.sourceUrl.startsWith("https://") ? (
                            <a
                              href={src.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-[11px] text-zinc-500 hover:text-zinc-300 truncate max-w-[240px] sm:max-w-xs transition-colors"
                            >
                              {src.sourceUrl}
                            </a>
                          ) : (
                            <div className="text-[11px] text-zinc-500 truncate max-w-[240px] sm:max-w-xs">
                              {src.sourceUrl}
                            </div>
                          ))}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-medium text-zinc-300 uppercase">
                      {src.type}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {src.status === "ready" ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        Ready
                      </span>
                    ) : src.status === "error" ? (
                      <span
                        title={src.errorMessage || "Sync failed"}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] font-medium text-red-400"
                      >
                        <span className="size-1.5 rounded-full bg-red-400" />
                        Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-400">
                        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Indexing
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-zinc-300">
                    {src.chunkCount}
                  </td>

                  <td
                    className="py-3 px-4 text-zinc-400 whitespace-nowrap"
                    suppressHydrationWarning
                  >
                    {formatDate(src.lastSyncedAt)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewChunks(src)}
                        title="Preview chunks"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Eye className="size-3.5" />
                      </button>

                      {src.type === "url" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onResync(src.id)}
                          title="Re-sync URL"
                          className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <RefreshCw
                            className={`size-3.5 ${
                              isBusy ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onDelete(src.id)}
                        title="Delete source"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
