import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatbotSettings } from "@/db/schema";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org")?.trim();

  if (!orgId) {
    return NextResponse.json(
      { error: "Missing org parameter" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const [row] = await db
      .select({
        botName: chatbotSettings.botName,
        subtitle: chatbotSettings.subtitle,
        welcomeMessage: chatbotSettings.welcomeMessage,
        inputPlaceholder: chatbotSettings.inputPlaceholder,
        primaryColor: chatbotSettings.primaryColor,
        theme: chatbotSettings.theme,
        position: chatbotSettings.position,
        launcherIcon: chatbotSettings.launcherIcon,
        launcherStyle: chatbotSettings.launcherStyle,
        launcherText: chatbotSettings.launcherText,
        suggestedQuestions: chatbotSettings.suggestedQuestions,
        supportEmail: chatbotSettings.supportEmail,
      })
      .from(chatbotSettings)
      .where(eq(chatbotSettings.organizationId, orgId))
      .limit(1);

    return NextResponse.json(
      {
        config: row || {
          botName: "Echo Support",
          subtitle: "Online",
          welcomeMessage: "Hi! Ask me anything about our documentation.",
          inputPlaceholder: "Ask a question...",
          primaryColor: "#10b981",
          theme: "dark",
          position: "bottom-right",
          launcherIcon: "message",
          launcherStyle: "icon",
          launcherText: "Chat with us",
          suggestedQuestions: [],
          supportEmail: null,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Widget config error:", err);
    return NextResponse.json(
      { error: "Failed to load widget config" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
