"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Globe,
  FileUp,
  FileText,
  Loader2,
  Check,
  UploadCloud,
} from "lucide-react";
import type { KnowledgeSource } from "@/db/schema";
import {
  createFileKnowledgeSource,
  createTextKnowledgeSource,
  createUrlKnowledgeSource,
} from "@/lib/actions/knowledge";

type SourceTab = "url" | "file" | "text";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (sources: KnowledgeSource[]) => void;
}

export function AddSourceModal({
  isOpen,
  onClose,
  onCreated,
}: AddSourceModalProps) {
  const [activeTab, setActiveTab] = useState<SourceTab>("url");
  const [name, setName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [crawlMode, setCrawlMode] = useState<"single" | "crawl">("single");
  const [maxPages, setMaxPages] = useState<number>(10);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setSourceUrl("");
    setContent("");
    setSelectedFile(null);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setError(null);
    setSelectedFile(file);
    if (!name.trim()) {
      setName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (activeTab === "url") {
        const res = await createUrlKnowledgeSource({
          name: name.trim() || undefined,
          sourceUrl: sourceUrl.trim(),
          mode: crawlMode,
          maxPages,
        });
        if (!res.success) {
          setError(res.error);
          return;
        }
        onCreated(res.data);
      } else if (activeTab === "file") {
        if (!selectedFile) {
          setError("Select a file to upload.");
          return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (name.trim()) {
          formData.append("name", name.trim());
        }
        const res = await createFileKnowledgeSource(formData);
        if (!res.success) {
          setError(res.error);
          return;
        }
        onCreated([res.data]);
      } else {
        const res = await createTextKnowledgeSource({
          name: name.trim() || "Text Snippet",
          content,
        });
        if (!res.success) {
          setError(res.error);
          return;
        }
        onCreated([res.data]);
      }

      resetForm();
      onClose();
    } catch {
      setError("Failed to index knowledge source.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0a0a0d] shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Add knowledge source
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Extract, chunk, and store content for retrieval.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pt-3.5">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-zinc-900/90 border border-zinc-800/80">
            {[
              { id: "url" as const, label: "Website URL", icon: Globe },
              { id: "file" as const, label: "Upload File", icon: FileUp },
              { id: "text" as const, label: "Raw Text", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon
                    className={`size-3.5 ${
                      isActive ? "text-emerald-400" : "text-zinc-500"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Name{" "}
              {activeTab === "url" && (
                <span className="text-zinc-500 font-normal">(optional)</span>
              )}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                activeTab === "url"
                  ? "API Authentication Docs"
                  : activeTab === "file"
                    ? "Onboarding Guide"
                    : "Refund Policy FAQ"
              }
              className="w-full h-9 px-3 rounded-lg border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {activeTab === "url" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Documentation URL
                </label>
                <input
                  type="url"
                  required
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://docs.example.com/quickstart"
                  className="w-full h-9 px-3 rounded-lg border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Scrape Mode
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-[#050509] border border-zinc-800">
                    {(
                      [
                        { id: "single", label: "Single page" },
                        { id: "crawl", label: "Crawl site" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCrawlMode(m.id)}
                        className={`py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                          crawlMode === m.id
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {crawlMode === "crawl" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Max Pages
                    </label>
                    <select
                      value={maxPages}
                      onChange={(e) => setMaxPages(Number(e.target.value))}
                      className="w-full h-9 px-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                    >
                      <option value={5}>5 pages</option>
                      <option value={10}>10 pages</option>
                      <option value={20}>20 pages</option>
                    </select>
                  </div>
                )}
              </div>

              {crawlMode === "crawl" && (
                <p className="text-[11px] text-zinc-500">
                  Discovers subpages via sitemap.xml and links under the URL path.
                </p>
              )}
            </div>
          )}

          {activeTab === "file" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Document File
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files?.[0] || null);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-zinc-800 hover:border-zinc-600 bg-[#050509]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.md,.mdx,.txt,.json,.csv,.yaml,.yml"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(e.target.files?.[0] || null)
                  }
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                      <Check className="size-4" />
                    </div>
                    <span className="text-xs font-medium text-zinc-100 truncate max-w-[260px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB (click to replace)
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <UploadCloud className="size-6 text-zinc-500 mb-1" />
                    <span className="text-xs font-medium text-zinc-200">
                      Drop a file or click to browse
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      .pdf, .md, .mdx, .txt, .json, .csv, .yaml up to 5MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "text" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Content
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste documentation, FAQs, or policies..."
                className="w-full p-3 rounded-lg border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-y font-mono transition-all"
              />
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 px-3 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isSubmitting ? "Indexing..." : "Add source"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
