"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import {
  knowledgeSource,
  section,
  sectionKnowledgeSource,
  type Section,
} from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import type { ActionResult } from "@/lib/actions/knowledge";

export interface SectionSourceSummary {
  id: string;
  name: string;
  type: string;
}

export interface SectionWithSources extends Section {
  sourceIds: string[];
  sources: SectionSourceSummary[];
}

export interface SectionInput {
  name: string;
  description?: string;
  tone?: string;
  instructions?: string;
  allowedTopics?: string[];
  blockedTopics?: string[];
  isActive?: boolean;
  sourceIds?: string[];
}

const VALID_TONES = new Set([
  "professional",
  "friendly",
  "concise",
  "technical",
]);

function normalizeTopics(topics?: string[]): string[] {
  if (!Array.isArray(topics)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const t of topics) {
    const val = String(t).trim();
    if (val && !seen.has(val.toLowerCase())) {
      seen.add(val.toLowerCase());
      cleaned.push(val);
    }
  }
  return cleaned;
}

async function filterValidOrgSourceIds(
  orgId: string,
  sourceIds?: string[]
): Promise<string[]> {
  if (!sourceIds || sourceIds.length === 0) return [];
  const uniqueIds = Array.from(new Set(sourceIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const rows = await db
    .select({ id: knowledgeSource.id })
    .from(knowledgeSource)
    .where(
      and(
        eq(knowledgeSource.organizationId, orgId),
        inArray(knowledgeSource.id, uniqueIds)
      )
    );

  return rows.map((r) => r.id);
}

async function attachSourcesToSections(
  orgId: string,
  sections: Section[]
): Promise<SectionWithSources[]> {
  if (sections.length === 0) return [];

  const links = await db
    .select({
      sectionId: sectionKnowledgeSource.sectionId,
      sourceId: knowledgeSource.id,
      name: knowledgeSource.name,
      type: knowledgeSource.type,
    })
    .from(sectionKnowledgeSource)
    .innerJoin(
      knowledgeSource,
      eq(sectionKnowledgeSource.sourceId, knowledgeSource.id)
    )
    .where(eq(sectionKnowledgeSource.organizationId, orgId));

  const map = new Map<string, SectionSourceSummary[]>();
  for (const link of links) {
    const existing = map.get(link.sectionId) || [];
    existing.push({ id: link.sourceId, name: link.name, type: link.type });
    map.set(link.sectionId, existing);
  }

  return sections.map((sec) => {
    const linked = map.get(sec.id) || [];
    return {
      ...sec,
      sourceIds: linked.map((s) => s.id),
      sources: linked,
    };
  });
}

export async function getSectionsWithSources(): Promise<
  ActionResult<SectionWithSources[]>
> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const rows = await db
      .select()
      .from(section)
      .where(eq(section.organizationId, ctx.orgId))
      .orderBy(desc(section.createdAt));

    const enriched = await attachSourcesToSections(ctx.orgId, rows);
    return { success: true, data: enriched };
  } catch (err) {
    console.error("Error fetching sections:", err);
    return { success: false, error: "Failed to load sections" };
  }
}

export async function createSection(
  input: SectionInput
): Promise<ActionResult<SectionWithSources>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const name = input.name?.trim();
  if (!name) {
    return { success: false, error: "Section name is required" };
  }

  const tone =
    input.tone && VALID_TONES.has(input.tone) ? input.tone : "professional";
  const allowedTopics = normalizeTopics(input.allowedTopics);
  const blockedTopics = normalizeTopics(input.blockedTopics);
  const validSourceIds = await filterValidOrgSourceIds(
    ctx.orgId,
    input.sourceIds
  );

  const sectionId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const [created] = await db
      .insert(section)
      .values({
        id: sectionId,
        organizationId: ctx.orgId,
        name,
        description: input.description?.trim() || null,
        tone,
        instructions: input.instructions?.trim() || null,
        allowedTopics,
        blockedTopics,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (validSourceIds.length > 0) {
      await db.insert(sectionKnowledgeSource).values(
        validSourceIds.map((sourceId) => ({
          id: crypto.randomUUID(),
          sectionId,
          sourceId,
          organizationId: ctx.orgId,
          createdAt: now,
        }))
      );
    }

    const [enriched] = await attachSourcesToSections(ctx.orgId, [created]);
    revalidatePath("/dashboard/sections");
    revalidatePath("/dashboard/chatbot");
    return { success: true, data: enriched };
  } catch (err) {
    console.error("Error creating section:", err);
    return { success: false, error: "Failed to create section" };
  }
}

export async function updateSection(
  sectionId: string,
  input: SectionInput
): Promise<ActionResult<SectionWithSources>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const name = input.name?.trim();
  if (!name) {
    return { success: false, error: "Section name is required" };
  }

  const tone =
    input.tone && VALID_TONES.has(input.tone) ? input.tone : "professional";
  const allowedTopics = normalizeTopics(input.allowedTopics);
  const blockedTopics = normalizeTopics(input.blockedTopics);
  const validSourceIds = await filterValidOrgSourceIds(
    ctx.orgId,
    input.sourceIds
  );
  const now = new Date().toISOString();

  try {
    const [updated] = await db
      .update(section)
      .set({
        name,
        description: input.description?.trim() || null,
        tone,
        instructions: input.instructions?.trim() || null,
        allowedTopics,
        blockedTopics,
        isActive: input.isActive ?? true,
        updatedAt: now,
      })
      .where(
        and(eq(section.id, sectionId), eq(section.organizationId, ctx.orgId))
      )
      .returning();

    if (!updated) {
      return { success: false, error: "Section not found" };
    }

    await db
      .delete(sectionKnowledgeSource)
      .where(
        and(
          eq(sectionKnowledgeSource.sectionId, sectionId),
          eq(sectionKnowledgeSource.organizationId, ctx.orgId)
        )
      );

    if (validSourceIds.length > 0) {
      await db.insert(sectionKnowledgeSource).values(
        validSourceIds.map((sourceId) => ({
          id: crypto.randomUUID(),
          sectionId,
          sourceId,
          organizationId: ctx.orgId,
          createdAt: now,
        }))
      );
    }

    const [enriched] = await attachSourcesToSections(ctx.orgId, [updated]);
    revalidatePath("/dashboard/sections");
    revalidatePath("/dashboard/chatbot");
    return { success: true, data: enriched };
  } catch (err) {
    console.error("Error updating section:", err);
    return { success: false, error: "Failed to update section" };
  }
}

export async function deleteSection(
  sectionId: string
): Promise<ActionResult<{ deletedId: string }>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deleted = await db
      .delete(section)
      .where(
        and(eq(section.id, sectionId), eq(section.organizationId, ctx.orgId))
      )
      .returning();

    if (deleted.length === 0) {
      return { success: false, error: "Section not found" };
    }

    revalidatePath("/dashboard/sections");
    revalidatePath("/dashboard/chatbot");
    return { success: true, data: { deletedId: sectionId } };
  } catch (err) {
    console.error("Error deleting section:", err);
    return { success: false, error: "Failed to delete section" };
  }
}
