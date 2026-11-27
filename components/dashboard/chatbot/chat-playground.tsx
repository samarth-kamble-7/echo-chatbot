"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, ExternalLink, FileText, Trash2 } from "lucide-react";
import { askWorkspaceBot, type ChatCitation } from "@/lib/actions/chat";

interface SectionOption {
  id: string;
  name: string;
  tone: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  retrievalMode?: "vector" | "keyword";
  model?: string;
  error?: boolean;
}

interface ChatPlaygroundProps {
  geminiConfigured: boolean;
  sourceCount: number;
  sections: SectionOption[];
}

export function ChatPlayground({
  geminiConfigured,
  sourceCount,
  sections,
}: ChatPlaygroundProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await askWorkspaceBot(
        trimmed,
        selectedSectionId || undefined
      );
      if (!res.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-err`,
            role: "assistant",
            content: res.error,
            error: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot`,
          role: "assistant",
          content: res.data.answer,
          citations: res.data.citations,
          retrievalMode: res.data.retrievalMode,
          model: res.data.model,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: "assistant",
          content: "Failed to process your question.",
          error: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
              Chatbot
            </h1>
            <span className="text-xs font-mono text-zinc-500">
              {sourceCount} {sourceCount === 1 ? "source" : "sources"} indexed
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Test grounded answers and inspect retrieved citations from your knowledge base.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sections.length > 0 && (
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              aria-label="Filter by section"
              className="h-7 px-2.5 rounded-md border border-zinc-800 bg-[#09090b] text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
            >
              <option value="">All Knowledge</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Section: {sec.name} ({sec.tone})
                </option>
              ))}
            </select>
          )}

          <span
            className={`px-2.5 py-1 rounded-md border text-[11px] font-mono ${
              geminiConfigured
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
            }`}
          >
            {geminiConfigured
              ? "pgvector + Gemini"
              : "Keyword mode (GEMINI_API_KEY unset)"}
          </span>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              title="Clear conversation"
              className="h-7 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Viewport */}
      <div className="rounded-lg border border-zinc-800 bg-[#09090b] flex flex-col h-[calc(100vh-15rem)] min-h-[420px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm font-medium text-zinc-200">
                Ask a question from your documentation
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                {sourceCount === 0
                  ? "Add at least one URL, file, or text source in Knowledge first."
                  : "Echo retrieves matching chunks from Neon pgvector and grounds the response in those sources."}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-800 text-zinc-100"
                      : msg.error
                      ? "border border-red-500/30 bg-red-500/10 text-red-300"
                      : "border border-zinc-800 bg-[#050509] text-zinc-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                        <span>
                          Sources ({msg.citations.length}) via{" "}
                          {msg.retrievalMode}
                        </span>
                        {msg.model && <span>{msg.model}</span>}
                      </div>

                      <div className="space-y-1.5">
                        {msg.citations.map((cit, idx) => (
                          <div
                            key={cit.id}
                            className="p-2.5 rounded-md border border-zinc-800/80 bg-[#09090b] space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="size-3 text-emerald-400 shrink-0" />
                                <span className="font-medium text-zinc-200 truncate">
                                  [{idx + 1}] {cit.title}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                  chunk #{cit.chunkIndex + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {cit.similarity !== null && (
                                  <span className="text-[10px] font-mono text-emerald-400">
                                    {(cit.similarity * 100).toFixed(0)}% match
                                  </span>
                                )}
                                {cit.sourceUrl &&
                                  (cit.sourceUrl.startsWith("http://") ||
                                    cit.sourceUrl.startsWith("https://")) && (
                                    <a
                                      href={cit.sourceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-zinc-400 hover:text-zinc-200"
                                      title="Open source"
                                    >
                                      <ExternalLink className="size-3" />
                                    </a>
                                  )}
                              </div>
                            </div>

                            <p className="text-[11px] font-mono text-zinc-400 line-clamp-2">
                              {cit.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="size-3.5 animate-spin text-emerald-400" />
              <span>Retrieving context and generating answer...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-zinc-800 flex items-center gap-2 bg-[#09090b]"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your uploaded docs..."
            className="flex-1 h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="h-9 px-3.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="size-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
