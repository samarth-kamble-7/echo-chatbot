"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatbotSettings, section, sectionKnowledgeSource } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import { retrieveRelevantChunks } from "@/lib/knowledge/retrieve";
import {
  generateGroundedAnswer,
  isGeminiConfigured,
  type SectionPromptConfig,
} from "@/lib/ai/gemini";

export interface ChatCitation {
  id: string;
  title: string;
  sourceUrl: string | null;
  chunkIndex: number;
  similarity: number | null;
  snippet: string;
}

export type ChatActionResult =
  | {
      success: true;
      data: {
        answer: string;
        citations: ChatCitation[];
        retrievalMode: "vector" | "keyword";
        model: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function askWorkspaceBot(
  question: string,
  sectionId?: string
): Promise<ChatActionResult> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return { success: false, error: "Please enter a question." };
  }

  if (!isGeminiConfigured()) {
    return {
      success: false,
      error: "Assistant is not configured yet. Please check your API settings.",
    };
  }

  try {
    // Run bot settings, optional section lookup, and linked sources in parallel
    const [botRows, sectionRows, linkRows] = await Promise.all([
      db
        .select({
          botName: chatbotSettings.botName,
          systemPrompt: chatbotSettings.systemPrompt,
        })
        .from(chatbotSettings)
        .where(eq(chatbotSettings.organizationId, ctx.orgId))
        .limit(1),
      sectionId
        ? db
            .select()
            .from(section)
            .where(
              and(
                eq(section.id, sectionId),
                eq(section.organizationId, ctx.orgId)
              )
            )
            .limit(1)
        : Promise.resolve([]),
      sectionId
        ? db
            .select({ sourceId: sectionKnowledgeSource.sourceId })
            .from(sectionKnowledgeSource)
            .where(
              and(
                eq(sectionKnowledgeSource.sectionId, sectionId),
                eq(sectionKnowledgeSource.organizationId, ctx.orgId)
              )
            )
        : Promise.resolve([]),
    ]);

    let sourceIds: string[] | undefined;
    let sectionConfig: SectionPromptConfig | undefined;

    if (sectionId) {
      const sec = sectionRows[0];
      if (!sec) {
        return { success: false, error: "Selected section was not found." };
      }
      if (!sec.isActive) {
        return {
          success: false,
          error: `Section "${sec.name}" is currently paused.`,
        };
      }

      sourceIds = linkRows.map((l) => l.sourceId);
      sectionConfig = {
        name: sec.name,
        tone: sec.tone,
        instructions: sec.instructions,
        allowedTopics: sec.allowedTopics || [],
        blockedTopics: sec.blockedTopics || [],
      };
    }

    const { chunks, mode } = await retrieveRelevantChunks({
      orgId: ctx.orgId,
      query: trimmed,
      limit: 4,
      sourceIds,
    });

    const citations: ChatCitation[] = chunks.map((c) => ({
      id: c.id,
      title: c.title,
      sourceUrl: c.sourceUrl,
      chunkIndex: c.chunkIndex,
      similarity: c.similarity,
      snippet: c.content.slice(0, 220) + (c.content.length > 220 ? "..." : ""),
    }));

    const botRow = botRows[0];
    const { answer, model } = await generateGroundedAnswer({
      question: trimmed,
      contexts: chunks.map((c) => ({
        title: c.title,
        sourceUrl: c.sourceUrl,
        content: c.content,
        similarity: c.similarity ?? undefined,
      })),
      sectionConfig,
      botIdentity: botRow
        ? { botName: botRow.botName, systemPrompt: botRow.systemPrompt }
        : undefined,
    });

    return {
      success: true,
      data: {
        answer,
        citations,
        retrievalMode: mode,
        model,
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate answer.";
    return { success: false, error: message };
  }
}
