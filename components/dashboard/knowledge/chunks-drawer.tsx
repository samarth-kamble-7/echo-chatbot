"use client";

import React from "react";
import { X, Loader2, Hash } from "lucide-react";
import type { KnowledgeChunk, KnowledgeSource } from "@/db/schema";

interface ChunksDrawerProps {
  isOpen: boolean;
  isLoading: boolean;
  source: KnowledgeSource | null;
  chunks: KnowledgeChunk[];
  onClose: () => void;
}

export function ChunksDrawer({
  isOpen,
  isLoading,
  source,
  chunks,
  onClose,
}: ChunksDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-lg h-full bg-[#0a0a0d] border-l border-zinc-800 flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">
              {source?.name || "Chunks"}
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {chunks.length} {chunks.length === 1 ? "chunk" : "chunks"} indexed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
          {isLoading ? (
            <div className="h-44 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 className="size-4 animate-spin text-emerald-400" />
              <span>Loading chunks...</span>
            </div>
          ) : chunks.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-zinc-500">
              No chunks stored for this source.
            </div>
          ) : (
            chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-4 space-y-2 hover:bg-zinc-900/30 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Hash className="size-3" />
                    Chunk {chunk.chunkIndex + 1}
                  </span>
                  <span className="text-zinc-500">
                    ~{chunk.tokenCount} tokens
                  </span>
                </div>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {chunk.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
