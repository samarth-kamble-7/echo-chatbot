"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import {
  chatMessage,
  chatSession,
  type ChatMessageRow,
  type ChatSession,
} from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import type { ActionResult } from "@/lib/actions/knowledge";

export type ConversationStatus = "unresolved" | "escalated" | "resolved";

export interface ConversationSummary extends ChatSession {
  messageCount: number;
  lastMessage: string | null;
  isExpired: boolean;
}

const VALID_STATUSES = new Set<ConversationStatus>([
  "unresolved",
  "escalated",
  "resolved",
]);

export async function getConversations(): Promise<
  ActionResult<ConversationSummary[]>
> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const sessions = await db
      .select()
      .from(chatSession)
      .where(eq(chatSession.organizationId, ctx.orgId))
      .orderBy(desc(chatSession.lastActiveAt));

    if (sessions.length === 0) {
      return { success: true, data: [] };
    }

    const counts = await db
      .select({
        sessionId: chatMessage.sessionId,
        count: sql<number>`count(*)::int`,
      })
      .from(chatMessage)
      .where(eq(chatMessage.organizationId, ctx.orgId))
      .groupBy(chatMessage.sessionId);

    const recentMsgs = await db
      .select({
        sessionId: chatMessage.sessionId,
        content: chatMessage.content,
      })
      .from(chatMessage)
      .where(eq(chatMessage.organizationId, ctx.orgId))
      .orderBy(desc(chatMessage.createdAt));

    const countMap = new Map<string, number>();
    for (const c of counts) {
      countMap.set(c.sessionId, c.count);
    }

    const lastMsgMap = new Map<string, string>();
    for (const m of recentMsgs) {
      if (!lastMsgMap.has(m.sessionId)) {
        lastMsgMap.set(m.sessionId, m.content);
      }
    }

    const nowMs = Date.now();
    const result: ConversationSummary[] = sessions.map((s) => ({
      ...s,
      messageCount: countMap.get(s.id) || 0,
      lastMessage: lastMsgMap.get(s.id) || null,
      isExpired: new Date(s.expiresAt).getTime() <= nowMs,
    }));

    return { success: true, data: result };
  } catch (err) {
    console.error("Error loading conversations:", err);
    return { success: false, error: "Failed to load conversations" };
  }
}

export async function getConversationMessages(sessionId: string): Promise<
  ActionResult<{ session: ChatSession; messages: ChatMessageRow[] }>
> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [session] = await db
      .select()
      .from(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.organizationId, ctx.orgId)
        )
      )
      .limit(1);

    if (!session) {
      return { success: false, error: "Conversation not found" };
    }

    const messages = await db
      .select()
      .from(chatMessage)
      .where(
        and(
          eq(chatMessage.sessionId, sessionId),
          eq(chatMessage.organizationId, ctx.orgId)
        )
      )
      .orderBy(asc(chatMessage.createdAt));

    return { success: true, data: { session, messages } };
  } catch (err) {
    console.error("Error loading conversation messages:", err);
    return { success: false, error: "Failed to load messages" };
  }
}

export async function updateConversationStatus(
  sessionId: string,
  status: ConversationStatus
): Promise<ActionResult<ChatSession>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  if (!VALID_STATUSES.has(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    const [updated] = await db
      .update(chatSession)
      .set({ status })
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.organizationId, ctx.orgId)
        )
      )
      .returning();

    if (!updated) {
      return { success: false, error: "Conversation not found" };
    }

    revalidatePath("/dashboard/conversion");
    return { success: true, data: updated };
  } catch (err) {
    console.error("Error updating conversation status:", err);
    return { success: false, error: "Failed to update status" };
  }
}

export async function sendOperatorReply(
  sessionId: string,
  content: string
): Promise<ActionResult<ChatMessageRow>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "Reply cannot be empty" };
  }

  try {
    const [session] = await db
      .select({ id: chatSession.id })
      .from(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.organizationId, ctx.orgId)
        )
      )
      .limit(1);

    if (!session) {
      return { success: false, error: "Conversation not found" };
    }

    const now = new Date().toISOString();
    const [created] = await db
      .insert(chatMessage)
      .values({
        id: crypto.randomUUID(),
        sessionId,
        organizationId: ctx.orgId,
        role: "operator",
        content: trimmed,
        createdAt: now,
      })
      .returning();

    await db
      .update(chatSession)
      .set({ lastActiveAt: now })
      .where(eq(chatSession.id, sessionId));

    revalidatePath("/dashboard/conversion");
    return { success: true, data: created };
  } catch (err) {
    console.error("Error sending operator reply:", err);
    return { success: false, error: "Failed to send reply" };
  }
}

export async function deleteConversation(
  sessionId: string
): Promise<ActionResult<{ deletedId: string }>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deleted = await db
      .delete(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.organizationId, ctx.orgId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return { success: false, error: "Conversation not found" };
    }

    revalidatePath("/dashboard/conversion");
    return { success: true, data: { deletedId: sessionId } };
  } catch (err) {
    console.error("Error deleting conversation:", err);
    return { success: false, error: "Failed to delete conversation" };
  }
}
