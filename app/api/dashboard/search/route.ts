import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/client";
import { chatSession, knowledgeSource, section } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";

export async function GET(req: Request) {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  if (!q) {
    return NextResponse.json({ conversations: [], knowledge: [], sections: [] });
  }

  const pattern = `%${q}%`;

  const [conversations, knowledge, sections] = await Promise.all([
    db
      .select({
        id: chatSession.id,
        visitorName: chatSession.visitorName,
        visitorEmail: chatSession.visitorEmail,
        status: chatSession.status,
      })
      .from(chatSession)
      .where(
        and(
          eq(chatSession.organizationId, ctx.orgId),
          or(
            ilike(chatSession.visitorName, pattern),
            ilike(chatSession.visitorEmail, pattern)
          )
        )
      )
      .orderBy(desc(chatSession.lastActiveAt))
      .limit(5),
    db
      .select({
        id: knowledgeSource.id,
        title: knowledgeSource.name,
        sourceType: knowledgeSource.type,
      })
      .from(knowledgeSource)
      .where(
        and(
          eq(knowledgeSource.organizationId, ctx.orgId),
          or(
            ilike(knowledgeSource.name, pattern),
            ilike(knowledgeSource.sourceUrl, pattern)
          )
        )
      )
      .orderBy(desc(knowledgeSource.createdAt))
      .limit(5),
    db
      .select({
        id: section.id,
        name: section.name,
        tone: section.tone,
      })
      .from(section)
      .where(
        and(
          eq(section.organizationId, ctx.orgId),
          or(
            ilike(section.name, pattern),
            ilike(section.description, pattern)
          )
        )
      )
      .limit(5),
  ]);

  return NextResponse.json({ conversations, knowledge, sections });
}
