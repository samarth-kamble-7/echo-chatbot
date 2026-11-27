"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { section, sectionKnowledgeSource } from "@/db/schema";
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

  try {
    let sourceIds: string[] | undefined;
    let sectionConfig: SectionPromptConfig | undefined;

    if (sectionId) {
      const [sec] = await db
        .select()
        .from(section)
        .where(
          and(
            eq(section.id, sectionId),
            eq(section.organizationId, ctx.orgId)
          )
        )
        .limit(1);

      if (!sec) {
        return { success: false, error: "Selected section was not found." };
      }

      if (!sec.isActive) {
        return {
          success: false,
          error: `Section "${sec.name}" is currently paused.`,
        };
      }

      const links = await db
        .select({ sourceId: sectionKnowledgeSource.sourceId })
        .from(sectionKnowledgeSource)
        .where(
          and(
            eq(sectionKnowledgeSource.sectionId, sectionId),
            eq(sectionKnowledgeSource.organizationId, ctx.orgId)
          )
        );

      sourceIds = links.map((l) => l.sourceId);
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
      limit: 5,
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

    if (!isGeminiConfigured()) {
      if (chunks.length === 0) {
        return {
          success: true,
          data: {
            answer:
              "No matching documentation chunks were found. Add GEMINI_API_KEY to .env for vector search and AI-generated answers.",
            citations: [],
            retrievalMode: mode,
            model: "keyword-only",
          },
        };
      }

      return {
        success: true,
        data: {
          answer: `GEMINI_API_KEY is not configured yet, so AI generation is disabled. Found ${chunks.length} matching documentation ${
            chunks.length === 1 ? "chunk" : "chunks"
          } via keyword search (see citations below).`,
          citations,
          retrievalMode: mode,
          model: "keyword-only",
        },
      };
    }

    const { answer, model } = await generateGroundedAnswer({
      question: trimmed,
      contexts: chunks.map((c) => ({
        title: c.title,
        sourceUrl: c.sourceUrl,
        content: c.content,
        similarity: c.similarity ?? undefined,
      })),
      sectionConfig,
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
