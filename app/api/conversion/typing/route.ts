import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatSession } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";

export async function POST(req: Request) {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      sessionId?: string;
      typing?: boolean;
    };
    const sessionId = body.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const [session] = await db
      .select({ id: chatSession.id, metadata: chatSession.metadata })
      .from(chatSession)
      .where(
        and(
          eq(chatSession.id, sessionId),
          eq(chatSession.organizationId, ctx.orgId)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextMetadata = {
      ...(session.metadata || {}),
      operatorTypingUntil: body.typing ? Date.now() + 4000 : 0,
    };

    await db
      .update(chatSession)
      .set({ metadata: nextMetadata })
      .where(eq(chatSession.id, session.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Typing indicator update failed:", err);
    return NextResponse.json(
      { error: "Failed to update typing state" },
      { status: 500 }
    );
  }
}
