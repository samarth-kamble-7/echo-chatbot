"use client";

import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { KnowledgeSource } from "@/db/schema";
import {
  deleteSection,
  type SectionWithSources,
} from "@/lib/actions/sections";
import { SectionsList } from "./sections-list";
import { SectionFormModal } from "./section-form-modal";

interface SectionsClientProps {
  initialSections: SectionWithSources[];
  availableSources: KnowledgeSource[];
}

export function SectionsClient({
  initialSections,
  availableSources,
}: SectionsClientProps) {
  const [sections, setSections] = useState<SectionWithSources[]>(initialSections);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithSources | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [sections, searchQuery]);

  const handleOpenCreate = () => {
    setEditingSection(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sec: SectionWithSources) => {
    setEditingSection(sec);
    setIsModalOpen(true);
  };

  const handleSaved = (saved: SectionWithSources, isEdit: boolean) => {
    if (isEdit) {
      setSections((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    } else {
      setSections((prev) => [saved, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError(null);
    const res = await deleteSection(id);
    setBusyId(null);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
              Sections
            </h1>
            <span className="text-xs font-mono text-zinc-500">
              {sections.length} {sections.length === 1 ? "section" : "sections"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Organize chatbot topics, define assistant tone, link knowledge sources, and set allow or block rules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="h-8 px-3.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 w-fit"
        >
          <Plus className="size-3.5" />
          <span>New section</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-zinc-800 bg-[#09090b] focus-within:border-zinc-600 transition-colors text-xs">
          <Search className="size-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter sections..."
            className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-500 w-44 sm:w-56"
          />
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <SectionsList
        sections={filteredSections}
        busyId={busyId}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onCreateClick={handleOpenCreate}
      />

      {/* Modal */}
      {isModalOpen && (
        <SectionFormModal
          key={editingSection?.id || "new-section"}
          isOpen={isModalOpen}
          editingSection={editingSection}
          availableSources={availableSources}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
