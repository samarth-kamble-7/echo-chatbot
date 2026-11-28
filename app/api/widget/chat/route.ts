import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import {
  chatMessage,
  chatSession,
  chatbotSettings,
  section,
  sectionKnowledgeSource,
} from "@/db/schema";
import { retrieveRelevantChunks } from "@/lib/knowledge/retrieve";
import { generateGroundedAnswer, isGeminiConfigured } from "@/lib/ai/gemini";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      orgId?: string;
      question?: string;
      sessionToken?: string;
    };
    const orgId = body.orgId?.trim();
    const question = body.question?.trim();
    const sessionToken = body.sessionToken?.trim();

    if (!orgId || !question || !sessionToken) {
      return NextResponse.json(
        { error: "Missing orgId, question, or sessionToken" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const [session] = await db
      .select()
      .from(chatSession)
      .where(
        and(
          eq(chatSession.organizationId, orgId),
          eq(chatSession.sessionToken, sessionToken)
        )
      )
      .limit(1);

    const nowMs = Date.now();
    if (
      !session ||
      Number.isNaN(new Date(session.expiresAt).getTime()) ||
      new Date(session.expiresAt).getTime() <= nowMs
    ) {
      return NextResponse.json(
        {
          error:
            "Your 24-hour session has expired. Please enter your name and email to continue.",
          expired: true,
        },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 1. Resolved conversations cannot accept new messages
    if (session.status === "resolved") {
      return NextResponse.json(
        {
          error:
            "This conversation has been resolved. Please start a new chat if you need more help.",
          status: "resolved",
          resolved: true,
        },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    const userMsgTime = new Date(nowMs).toISOString();
    const nextExpiresAt = new Date(nowMs + SESSION_DURATION_MS).toISOString();

    // 2. Escalated conversations pause AI completely — only save visitor message for human operator
    if (session.status === "escalated") {
      await Promise.all([
        db.insert(chatMessage).values({
          id: crypto.randomUUID(),
          sessionId: session.id,
          organizationId: orgId,
          role: "user",
          content: question,
          createdAt: userMsgTime,
        }),
        db
          .update(chatSession)
          .set({
            lastActiveAt: userMsgTime,
            expiresAt: nextExpiresAt,
          })
          .where(eq(chatSession.id, session.id)),
      ]);

      return NextResponse.json(
        {
          answer: null,
          status: "escalated",
          aiPaused: true,
          expiresAt: nextExpiresAt,
        },
        { headers: CORS_HEADERS }
      );
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "Assistant is currently unavailable." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const [botRows, retrieved, recentRows, activeSections, sectionLinks] =
      await Promise.all([
        db
          .select({
            botName: chatbotSettings.botName,
            systemPrompt: chatbotSettings.systemPrompt,
            supportEmail: chatbotSettings.supportEmail,
          })
          .from(chatbotSettings)
          .where(eq(chatbotSettings.organizationId, orgId))
          .limit(1),
        retrieveRelevantChunks({
          orgId,
          query: question,
          limit: 4,
        }),
        db
          .select({
            role: chatMessage.role,
            content: chatMessage.content,
          })
          .from(chatMessage)
          .where(eq(chatMessage.sessionId, session.id))
          .orderBy(desc(chatMessage.createdAt))
          .limit(8),
        db
          .select()
          .from(section)
          .where(
            and(eq(section.organizationId, orgId), eq(section.isActive, true))
          ),
        db
          .select({
            sectionId: sectionKnowledgeSource.sectionId,
            sourceId: sectionKnowledgeSource.sourceId,
          })
          .from(sectionKnowledgeSource)
          .where(eq(sectionKnowledgeSource.organizationId, orgId)),
      ]);

    // Match best active section based on retrieved source links + topic/name overlap
    const retrievedSourceIds = new Set(retrieved.chunks.map((c) => c.sourceId));
    const qLower = question.toLowerCase();
    let matchedSection: (typeof activeSections)[number] | undefined;
    let bestSectionScore = 0;

    for (const sec of activeSections) {
      let score = 0;
      const linkedSources = sectionLinks.filter((l) => l.sectionId === sec.id);
      for (const link of linkedSources) {
        if (retrievedSourceIds.has(link.sourceId)) score += 3;
      }
      if (qLower.includes(sec.name.toLowerCase())) score += 2;
      for (const topic of [...sec.allowedTopics, ...sec.blockedTopics]) {
        if (topic && qLower.includes(topic.toLowerCase())) score += 2;
      }
      if (score > bestSectionScore) {
        bestSectionScore = score;
        matchedSection = sec;
      }
    }

    const bot = botRows[0];
    const fallbackNote = bot?.supportEmail
      ? ` If the documentation does not cover the question, escalate to human support or mention ${bot.supportEmail}.`
      : "";

    const history = recentRows.reverse().map((m) => ({
      role: (m.role === "user"
        ? "user"
        : m.role === "operator"
        ? "operator"
        : "assistant") as "user" | "assistant" | "operator",
      content: m.content,
    }));

    const { answer, action } = await generateGroundedAnswer({
      question,
      history,
      sectionConfig: matchedSection
        ? {
            name: matchedSection.name,
            tone: matchedSection.tone,
            instructions: matchedSection.instructions,
            allowedTopics: matchedSection.allowedTopics,
            blockedTopics: matchedSection.blockedTopics,
          }
        : undefined,
      contexts: retrieved.chunks.map((c) => ({
        title: c.title,
        sourceUrl: c.sourceUrl,
        content: c.content,
        similarity: c.similarity ?? undefined,
      })),
      botIdentity: {
        botName: bot?.botName || "Echo Support",
        systemPrompt: [bot?.systemPrompt, fallbackNote]
          .filter(Boolean)
          .join("\n"),
      },
    });

    const nextStatus =
      action === "escalate"
        ? "escalated"
        : action === "resolve"
        ? "resolved"
        : "unresolved";

    const botMsgTime = new Date(nowMs + 1).toISOString();

    await Promise.all([
      db.insert(chatMessage).values([
        {
          id: crypto.randomUUID(),
          sessionId: session.id,
          organizationId: orgId,
          role: "user",
          content: question,
          createdAt: userMsgTime,
        },
        {
          id: crypto.randomUUID(),
          sessionId: session.id,
          organizationId: orgId,
          role: "assistant",
          content: answer,
          createdAt: botMsgTime,
        },
      ]),
      db
        .update(chatSession)
        .set({
          status: nextStatus,
          lastActiveAt: userMsgTime,
          expiresAt: nextExpiresAt,
        })
        .where(eq(chatSession.id, session.id)),
    ]);

    return NextResponse.json(
      {
        answer,
        status: nextStatus,
        ...(action === "escalate" ? { aiPaused: true } : {}),
        expiresAt: nextExpiresAt,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Widget chat error:", err);
    return NextResponse.json(
      { error: "Unable to process your question right now." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
