import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatbotSettings } from "@/db/schema";
import { retrieveRelevantChunks } from "@/lib/knowledge/retrieve";
import { generateGroundedAnswer, isGeminiConfigured } from "@/lib/ai/gemini";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "Assistant is currently unavailable." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  try {
    const body = (await req.json()) as { orgId?: string; question?: string };
    const orgId = body.orgId?.trim();
    const question = body.question?.trim();

    if (!orgId || !question) {
      return NextResponse.json(
        { error: "Missing orgId or question" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const [botRows, retrieved] = await Promise.all([
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
    ]);

    const bot = botRows[0];
    const fallbackNote = bot?.supportEmail
      ? ` If the documentation does not cover the question, direct the user to ${bot.supportEmail}.`
      : "";

    const { answer } = await generateGroundedAnswer({
      question,
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

    return NextResponse.json({ answer }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Widget chat error:", err);
    return NextResponse.json(
      { error: "Unable to process your question right now." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
