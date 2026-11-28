import React from "react";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import {
  Inbox,
  Library,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  MessageSquare,
  Bot,
} from "lucide-react";
import { db } from "@/db/client";
import {
  chatMessage,
  chatSession,
  chatbotSettings,
  knowledgeSource,
  section,
} from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";

export const dynamic = "force-dynamic";

function formatShortDate(dateStr: string | null): string {
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

export default async function DashboardPage() {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return null;
  }

  const [sessions, msgCountRows, sources, sections, botRows] =
    await Promise.all([
      db
        .select({
          id: chatSession.id,
          visitorName: chatSession.visitorName,
          visitorEmail: chatSession.visitorEmail,
          status: chatSession.status,
          lastActiveAt: chatSession.lastActiveAt,
        })
        .from(chatSession)
        .where(eq(chatSession.organizationId, ctx.orgId))
        .orderBy(desc(chatSession.lastActiveAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(chatMessage)
        .where(eq(chatMessage.organizationId, ctx.orgId)),
      db
        .select({
          id: knowledgeSource.id,
          status: knowledgeSource.status,
          chunkCount: knowledgeSource.chunkCount,
        })
        .from(knowledgeSource)
        .where(eq(knowledgeSource.organizationId, ctx.orgId)),
      db
        .select({
          id: section.id,
          isActive: section.isActive,
        })
        .from(section)
        .where(eq(section.organizationId, ctx.orgId)),
      db
        .select({
          botName: chatbotSettings.botName,
        })
        .from(chatbotSettings)
        .where(eq(chatbotSettings.organizationId, ctx.orgId))
        .limit(1),
    ]);

  const totalConversations = sessions.length;
  const unresolvedCount = sessions.filter(
    (s) => s.status === "unresolved"
  ).length;
  const escalatedSessions = sessions.filter((s) => s.status === "escalated");
  const escalatedCount = escalatedSessions.length;
  const resolvedCount = sessions.filter((s) => s.status === "resolved").length;
  const resolutionRate =
    totalConversations > 0
      ? Math.round((resolvedCount / totalConversations) * 100)
      : 0;

  const totalMessages = msgCountRows[0]?.count || 0;
  const totalSources = sources.length;
  const readySources = sources.filter((s) => s.status === "ready").length;
  const totalChunks = sources.reduce((sum, s) => sum + (s.chunkCount || 0), 0);
  const activeSections = sections.filter((s) => s.isActive).length;
  const botName = botRows[0]?.botName || "Echo Support";

  const pct = (n: number) =>
    totalConversations > 0 ? Math.round((n / totalConversations) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live overview of conversations, escalations, and knowledge base
            coverage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/knowledge"
            className="h-9 px-3.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Library className="size-3.5 text-zinc-400" />
            <span>Add Knowledge</span>
          </Link>
          <Link
            href="/dashboard/conversion"
            className="h-9 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Inbox className="size-3.5" />
            <span>Open Inbox</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Conversations</span>
            <MessageSquare className="size-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 tabular-nums">
            {totalConversations}
          </div>
          <div className="text-[11px] text-zinc-500">
            {totalMessages} total messages recorded
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Escalated Chats</span>
            <AlertTriangle
              className={`size-4 ${
                escalatedCount > 0 ? "text-amber-400" : "text-zinc-500"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums ${
              escalatedCount > 0 ? "text-amber-400" : "text-zinc-100"
            }`}
          >
            {escalatedCount}
          </div>
          <div className="text-[11px] text-zinc-500">
            {escalatedCount > 0
              ? "Waiting for human operator"
              : "No pending escalations"}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Resolution Rate</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 tabular-nums">
            {resolutionRate}%
          </div>
          <div className="text-[11px] text-zinc-500">
            {resolvedCount} of {totalConversations} conversations resolved
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Knowledge Indexed</span>
            <Library className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-zinc-100 tabular-nums">
            {totalChunks}
          </div>
          <div className="text-[11px] text-zinc-500">
            chunks across {readySources} ready / {totalSources} sources
          </div>
        </div>
      </div>

      {/* Lower Split: Escalated Queue + Breakdown & Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Escalated Conversations Needing Attention */}
        <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-[#09090b] flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Needs Attention
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Escalated conversations waiting for an operator reply
              </p>
            </div>
            <Link
              href="/dashboard/conversion"
              className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/70 flex-1">
            {escalatedSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                All caught up. No escalated conversations right now.
              </div>
            ) : (
              escalatedSessions.slice(0, 6).map((sess) => (
                <Link
                  key={sess.id}
                  href="/dashboard/conversion"
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-xs font-medium text-zinc-100 truncate">
                        {sess.visitorName}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5 pl-4">
                      {sess.visitorEmail}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                      Escalated
                    </span>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {formatShortDate(sess.lastActiveAt)}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Status Breakdown & Workspace Readiness */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-100">
              Conversation Status Breakdown
            </h2>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span>Resolved</span>
                  <span className="font-mono text-zinc-400">
                    {resolvedCount} ({pct(resolvedCount)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct(resolvedCount)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span>Escalated</span>
                  <span className="font-mono text-zinc-400">
                    {escalatedCount} ({pct(escalatedCount)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${pct(escalatedCount)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span>Unresolved</span>
                  <span className="font-mono text-zinc-400">
                    {unresolvedCount} ({pct(unresolvedCount)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${pct(unresolvedCount)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-100">
              Workspace Configuration
            </h2>

            <div className="divide-y divide-zinc-800/70 text-xs">
              <Link
                href="/dashboard/chatbot"
                className="py-2.5 flex items-center justify-between hover:text-emerald-400 transition-colors"
              >
                <span className="inline-flex items-center gap-2 text-zinc-300">
                  <Bot className="size-3.5 text-emerald-400" />
                  <span>Chatbot</span>
                </span>
                <span className="text-zinc-400">{botName}</span>
              </Link>

              <Link
                href="/dashboard/sections"
                className="py-2.5 flex items-center justify-between hover:text-emerald-400 transition-colors"
              >
                <span className="inline-flex items-center gap-2 text-zinc-300">
                  <Layers className="size-3.5 text-emerald-400" />
                  <span>Active Sections</span>
                </span>
                <span className="text-zinc-400">
                  {activeSections} / {sections.length}
                </span>
              </Link>

              <Link
                href="/dashboard/knowledge"
                className="py-2.5 flex items-center justify-between hover:text-emerald-400 transition-colors"
              >
                <span className="inline-flex items-center gap-2 text-zinc-300">
                  <Library className="size-3.5 text-emerald-400" />
                  <span>Knowledge Sources</span>
                </span>
                <span className="text-zinc-400">{totalSources}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
