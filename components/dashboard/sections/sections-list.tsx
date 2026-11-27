"use client";

import React from "react";
import { Layers, Pencil, Trash2, Plus } from "lucide-react";
import type { SectionWithSources } from "@/lib/actions/sections";

interface SectionsListProps {
  sections: SectionWithSources[];
  busyId: string | null;
  onEdit: (section: SectionWithSources) => void;
  onDelete: (id: string) => void;
  onCreateClick: () => void;
}

export function SectionsList({
  sections,
  busyId,
  onEdit,
  onDelete,
  onCreateClick,
}: SectionsListProps) {
  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-[#09090b] py-14 px-6 flex flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-zinc-200">No sections yet</p>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Create a section to set topic tone, link knowledge sources, and define allow or block rules.
        </p>
        <button
          type="button"
          onClick={onCreateClick}
          className="mt-4 h-8 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>New section</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#09090b] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/40 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <th className="py-2.5 px-4 font-medium">Section</th>
              <th className="py-2.5 px-4 font-medium">Tone</th>
              <th className="py-2.5 px-4 font-medium">Sources</th>
              <th className="py-2.5 px-4 font-medium">Routing Rules</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70 text-xs">
            {sections.map((sec) => {
              const isBusy = busyId === sec.id;
              return (
                <tr
                  key={sec.id}
                  className="hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-7 rounded-md border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
                        <Layers className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-100 truncate max-w-[220px]">
                          {sec.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[240px]">
                          {sec.description || "-"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] font-mono text-zinc-300 capitalize">
                      {sec.tone}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-zinc-300">
                    {sec.sources.length}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400">
                        {sec.allowedTopics?.length || 0} allow
                      </span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-red-400">
                        {sec.blockedTopics?.length || 0} block
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {sec.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-medium text-emerald-400">
                        <span className="size-1.5 rounded-sm bg-emerald-400" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] font-medium text-zinc-400">
                        <span className="size-1.5 rounded-sm bg-zinc-500" />
                        Paused
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(sec)}
                        title="Edit section"
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onDelete(sec.id)}
                        title="Delete section"
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
