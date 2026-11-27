"use server";

import { getActiveOrgContext } from "@/lib/knowledge/org";
import { retrieveRelevantChunks } from "@/lib/knowledge/retrieve";
import { generateGroundedAnswer, isGeminiConfigured } from "@/lib/ai/gemini";

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
  question: string
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
    const { chunks, mode } = await retrieveRelevantChunks({
      orgId: ctx.orgId,
      query: trimmed,
      limit: 5,
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
