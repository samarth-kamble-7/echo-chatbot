"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import {
  knowledgeChunk,
  knowledgeSource,
  type KnowledgeChunk,
  type KnowledgeSource,
} from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import { chunkText } from "@/lib/knowledge/chunker";
import { fetchAndExtractUrl } from "@/lib/knowledge/extractor";
import { extractTextFromPdf } from "@/lib/knowledge/pdf";
import {
  deleteFileFromImageKit,
  uploadFileToImageKit,
} from "@/lib/storage/imagekit";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

async function saveSourceAndChunks(params: {
  orgId: string;
  name: string;
  type: "url" | "file" | "text";
  sourceUrl: string | null;
  fileId?: string | null;
  text: string;
}): Promise<ActionResult<KnowledgeSource>> {
  const chunks = chunkText(params.text);
  if (chunks.length === 0) {
    return {
      success: false,
      error: "No readable text content found to index.",
    };
  }

  const sourceId = crypto.randomUUID();
  const now = new Date().toISOString();

  const [created] = await db
    .insert(knowledgeSource)
    .values({
      id: sourceId,
      organizationId: params.orgId,
      name: params.name,
      type: params.type,
      sourceUrl: params.sourceUrl,
      fileId: params.fileId ?? null,
      status: "ready",
      chunkCount: chunks.length,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(knowledgeChunk).values(
    chunks.map((c) => ({
      id: crypto.randomUUID(),
      sourceId,
      organizationId: params.orgId,
      chunkIndex: c.chunkIndex,
      content: c.content,
      tokenCount: c.tokenCount,
      metadata: {
        title: params.name,
        sourceUrl: params.sourceUrl || undefined,
      },
      createdAt: now,
    }))
  );

  revalidatePath("/dashboard/knowledge");
  return { success: true, data: created };
}

export async function getKnowledgeSources(): Promise<
  ActionResult<KnowledgeSource[]>
> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const sources = await db
      .select()
      .from(knowledgeSource)
      .where(eq(knowledgeSource.organizationId, ctx.orgId))
      .orderBy(desc(knowledgeSource.createdAt));

    return { success: true, data: sources };
  } catch (err) {
    console.error("Error fetching knowledge sources:", err);
    return { success: false, error: "Failed to load knowledge sources" };
  }
}

export async function getKnowledgeSourceWithChunks(sourceId: string): Promise<
  ActionResult<{ source: KnowledgeSource; chunks: KnowledgeChunk[] }>
> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [source] = await db
      .select()
      .from(knowledgeSource)
      .where(
        and(
          eq(knowledgeSource.id, sourceId),
          eq(knowledgeSource.organizationId, ctx.orgId)
        )
      )
      .limit(1);

    if (!source) {
      return { success: false, error: "Knowledge source not found" };
    }

    const chunks = await db
      .select()
      .from(knowledgeChunk)
      .where(
        and(
          eq(knowledgeChunk.sourceId, sourceId),
          eq(knowledgeChunk.organizationId, ctx.orgId)
        )
      )
      .orderBy(asc(knowledgeChunk.chunkIndex));

    return { success: true, data: { source, chunks } };
  } catch (err) {
    console.error("Error loading knowledge chunks:", err);
    return { success: false, error: "Failed to load knowledge chunks" };
  }
}

export async function createUrlKnowledgeSource(input: {
  name?: string;
  sourceUrl: string;
}): Promise<ActionResult<KnowledgeSource>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  if (!input.sourceUrl?.trim()) {
    return { success: false, error: "Please provide a valid URL" };
  }

  try {
    const extracted = await fetchAndExtractUrl(input.sourceUrl);
    const finalName = input.name?.trim() || extracted.title || extracted.finalUrl;

    return await saveSourceAndChunks({
      orgId: ctx.orgId,
      name: finalName,
      type: "url",
      sourceUrl: extracted.finalUrl,
      text: extracted.text,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch and index URL";
    return { success: false, error: message };
  }
}

export async function createTextKnowledgeSource(input: {
  name: string;
  content: string;
}): Promise<ActionResult<KnowledgeSource>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmed = input.content?.trim();
  if (!trimmed) {
    return { success: false, error: "Content cannot be empty" };
  }

  try {
    return await saveSourceAndChunks({
      orgId: ctx.orgId,
      name: input.name?.trim() || "Text Snippet",
      type: "text",
      sourceUrl: null,
      text: trimmed,
    });
  } catch (err) {
    console.error("Error saving text knowledge source:", err);
    return { success: false, error: "Failed to save knowledge source" };
  }
}

export async function createFileKnowledgeSource(
  formData: FormData
): Promise<ActionResult<KnowledgeSource>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("file");
  const customName = formData.get("name")?.toString().trim();

  if (!(file instanceof File)) {
    return { success: false, error: "No file uploaded" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File size must be under 5MB" };
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  try {
    let rawText = "";
    let storedUrl: string | null = file.name;
    let storedFileId: string | null = null;

    if (isPdf) {
      const pdfResult = await extractTextFromPdf(file);
      rawText = pdfResult.text;

      if (!rawText.trim()) {
        return {
          success: false,
          error:
            "No selectable text found in this PDF (scanned image PDFs are not supported).",
        };
      }

      const uploaded = await uploadFileToImageKit({
        file,
        fileName: file.name,
        folder: `/echo-support/${ctx.orgId}`,
      });

      if (uploaded) {
        storedUrl = uploaded.url;
        storedFileId = uploaded.fileId;
      }
    } else {
      rawText = await file.text();
      if (!rawText.trim()) {
        return { success: false, error: "Uploaded file is empty" };
      }
    }

    const result = await saveSourceAndChunks({
      orgId: ctx.orgId,
      name: customName || file.name,
      type: "file",
      sourceUrl: storedUrl,
      fileId: storedFileId,
      text: rawText,
    });

    if (!result.success && storedFileId) {
      await deleteFileFromImageKit(storedFileId);
    }

    return result;
  } catch (err: unknown) {
    console.error("Error processing uploaded file:", err);
    const message =
      err instanceof Error ? err.message : "Failed to process uploaded file";
    return { success: false, error: message };
  }
}

export async function resyncKnowledgeSource(
  sourceId: string
): Promise<ActionResult<KnowledgeSource>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const [source] = await db
    .select()
    .from(knowledgeSource)
    .where(
      and(
        eq(knowledgeSource.id, sourceId),
        eq(knowledgeSource.organizationId, ctx.orgId)
      )
    )
    .limit(1);

  if (!source) {
    return { success: false, error: "Knowledge source not found" };
  }

  if (source.type !== "url" || !source.sourceUrl) {
    return { success: false, error: "Only URL sources can be re-synced" };
  }

  const now = new Date().toISOString();

  try {
    const extracted = await fetchAndExtractUrl(source.sourceUrl);
    const chunks = chunkText(extracted.text);
    if (chunks.length === 0) {
      throw new Error("No indexable text found at this URL");
    }

    await db
      .delete(knowledgeChunk)
      .where(
        and(
          eq(knowledgeChunk.sourceId, sourceId),
          eq(knowledgeChunk.organizationId, ctx.orgId)
        )
      );

    await db.insert(knowledgeChunk).values(
      chunks.map((c) => ({
        id: crypto.randomUUID(),
        sourceId,
        organizationId: ctx.orgId,
        chunkIndex: c.chunkIndex,
        content: c.content,
        tokenCount: c.tokenCount,
        metadata: {
          title: source.name,
          sourceUrl: extracted.finalUrl,
        },
        createdAt: now,
      }))
    );

    const [updated] = await db
      .update(knowledgeSource)
      .set({
        status: "ready",
        chunkCount: chunks.length,
        errorMessage: null,
        lastSyncedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(knowledgeSource.id, sourceId),
          eq(knowledgeSource.organizationId, ctx.orgId)
        )
      )
      .returning();

    revalidatePath("/dashboard/knowledge");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to re-sync URL";

    await db
      .update(knowledgeSource)
      .set({
        status: "error",
        errorMessage: message,
        updatedAt: now,
      })
      .where(
        and(
          eq(knowledgeSource.id, sourceId),
          eq(knowledgeSource.organizationId, ctx.orgId)
        )
      );

    revalidatePath("/dashboard/knowledge");
    return { success: false, error: message };
  }
}

export async function deleteKnowledgeSource(
  sourceId: string
): Promise<ActionResult<{ deletedId: string }>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deleted = await db
      .delete(knowledgeSource)
      .where(
        and(
          eq(knowledgeSource.id, sourceId),
          eq(knowledgeSource.organizationId, ctx.orgId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return { success: false, error: "Knowledge source not found" };
    }

    if (deleted[0]?.fileId) {
      await deleteFileFromImageKit(deleted[0].fileId);
    }

    revalidatePath("/dashboard/knowledge");
    return { success: true, data: { deletedId: sourceId } };
  } catch (err) {
    console.error("Error deleting knowledge source:", err);
    return { success: false, error: "Failed to delete knowledge source" };
  }
}
