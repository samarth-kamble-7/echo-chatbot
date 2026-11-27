"use client";

import React, { useState } from "react";
import { X, Loader2, Plus, Check } from "lucide-react";
import type { KnowledgeSource } from "@/db/schema";
import {
  createSection,
  updateSection,
  type SectionWithSources,
} from "@/lib/actions/sections";

type FormTab = "general" | "sources" | "routing";

interface SectionFormModalProps {
  isOpen: boolean;
  editingSection: SectionWithSources | null;
  availableSources: KnowledgeSource[];
  onClose: () => void;
  onSaved: (section: SectionWithSources, isEdit: boolean) => void;
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
  { value: "technical", label: "Technical" },
] as const;

export function SectionFormModal({
  isOpen,
  editingSection,
  availableSources,
  onClose,
  onSaved,
}: SectionFormModalProps) {
  const [activeTab, setActiveTab] = useState<FormTab>("general");
  const [name, setName] = useState(editingSection?.name || "");
  const [description, setDescription] = useState(
    editingSection?.description || ""
  );
  const [tone, setTone] = useState(editingSection?.tone || "professional");
  const [instructions, setInstructions] = useState(
    editingSection?.instructions || ""
  );
  const [isActive, setIsActive] = useState(editingSection?.isActive ?? true);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    editingSection?.sourceIds || []
  );
  const [allowedTopics, setAllowedTopics] = useState<string[]>(
    editingSection?.allowedTopics || []
  );
  const [blockedTopics, setBlockedTopics] = useState<string[]>(
    editingSection?.blockedTopics || []
  );
  const [allowInput, setAllowInput] = useState("");
  const [blockInput, setBlockInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const addTopic = (kind: "allow" | "block") => {
    const raw = (kind === "allow" ? allowInput : blockInput).trim();
    if (!raw) return;

    const list = kind === "allow" ? allowedTopics : blockedTopics;
    const exists = list.some((t) => t.toLowerCase() === raw.toLowerCase());
    if (!exists) {
      if (kind === "allow") {
        setAllowedTopics([...allowedTopics, raw]);
      } else {
        setBlockedTopics([...blockedTopics, raw]);
      }
    }

    if (kind === "allow") setAllowInput("");
    else setBlockInput("");
  };

  const removeTopic = (kind: "allow" | "block", topic: string) => {
    if (kind === "allow") {
      setAllowedTopics((prev) => prev.filter((t) => t !== topic));
    } else {
      setBlockedTopics((prev) => prev.filter((t) => t !== topic));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name,
      description,
      tone,
      instructions,
      isActive,
      sourceIds: selectedSourceIds,
      allowedTopics,
      blockedTopics,
    };

    try {
      const res = editingSection
        ? await updateSection(editingSection.id, payload)
        : await createSection(payload);

      if (!res.success) {
        setError(res.error);
        return;
      }

      onSaved(res.data, Boolean(editingSection));
      onClose();
    } catch {
      setError("Failed to save section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-[#0a0a0d] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              {editingSection ? "Edit section" : "Create section"}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Configure behavior, linked knowledge sources, and routing rules.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3.5">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-zinc-900 border border-zinc-800">
            {[
              { id: "general" as const, label: "Behavior & Tone" },
              {
                id: "sources" as const,
                label: `Sources (${selectedSourceIds.length})`,
              },
              {
                id: "routing" as const,
                label: `Routing (${allowedTopics.length + blockedTopics.length})`,
              },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 px-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-300">
              {error}
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Section Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Billing & Subscriptions"
                  className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Description{" "}
                  <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Handles pricing, invoices, and plan upgrades."
                  className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Assistant Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  >
                    {TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full h-9 px-3 rounded-md border text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-800 bg-[#050509] text-zinc-400"
                    }`}
                  >
                    <span>{isActive ? "Active" : "Paused"}</span>
                    <span
                      className={`size-2 rounded-sm ${
                        isActive ? "bg-emerald-400" : "bg-zinc-600"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Behavior Instructions{" "}
                  <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Keep steps numbered, include links to billing settings, and escalate refund disputes to support."
                  className="w-full p-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === "sources" && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400">
                Select which knowledge sources belong to this section.
              </p>

              {availableSources.length === 0 ? (
                <div className="p-6 rounded-md border border-zinc-800 bg-[#050509] text-center text-xs text-zinc-500">
                  No knowledge sources indexed yet. Add sources in Knowledge first.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/70 rounded-md border border-zinc-800 bg-[#050509]">
                  {availableSources.map((src) => {
                    const checked = selectedSourceIds.includes(src.id);
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => toggleSource(src.id)}
                        className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-200 truncate">
                            {src.name}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500">
                            {src.type.toUpperCase()} ({src.chunkCount} chunks)
                          </div>
                        </div>
                        <div
                          className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                            checked
                              ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                              : "border-zinc-700 bg-zinc-900"
                          }`}
                        >
                          {checked && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "routing" && (
            <div className="space-y-4">
              {/* Allowed Topics */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Allowed Topics
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={allowInput}
                    onChange={(e) => setAllowInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTopic("allow");
                      }
                    }}
                    placeholder="e.g. invoices, plan upgrades"
                    className="flex-1 h-8 px-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => addTopic("allow")}
                    className="h-8 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {allowedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allowedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-[11px] text-emerald-400"
                      >
                        <span>{topic}</span>
                        <button
                          type="button"
                          onClick={() => removeTopic("allow", topic)}
                          className="hover:text-white cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Blocked Topics */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Blocked Topics
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={blockInput}
                    onChange={(e) => setBlockInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTopic("block");
                      }
                    }}
                    placeholder="e.g. competitor pricing, legal advice"
                    className="flex-1 h-8 px-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => addTopic("block")}
                    className="h-8 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {blockedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {blockedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-[11px] text-red-400"
                      >
                        <span>{topic}</span>
                        <button
                          type="button"
                          onClick={() => removeTopic("block", topic)}
                          className="hover:text-white cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 px-3 rounded-md border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>
                {isSubmitting
                  ? "Saving..."
                  : editingSection
                  ? "Save changes"
                  : "Create section"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
