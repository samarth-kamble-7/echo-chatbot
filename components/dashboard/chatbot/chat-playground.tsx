"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Trash2,
  Bot,
  MessageSquare,
  Headphones,
  HelpCircle,
} from "lucide-react";
import { askWorkspaceBot } from "@/lib/actions/chat";
import type {
  ChatbotConfig,
  LauncherIconType,
} from "@/lib/actions/chatbot";
import { ChatbotSettingsForm } from "./chatbot-settings-form";

function LauncherIconBadge({
  type,
  className,
}: {
  type: LauncherIconType;
  className?: string;
}) {
  if (type === "bot") return <Bot className={className} />;
  if (type === "headphones") return <Headphones className={className} />;
  if (type === "help") return <HelpCircle className={className} />;
  return <MessageSquare className={className} />;
}

interface SectionOption {
  id: string;
  name: string;
  tone: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface ChatPlaygroundProps {
  orgId: string;
  sections: SectionOption[];
  initialConfig: ChatbotConfig;
}

export function ChatPlayground({
  orgId,
  sections,
  initialConfig,
}: ChatPlaygroundProps) {
  const [config, setConfig] = useState<ChatbotConfig>(initialConfig);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, role: "user", content: trimmed },
    ]);
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
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const isLight = config.theme === "light";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            Chatbot
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Customize your widget appearance, embed it on any website, and test responses.
          </p>
        </div>

        {sections.length > 0 && (
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            aria-label="Test section"
            className="h-8 px-2.5 rounded-md border border-zinc-800 bg-[#09090b] text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 w-fit"
          >
            <option value="">All Topics</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Two-Column Split: Customization + Live Website Widget Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <ChatbotSettingsForm
            orgId={orgId}
            config={config}
            onChange={setConfig}
          />
        </div>

        <div className="lg:col-span-7 space-y-3">
          {/* Simulated Widget Window */}
          <div
            className={`rounded-lg border flex flex-col h-[520px] overflow-hidden ${
              isLight
                ? "border-zinc-200 bg-white text-zinc-900"
                : "border-zinc-800 bg-[#09090b] text-zinc-100"
            }`}
          >
            {/* Widget Header */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between ${
                isLight
                  ? "border-zinc-200 bg-zinc-50"
                  : "border-zinc-800 bg-[#0c0c10]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="size-8 rounded-md flex items-center justify-center text-zinc-950 shrink-0"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Bot className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">
                    {config.botName || "Echo Support"}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[11px] ${
                      isLight ? "text-zinc-500" : "text-zinc-400"
                    }`}
                  >
                    <span
                      className="size-1.5 rounded-sm"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    <span>{config.subtitle || "Online"}</span>
                  </div>
                </div>
              </div>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  title="Reset chat"
                  className={`h-7 px-2.5 rounded-md border text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isLight
                      ? "border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600"
                      : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Trash2 className="size-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Chat Conversation */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                isLight ? "bg-white" : "bg-[#050509]"
              }`}
            >
              {/* Welcome Message */}
              <div className="flex items-start gap-2.5">
                <div
                  className="size-6 rounded-md flex items-center justify-center text-zinc-950 shrink-0 mt-0.5"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <Bot className="size-3.5" />
                </div>
                <div
                  className={`max-w-[80%] rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${
                    isLight
                      ? "border-zinc-200 bg-zinc-50 text-zinc-800"
                      : "border-zinc-800 bg-[#0c0c10] text-zinc-200"
                  }`}
                >
                  {config.welcomeMessage ||
                    "Hi! Ask me anything about our documentation."}
                </div>
              </div>

              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end">
                    <div
                      className="max-w-[80%] rounded-lg px-3.5 py-2.5 text-xs text-zinc-950 font-medium leading-relaxed whitespace-pre-wrap"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <div
                      className="size-6 rounded-md flex items-center justify-center text-zinc-950 shrink-0 mt-0.5"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <Bot className="size-3.5" />
                    </div>
                    <div
                      className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.error
                          ? "border border-red-500/30 bg-red-500/10 text-red-400"
                          : isLight
                          ? "border border-zinc-200 bg-zinc-50 text-zinc-800"
                          : "border border-zinc-800 bg-[#0c0c10] text-zinc-200"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              )}

              {isSending && (
                <div className="flex items-start gap-2.5">
                  <div
                    className="size-6 rounded-md flex items-center justify-center text-zinc-950 shrink-0 mt-0.5"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Bot className="size-3.5" />
                  </div>
                  <div
                    className={`rounded-lg border px-3.5 py-2.5 text-xs inline-flex items-center gap-2 ${
                      isLight
                        ? "border-zinc-200 bg-zinc-50 text-zinc-500"
                        : "border-zinc-800 bg-[#0c0c10] text-zinc-400"
                    }`}
                  >
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Typing...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Suggested Starter Questions */}
            {messages.length === 0 && config.suggestedQuestions.length > 0 && (
              <div
                className={`px-4 py-2 flex flex-wrap gap-1.5 ${
                  isLight ? "bg-white" : "bg-[#050509]"
                }`}
              >
                {config.suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors cursor-pointer ${
                      isLight
                        ? "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                        : "border-zinc-800 bg-[#0c0c10] hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className={`p-3 border-t flex items-center gap-2 ${
                isLight
                  ? "border-zinc-200 bg-zinc-50"
                  : "border-zinc-800 bg-[#0c0c10]"
              }`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.inputPlaceholder || "Ask a question..."}
                className={`flex-1 h-9 px-3 rounded-md border text-xs focus:outline-none transition-colors ${
                  isLight
                    ? "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400"
                    : "border-zinc-800 bg-[#050509] text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600"
                }`}
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="h-9 px-3.5 rounded-md text-zinc-950 text-xs font-medium inline-flex items-center gap-1.5 transition-opacity cursor-pointer disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: config.primaryColor }}
              >
                <Send className="size-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* Launcher Button Preview Strip */}
          <div
            className={`flex items-center ${
              config.position === "bottom-left" ? "justify-start" : "justify-end"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-zinc-500">
                Launcher ({config.position})
              </span>
              {config.launcherStyle === "pill" ? (
                <div
                  className="h-10 px-4 rounded-full inline-flex items-center gap-2 text-xs font-semibold text-zinc-950 shadow-lg"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <LauncherIconBadge
                    type={config.launcherIcon}
                    className="size-4"
                  />
                  <span>{config.launcherText || "Chat with us"}</span>
                </div>
              ) : (
                <div
                  className="size-10 rounded-lg flex items-center justify-center text-zinc-950 shadow-lg"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <LauncherIconBadge
                    type={config.launcherIcon}
                    className="size-4"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
