"use client";

import React, { useState } from "react";
import {
  Loader2,
  Check,
  Plus,
  X,
  Copy,
  MessageSquare,
  Bot,
  Headphones,
  HelpCircle,
} from "lucide-react";
import {
  saveChatbotSettings,
  type ChatbotConfig,
  type LauncherIconType,
} from "@/lib/actions/chatbot";

type ConfigTab = "identity" | "style" | "embed";

interface ChatbotSettingsFormProps {
  orgId: string;
  config: ChatbotConfig;
  onChange: (next: ChatbotConfig) => void;
}

const COLOR_PRESETS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#e4e4e7", // Zinc Light
];

export function ChatbotSettingsForm({
  orgId,
  config,
  onChange,
}: ChatbotSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>("identity");
  const [questionInput, setQuestionInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-domain.com";

  const embedCode = `<script src="${origin}/widget.js" data-org="${orgId}" defer></script>`;

  const addQuestion = () => {
    const val = questionInput.trim();
    if (!val) return;
    if (config.suggestedQuestions.length >= 4) return;
    const exists = config.suggestedQuestions.some(
      (q) => q.toLowerCase() === val.toLowerCase()
    );
    if (!exists) {
      onChange({
        ...config,
        suggestedQuestions: [...config.suggestedQuestions, val],
      });
    }
    setQuestionInput("");
  };

  const removeQuestion = (q: string) => {
    onChange({
      ...config,
      suggestedQuestions: config.suggestedQuestions.filter((item) => item !== q),
    });
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(false);
    setIsSaving(true);

    try {
      const res = await saveChatbotSettings(config);
      if (!res.success) {
        setError(res.error);
        return;
      }
      onChange(res.data);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch {
      setError("Failed to save chatbot settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-lg border border-zinc-800 bg-[#09090b] p-5 space-y-4"
    >
      <div className="space-y-0.5 pb-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-100">
          Widget Customization
        </h2>
        <p className="text-xs text-zinc-500">
          Configure how your chatbot looks and behaves on any website.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-zinc-900 border border-zinc-800">
        {[
          { id: "identity" as const, label: "Identity" },
          { id: "style" as const, label: "Appearance" },
          { id: "embed" as const, label: "Embed" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
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

      {error && (
        <div className="px-3 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-300">
          {error}
        </div>
      )}

      {activeTab === "identity" && (
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Chatbot Name
              </label>
              <input
                type="text"
                required
                value={config.botName}
                onChange={(e) =>
                  onChange({ ...config, botName: e.target.value })
                }
                placeholder="Echo Support"
                className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Status Subtitle
              </label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) =>
                  onChange({ ...config, subtitle: e.target.value })
                }
                placeholder="Online"
                className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Welcome Message
            </label>
            <textarea
              rows={2}
              required
              value={config.welcomeMessage}
              onChange={(e) =>
                onChange({ ...config, welcomeMessage: e.target.value })
              }
              placeholder="Hi! Ask me anything about our documentation."
              className="w-full p-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Input Placeholder
              </label>
              <input
                type="text"
                value={config.inputPlaceholder}
                onChange={(e) =>
                  onChange({ ...config, inputPlaceholder: e.target.value })
                }
                placeholder="Ask a question..."
                className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Support Email{" "}
                <span className="text-zinc-500 font-normal">(fallback)</span>
              </label>
              <input
                type="email"
                value={config.supportEmail}
                onChange={(e) =>
                  onChange({ ...config, supportEmail: e.target.value })
                }
                placeholder="support@company.com"
                className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              System Instructions{" "}
              <span className="text-zinc-500 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={config.systemPrompt}
              onChange={(e) =>
                onChange({ ...config, systemPrompt: e.target.value })
              }
              placeholder="Keep answers concise and friendly."
              className="w-full p-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-y"
            />
          </div>
        </div>
      )}

      {activeTab === "style" && (
        <div className="space-y-4">
          {/* Primary Color */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              Primary Color
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) =>
                  onChange({ ...config, primaryColor: e.target.value })
                }
                aria-label="Pick primary color"
                className="size-9 rounded-md border border-zinc-800 bg-[#050509] p-1 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) =>
                  onChange({ ...config, primaryColor: e.target.value })
                }
                placeholder="#10b981"
                className="w-28 h-9 px-2.5 rounded-md border border-zinc-800 bg-[#050509] font-mono text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
              <div className="flex items-center gap-1.5 ml-auto">
                {COLOR_PRESETS.map((hex) => {
                  const selected =
                    config.primaryColor.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => onChange({ ...config, primaryColor: hex })}
                      title={hex}
                      className={`size-6 rounded border transition-transform cursor-pointer ${
                        selected
                          ? "border-white scale-110"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Theme & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Widget Theme
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-[#050509] border border-zinc-800">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ ...config, theme: t })}
                    className={`py-1 rounded text-xs font-medium capitalize cursor-pointer ${
                      config.theme === t
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Screen Position
              </label>
              <select
                value={config.position}
                onChange={(e) =>
                  onChange({
                    ...config,
                    position:
                      e.target.value === "bottom-left"
                        ? "bottom-left"
                        : "bottom-right",
                  })
                }
                className="w-full h-9 px-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>

          {/* Launcher Icon & Floating Pill Style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Launcher Icon
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-md bg-[#050509] border border-zinc-800">
                {(
                  [
                    { id: "message", Icon: MessageSquare, label: "Message" },
                    { id: "bot", Icon: Bot, label: "Bot" },
                    { id: "headphones", Icon: Headphones, label: "Support" },
                    { id: "help", Icon: HelpCircle, label: "Help" },
                  ] as Array<{
                    id: LauncherIconType;
                    Icon: typeof MessageSquare;
                    label: string;
                  }>
                ).map(({ id, Icon, label }) => {
                  const selected = config.launcherIcon === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      title={label}
                      onClick={() => onChange({ ...config, launcherIcon: id })}
                      className={`h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        selected
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Icon className="size-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Launcher Style
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-[#050509] border border-zinc-800">
                {(
                  [
                    { id: "icon", label: "Icon" },
                    { id: "pill", label: "Floating Text" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onChange({ ...config, launcherStyle: item.id })
                    }
                    className={`py-1 rounded text-[11px] font-medium cursor-pointer ${
                      config.launcherStyle === item.id
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {config.launcherStyle === "pill" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Floating Button Text
              </label>
              <input
                type="text"
                value={config.launcherText}
                onChange={(e) =>
                  onChange({ ...config, launcherText: e.target.value })
                }
                placeholder="Chat with us"
                className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
          )}

          {/* Suggested Starter Questions */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              Starter Questions{" "}
              <span className="text-zinc-500 font-normal">(up to 4)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addQuestion();
                  }
                }}
                disabled={config.suggestedQuestions.length >= 4}
                placeholder="e.g. How do I get started?"
                className="flex-1 h-8 px-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={addQuestion}
                disabled={config.suggestedQuestions.length >= 4}
                className="h-8 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="size-3.5" />
                <span>Add</span>
              </button>
            </div>

            {config.suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {config.suggestedQuestions.map((q) => (
                  <span
                    key={q}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 bg-[#050509] text-[11px] text-zinc-300"
                  >
                    <span className="truncate max-w-[200px]">{q}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q)}
                      className="text-zinc-500 hover:text-white cursor-pointer"
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

      {activeTab === "embed" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Paste this script before the closing{" "}
            <code className="text-zinc-200">&lt;/body&gt;</code> tag on any
            website to display your customized chatbot widget:
          </p>

          <pre className="p-3 rounded-md border border-zinc-800 bg-[#050509] font-mono text-[11px] text-zinc-200 whitespace-pre-wrap break-all select-all">
            {embedCode}
          </pre>

          <button
            type="button"
            onClick={handleCopyEmbed}
            className="h-8 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedEmbed ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy embed code</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Save Footer */}
      <div className="pt-3 flex items-center justify-between border-t border-zinc-800">
        <span className="text-xs text-emerald-400 inline-flex items-center gap-1">
          {savedNotice && (
            <>
              <Check className="size-3.5" />
              <span>Saved</span>
            </>
          )}
        </span>

        <button
          type="submit"
          disabled={isSaving}
          className="h-8 px-4 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
        >
          {isSaving && <Loader2 className="size-3.5 animate-spin" />}
          <span>{isSaving ? "Saving..." : "Save settings"}</span>
        </button>
      </div>
    </form>
  );
}
