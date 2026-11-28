"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Mail,
  Trash2,
  Send,
  Loader2,
  Globe,
  Clock,
  Monitor,
  ChevronDown,
  ArrowRight,
  ArrowUp,
  ArrowLeft,
  Check,
  CornerDownRight,
  ListFilter,
  Info,
  Volume2,
  VolumeX,
  Bell,
  X,
} from "lucide-react";
import type { ChatMessageRow, ChatSession } from "@/db/schema";
import {
  deleteConversation,
  getConversationMessages,
  sendOperatorReply,
  updateConversationStatus,
  type ConversationStatus,
  type ConversationSummary,
} from "@/lib/actions/conversion";

interface ConversionInboxProps {
  initialConversations: ConversationSummary[];
}

function getDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    seed || "visitor"
  )}`;
}

function playEscalationSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [587.33, 880]; // D5 -> A5 chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.09, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  } catch {
    // ignore audio errors if browser blocks autoplay before interaction
  }
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-black/15"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return (
    <>
      {lines.map((line, idx) => {
        const bulletMatch = line.match(/^\s*[\*\-]\s+(.*)$/);
        const text = bulletMatch ? `• ${bulletMatch[1]}` : line;
        return (
          <React.Fragment key={idx}>
            {renderInlineMarkdown(text)}
            {idx < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        );
      })}
    </>
  );
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

function StatusIconBadge({ status }: { status: string }) {
  if (status === "resolved") {
    return (
      <span
        title="Resolved"
        className="size-5 rounded-md border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 inline-flex items-center justify-center shrink-0"
      >
        <Check className="size-3" />
      </span>
    );
  }
  if (status === "escalated") {
    return (
      <span
        title="Escalated"
        className="size-5 rounded-md border border-amber-500/30 bg-amber-500/15 text-amber-400 inline-flex items-center justify-center shrink-0"
      >
        <ArrowUp className="size-3" />
      </span>
    );
  }
  return (
    <span
      title="Unresolved"
      className="size-5 rounded-md border border-red-500/30 bg-red-500/15 text-red-400 inline-flex items-center justify-center shrink-0"
    >
      <ArrowRight className="size-3" />
    </span>
  );
}

function getStatusButtonClasses(status: string): string {
  if (status === "resolved") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20";
  }
  if (status === "escalated") {
    return "border-amber-500/30 bg-amber-500/15 text-amber-400 hover:bg-amber-500/20";
  }
  return "border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/20";
}

export function ConversionInbox({ initialConversations }: ConversionInboxProps) {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [statusFilter, setStatusFilter] = useState<
    "all" | ConversationStatus
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [activeSession, setActiveSession] = useState<ChatSession | null>(
    initialConversations[0] || null
  );
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter dropdown state
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, selectedId, loadingMessages]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Right-pane accordion states
  const [openDevice, setOpenDevice] = useState(true);
  const [openLocation, setOpenLocation] = useState(false);
  const [openSession, setOpenSession] = useState(false);

  // Mobile WhatsApp-style view state (< lg screens)
  const [mobileView, setMobileView] = useState<"list" | "chat" | "info">("list");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem("echo-inbox-sound") !== "false";
    } catch {
      return true;
    }
  });
  const soundEnabledRef = useRef(soundEnabled);
  const [escalationAlert, setEscalationAlert] =
    useState<ConversationSummary | null>(null);
  const prevEscalatedIdsRef = useRef<Set<string>>(
    new Set(
      initialConversations
        .filter((c) => c.status === "escalated")
        .map((c) => c.id)
    )
  );

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Auto-hide in-app escalation toast after 6s
  useEffect(() => {
    if (!escalationAlert) return;
    const timer = setTimeout(() => setEscalationAlert(null), 6000);
    return () => clearTimeout(timer);
  }, [escalationAlert]);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    try {
      window.localStorage.setItem("echo-inbox-sound", String(next));
    } catch {
      // ignore
    }
    if (next) {
      playEscalationSound();
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission().catch(() => {});
      }
    }
  };

  // Update browser tab title when escalated chats need attention
  useEffect(() => {
    const escalatedCount = conversations.filter(
      (c) => c.status === "escalated"
    ).length;
    document.title =
      escalatedCount > 0
        ? `(${escalatedCount}) Echo Support | Conversion`
        : "Echo Support | Workspace Dashboard";
    return () => {
      document.title = "Echo Support | Workspace Dashboard";
    };
  }, [conversations]);

  // Auto-reset two-step delete confirmation after 3s
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => setConfirmDeleteId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  // Operator typing heartbeat refs
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTypingSignal = (sessionId: string, typing: boolean) => {
    fetch("/api/conversion/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, typing }),
    }).catch(() => {
      // ignore transient typing signal errors
    });
  };

  // Real-time SSE stream for the conversations list (new chats & updates)
  useEffect(() => {
    const listSource = new EventSource("/api/conversion/stream");
    listSource.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as {
          conversations?: ConversationSummary[];
        };
        if (Array.isArray(data.conversations)) {
          const nextList = data.conversations;
          const nextEscalated = new Set(
            nextList.filter((c) => c.status === "escalated").map((c) => c.id)
          );
          const newlyEscalated = nextList.find(
            (c) =>
              c.status === "escalated" && !prevEscalatedIdsRef.current.has(c.id)
          );
          prevEscalatedIdsRef.current = nextEscalated;

          if (newlyEscalated) {
            setEscalationAlert(newlyEscalated);
            if (soundEnabledRef.current) {
              playEscalationSound();
            }
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification("Conversation Escalated", {
                body: `${newlyEscalated.visitorName} needs a human operator.`,
              });
            }
          }

          setConversations(nextList);
        }
      } catch {
        // ignore parse errors
      }
    };
    return () => {
      listSource.close();
    };
  }, []);

  // Real-time SSE stream for the currently selected conversation
  useEffect(() => {
    if (!selectedId) return;
    const source = new EventSource(
      `/api/conversion/stream?sessionId=${encodeURIComponent(selectedId)}`
    );
    source.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as {
          status?: ConversationStatus;
          messages?: ChatMessageRow[];
        };
        if (Array.isArray(data.messages)) {
          const nextMsgs = data.messages;
          setMessages(nextMsgs);
          const last = nextMsgs[nextMsgs.length - 1];
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedId
                ? {
                    ...c,
                    status: data.status || c.status,
                    messageCount: nextMsgs.length,
                    lastMessage: last ? last.content : c.lastMessage,
                    lastActiveAt: last?.createdAt || c.lastActiveAt,
                  }
                : c
            )
          );
        }
        if (data.status) {
          const nextStatus = data.status;
          setActiveSession((prev) =>
            prev && prev.id === selectedId
              ? { ...prev, status: nextStatus }
              : prev
          );
        }
      } catch {
        // ignore parse errors
      }
    };
    return () => {
      source.close();
    };
  }, [selectedId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.visitorName.toLowerCase().includes(q) ||
        c.visitorEmail.toLowerCase().includes(q) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [conversations, statusFilter, searchQuery]);

  const handleSelectConversation = async (conv: ConversationSummary) => {
    setSelectedId(conv.id);
    setActiveSession(conv);
    setMessages([]);
    setLoadingMessages(true);
    setError(null);
    setMobileView("chat");

    const res = await getConversationMessages(conv.id);
    setLoadingMessages(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setActiveSession(res.data.session);
    setMessages(res.data.messages);
  };

  const handleStatusChange = async (nextStatus: ConversationStatus) => {
    if (!selectedId) return;
    setBusyStatus(true);
    setError(null);

    const res = await updateConversationStatus(selectedId, nextStatus);
    setBusyStatus(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setActiveSession(res.data);
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, status: nextStatus } : c))
    );
  };

  const handleCycleStatus = () => {
    if (!activeSession) return;
    const order: ConversationStatus[] = ["unresolved", "escalated", "resolved"];
    const idx = order.indexOf(activeSession.status as ConversationStatus);
    const next = order[(idx + 1) % order.length];
    handleStatusChange(next);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyInput.trim() || sendingReply) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    lastTypingSentRef.current = 0;
    sendTypingSignal(selectedId, false);

    setSendingReply(true);
    setError(null);

    const res = await sendOperatorReply(selectedId, replyInput);
    setSendingReply(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setReplyInput("");
    setMessages((prev) =>
      prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]
    );
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              messageCount: c.messageCount + 1,
              lastMessage: res.data.content,
              lastActiveAt: res.data.createdAt || c.lastActiveAt,
            }
          : c
      )
    );
  };

  const handleDelete = async (sessionId: string) => {
    setError(null);
    const res = await deleteConversation(sessionId);
    if (!res.success) {
      setError(res.error);
      return;
    }

    const remaining = conversations.filter((c) => c.id !== sessionId);
    setConversations(remaining);
    if (selectedId === sessionId) {
      setSelectedId(remaining[0]?.id || null);
      setActiveSession(remaining[0] || null);
      setMessages([]);
      setMobileView("list");
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    if (confirmDeleteId !== sessionId) {
      setConfirmDeleteId(sessionId);
      return;
    }
    setConfirmDeleteId(null);
    handleDelete(sessionId);
  };

  const selectedSummary = conversations.find((c) => c.id === selectedId);
  const isSessionExpired = selectedSummary?.isExpired ?? false;

  return (
    <div className="-m-4 md:-m-8 h-[calc(100vh-3.5rem)] flex flex-col">
      {error && (
        <div className="px-4 py-2 border-b border-red-500/30 bg-red-500/10 text-xs text-red-300 shrink-0">
          {error}
        </div>
      )}

      {escalationAlert && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs w-full rounded-lg border border-amber-500/40 bg-[#0c0c10] shadow-2xl p-3 flex items-start gap-2.5">
          <span className="size-7 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 inline-flex items-center justify-center shrink-0">
            <Bell className="size-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-zinc-100 truncate">
              Escalated: {escalationAlert.visitorName}
            </div>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {escalationAlert.lastMessage || "Needs a human operator"}
            </p>
            <button
              type="button"
              onClick={() => {
                handleSelectConversation(escalationAlert);
                setEscalationAlert(null);
              }}
              className="mt-2 h-6 px-2.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-semibold cursor-pointer"
            >
              View chat
            </button>
          </div>
          <button
            type="button"
            onClick={() => setEscalationAlert(null)}
            aria-label="Dismiss notification"
            className="text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Full-Bleed 3-Pane Support Inbox */}
      <div className="flex-1 bg-[#09090b] grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Pane 1: Conversation List */}
        <div
          className={`${
            mobileView === "list" ? "flex" : "hidden"
          } lg:flex lg:col-span-3 lg:border-r border-zinc-800 flex-col min-h-0`}
        >
          {/* Filter + Sound + Search */}
          <div className="p-3 border-b border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((prev) => !prev)}
                  className="w-full h-8 px-2.5 rounded-md border border-zinc-800 bg-[#050509] hover:border-zinc-700 text-xs font-medium text-zinc-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <ListFilter className="size-3.5 text-zinc-400" />
                    <span className="capitalize">
                      {statusFilter === "all"
                        ? `All (${conversations.length})`
                        : statusFilter}
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-zinc-500 transition-transform ${
                      filterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

              {filterOpen && (
                <div className="absolute top-[calc(100%+4px)] inset-x-0 z-30 p-1 rounded-md border border-zinc-800 bg-[#0c0c10] shadow-2xl space-y-0.5">
                  {(
                    [
                      { id: "all", label: "All", count: conversations.length },
                      {
                        id: "unresolved",
                        label: "Unresolved",
                        count: conversations.filter(
                          (c) => c.status === "unresolved"
                        ).length,
                      },
                      {
                        id: "escalated",
                        label: "Escalated",
                        count: conversations.filter(
                          (c) => c.status === "escalated"
                        ).length,
                      },
                      {
                        id: "resolved",
                        label: "Resolved",
                        count: conversations.filter(
                          (c) => c.status === "resolved"
                        ).length,
                      },
                    ] as Array<{
                      id: "all" | ConversationStatus;
                      label: string;
                      count: number;
                    }>
                  ).map((opt) => {
                    const active = statusFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.id);
                          setFilterOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          active
                            ? "bg-zinc-800 text-white font-medium"
                            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {opt.id === "all" ? (
                            <ListFilter className="size-3.5 text-zinc-400" />
                          ) : (
                            <StatusIconBadge status={opt.id} />
                          )}
                          <span>{opt.label}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
                          <span>{opt.count}</span>
                          {active && (
                            <Check className="size-3 text-emerald-400" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              </div>

              <button
                type="button"
                onClick={toggleSound}
                title={
                  soundEnabled
                    ? "Escalation sound enabled (click to mute)"
                    : "Escalation sound muted (click to enable)"
                }
                aria-label="Toggle escalation sound"
                className={`h-8 w-8 rounded-md border inline-flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  soundEnabled
                    ? "border-zinc-800 bg-[#050509] text-emerald-400 hover:border-zinc-700"
                    : "border-zinc-800 bg-[#050509] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="size-3.5" />
                ) : (
                  <VolumeX className="size-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-zinc-800 bg-[#050509] text-xs">
              <Search className="size-3.5 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor..."
                className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-500 w-full"
              />
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/70">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No conversations found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                const isEscalated = conv.status === "escalated";
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full p-3.5 text-left transition-colors cursor-pointer flex items-start gap-3 ${
                      isEscalated ? "border-l-2 border-l-amber-500" : ""
                    } ${
                      isSelected
                        ? "bg-zinc-800/60"
                        : "hover:bg-zinc-900/50"
                    }`}
                  >
                    <img
                      src={getDiceBearUrl(conv.visitorEmail || conv.visitorName)}
                      alt={conv.visitorName}
                      className="size-9 rounded-full border border-zinc-700/80 bg-zinc-900 shrink-0 object-cover"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          {isEscalated && (
                            <span
                              title="Needs human response"
                              className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0"
                            />
                          )}
                          <span className="text-xs font-semibold text-zinc-100 truncate">
                            {conv.visitorName}
                          </span>
                        </span>
                        <span
                          className="text-[10px] text-zinc-500 shrink-0"
                          suppressHydrationWarning
                        >
                          {formatDate(conv.lastActiveAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-400 truncate inline-flex items-center gap-1 min-w-0">
                          <CornerDownRight className="size-3 text-zinc-500 shrink-0" />
                          <span className="truncate">
                            {conv.lastMessage || "Session started"}
                          </span>
                        </span>
                        <StatusIconBadge status={conv.status} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Pane 2: Active Message Thread */}
        <div
          className={`${
            mobileView === "chat" ? "flex" : "hidden"
          } lg:flex lg:col-span-6 lg:border-r border-zinc-800 flex-col min-h-0 bg-[#050509]`}
        >
          {!activeSession ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-sm font-medium text-zinc-200">
                No conversation selected
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Select a visitor from the left list to view messages and reply.
              </p>
            </div>
          ) : (
            <>
              {/* Thread Top Bar */}
              <div className="h-13 px-3 sm:px-4 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    title="Back to conversations"
                    className="lg:hidden h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <span className="lg:hidden text-xs font-semibold text-zinc-100 truncate">
                    {activeSession.visitorName}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(activeSession.id)}
                    title="Delete conversation"
                    className={`hidden lg:inline-flex h-8 px-2.5 rounded-md border text-xs items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      confirmDeleteId === activeSession.id
                        ? "border-red-500/50 bg-red-500/15 text-red-400"
                        : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400"
                    }`}
                  >
                    <Trash2 className="size-3.5" />
                    <span>
                      {confirmDeleteId === activeSession.id
                        ? "Confirm?"
                        : "Delete"}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyStatus}
                    onClick={handleCycleStatus}
                    title="Click to change status"
                    className={`h-8 px-2.5 sm:px-3 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 capitalize transition-colors cursor-pointer disabled:opacity-50 ${getStatusButtonClasses(
                      activeSession.status
                    )}`}
                  >
                    {activeSession.status === "resolved" ? (
                      <Check className="size-3.5" />
                    ) : activeSession.status === "escalated" ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowRight className="size-3.5" />
                    )}
                    <span>{activeSession.status}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileView("info")}
                    title="Visitor info"
                    className="lg:hidden h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Info className="size-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-5 space-y-4"
              >
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center gap-2 text-xs text-zinc-500">
                    <Loader2 className="size-4 animate-spin text-emerald-400" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                    No messages recorded in this session yet.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isVisitor = msg.role === "user";

                    if (isVisitor) {
                      return (
                        <div key={msg.id} className="flex items-end gap-2.5">
                          <img
                            src={getDiceBearUrl(
                              activeSession.visitorEmail ||
                                activeSession.visitorName
                            )}
                            alt={activeSession.visitorName}
                            className="size-7 rounded-full border border-zinc-700/80 bg-zinc-900 shrink-0"
                          />
                          <div className="max-w-[78%] rounded-lg border border-zinc-800 bg-[#0c0c10] px-3.5 py-2.5 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className="flex flex-col items-end">
                        <div className="max-w-[78%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap bg-emerald-500 text-zinc-950 font-medium">
                          <FormattedMessage content={msg.content} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Operator Reply Input */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-zinc-800 bg-[#09090b] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReplyInput(val);
                    if (!selectedId) return;
                    if (!val.trim()) {
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = null;
                      }
                      lastTypingSentRef.current = 0;
                      sendTypingSignal(selectedId, false);
                      return;
                    }
                    const now = Date.now();
                    if (now - lastTypingSentRef.current > 1500) {
                      lastTypingSentRef.current = now;
                      sendTypingSignal(selectedId, true);
                    }
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(() => {
                      lastTypingSentRef.current = 0;
                      sendTypingSignal(selectedId, false);
                    }, 2500);
                  }}
                  onBlur={() => {
                    if (!selectedId) return;
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = null;
                    }
                    lastTypingSentRef.current = 0;
                    sendTypingSignal(selectedId, false);
                  }}
                  placeholder="Write an operator reply..."
                  className="flex-1 h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyInput.trim()}
                  className="h-9 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sendingReply ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  <span>Reply</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Pane 3: Visitor Contact & Metadata */}
        <div
          className={`${
            mobileView === "info" ? "flex" : "hidden"
          } lg:flex lg:col-span-3 bg-[#09090b] flex-col min-h-0 overflow-y-auto`}
        >
          {activeSession && (
            <>
              <div className="lg:hidden h-13 px-4 border-b border-zinc-800 flex items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileView("chat")}
                    title="Back to chat"
                    className="h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <span className="text-xs font-semibold text-zinc-100">
                    Contact Info
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(activeSession.id)}
                  title="Delete conversation"
                  className={`h-8 px-2.5 rounded-md border text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    confirmDeleteId === activeSession.id
                      ? "border-red-500/50 bg-red-500/15 text-red-400"
                      : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400"
                  }`}
                >
                  <Trash2 className="size-3.5" />
                  <span>
                    {confirmDeleteId === activeSession.id
                      ? "Confirm?"
                      : "Delete"}
                  </span>
                </button>
              </div>
              <div className="p-4 border-b border-zinc-800 space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getDiceBearUrl(
                      activeSession.visitorEmail || activeSession.visitorName
                    )}
                    alt={activeSession.visitorName}
                    className="size-10 rounded-full border border-zinc-700/80 bg-zinc-900 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-100 truncate">
                      {activeSession.visitorName}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {activeSession.visitorEmail}
                    </div>
                  </div>
                </div>

                <a
                  href={`mailto:${activeSession.visitorEmail}`}
                  className="w-full h-9 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="size-3.5" />
                  <span>Send Email</span>
                </a>
              </div>

              {/* Accordion 1: Device Information */}
              <div className="border-b border-zinc-800">
                <button
                  type="button"
                  onClick={() => setOpenDevice(!openDevice)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-zinc-200 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Monitor className="size-3.5 text-zinc-400" />
                    <span>Device Information</span>
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-zinc-500 transition-transform ${
                      openDevice ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openDevice && (
                  <div className="px-4 pb-3 space-y-2 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Platform</span>
                      <span className="text-zinc-300 font-mono truncate">
                        {activeSession.metadata?.platform || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Screen</span>
                      <span className="text-zinc-300 font-mono">
                        {activeSession.metadata?.screenResolution || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Viewport</span>
                      <span className="text-zinc-300 font-mono">
                        {activeSession.metadata?.viewportSize || "-"}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-zinc-500 block">User Agent</span>
                      <span className="text-zinc-400 font-mono text-[10px] break-all block">
                        {activeSession.metadata?.userAgent || "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Location & Language */}
              <div className="border-b border-zinc-800">
                <button
                  type="button"
                  onClick={() => setOpenLocation(!openLocation)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-zinc-200 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Globe className="size-3.5 text-zinc-400" />
                    <span>Location &amp; Language</span>
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-zinc-500 transition-transform ${
                      openLocation ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openLocation && (
                  <div className="px-4 pb-3 space-y-2 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Timezone</span>
                      <span className="text-zinc-300 font-mono truncate">
                        {activeSession.metadata?.timezone || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Language</span>
                      <span className="text-zinc-300 font-mono">
                        {activeSession.metadata?.language || "-"}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-zinc-500 block">Current URL</span>
                      <span className="text-zinc-400 font-mono text-[10px] break-all block">
                        {activeSession.metadata?.currentUrl || "-"}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-zinc-500 block">Referrer</span>
                      <span className="text-zinc-400 font-mono text-[10px] break-all block">
                        {activeSession.metadata?.referrer || "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Session Details */}
              <div className="border-b border-zinc-800">
                <button
                  type="button"
                  onClick={() => setOpenSession(!openSession)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-zinc-200 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <Clock className="size-3.5 text-zinc-400" />
                    <span>Session Details</span>
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-zinc-500 transition-transform ${
                      openSession ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openSession && (
                  <div className="px-4 pb-3 space-y-2 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">24h Window</span>
                      <span
                        className={
                          isSessionExpired
                            ? "text-zinc-400 font-mono"
                            : "text-emerald-400 font-mono"
                        }
                      >
                        {isSessionExpired ? "Expired" : "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Started</span>
                      <span
                        className="text-zinc-300 font-mono"
                        suppressHydrationWarning
                      >
                        {formatDate(activeSession.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Last Active</span>
                      <span
                        className="text-zinc-300 font-mono"
                        suppressHydrationWarning
                      >
                        {formatDate(activeSession.lastActiveAt)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Expires</span>
                      <span
                        className="text-zinc-300 font-mono"
                        suppressHydrationWarning
                      >
                        {formatDate(activeSession.expiresAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
