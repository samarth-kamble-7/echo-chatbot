import { and, cosineDistance, desc, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { knowledgeChunk, knowledgeSource } from "@/db/schema";
import { generateEmbedding, isGeminiConfigured } from "@/lib/ai/gemini";

export interface RetrievedChunk {
  id: string;
  sourceId: string;
  title: string;
  sourceUrl: string | null;
  content: string;
  chunkIndex: number;
  similarity: number | null;
}

/**
 * Retrieves the most relevant documentation chunks for an organization.
 * Uses pgvector cosine similarity when Gemini embeddings are configured,
 * and falls back to keyword matching if embeddings are not available.
 */
export async function retrieveRelevantChunks(params: {
  orgId: string;
  query: string;
  limit?: number;
  sourceIds?: string[];
}): Promise<{ chunks: RetrievedChunk[]; mode: "vector" | "keyword" }> {
  const limit = params.limit ?? 5;
  const trimmedQuery = params.query.trim();
  if (!trimmedQuery) {
    return { chunks: [], mode: "keyword" };
  }

  if (params.sourceIds && params.sourceIds.length === 0) {
    return { chunks: [], mode: "keyword" };
  }

  const sourceFilter =
    params.sourceIds && params.sourceIds.length > 0
      ? inArray(knowledgeChunk.sourceId, params.sourceIds)
      : undefined;

  if (isGeminiConfigured()) {
    try {
      const queryEmbedding = await generateEmbedding(trimmedQuery);
      if (queryEmbedding) {
        const similarity = sql<number>`1 - (${cosineDistance(
          knowledgeChunk.embedding,
          queryEmbedding
        )})`;

        const vectorRows = await db
          .select({
            id: knowledgeChunk.id,
            sourceId: knowledgeChunk.sourceId,
            title: knowledgeSource.name,
            sourceUrl: knowledgeSource.sourceUrl,
            content: knowledgeChunk.content,
            chunkIndex: knowledgeChunk.chunkIndex,
            similarity,
          })
          .from(knowledgeChunk)
          .innerJoin(
            knowledgeSource,
            eq(knowledgeChunk.sourceId, knowledgeSource.id)
          )
          .where(
            and(
              eq(knowledgeChunk.organizationId, params.orgId),
              eq(knowledgeSource.status, "ready"),
              isNotNull(knowledgeChunk.embedding),
              sourceFilter
            )
          )
          .orderBy(desc(similarity))
          .limit(limit);

        const filtered = vectorRows.filter(
          (row) => row.similarity === null || row.similarity >= 0.3
        );

        if (filtered.length > 0) {
          return { chunks: filtered, mode: "vector" };
        }
      }
    } catch (err) {
      console.warn("Vector retrieval failed, falling back to keyword search:", err);
    }
  }

  // Fallback keyword search across chunks
  const words = trimmedQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 5);

  const keywordCondition =
    words.length > 0
      ? or(...words.map((word) => ilike(knowledgeChunk.content, `%${word}%`)))
      : ilike(knowledgeChunk.content, `%${trimmedQuery}%`);

  const keywordRows = await db
    .select({
      id: knowledgeChunk.id,
      sourceId: knowledgeChunk.sourceId,
      title: knowledgeSource.name,
      sourceUrl: knowledgeSource.sourceUrl,
      content: knowledgeChunk.content,
      chunkIndex: knowledgeChunk.chunkIndex,
    })
    .from(knowledgeChunk)
    .innerJoin(knowledgeSource, eq(knowledgeChunk.sourceId, knowledgeSource.id))
    .where(
      and(
        eq(knowledgeChunk.organizationId, params.orgId),
        eq(knowledgeSource.status, "ready"),
        keywordCondition,
        sourceFilter
      )
    )
    .limit(limit);

  return {
    chunks: keywordRows.map((r) => ({ ...r, similarity: null })),
    mode: "keyword",
  };
}
