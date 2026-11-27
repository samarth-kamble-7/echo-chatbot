"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import { chatbotSettings } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import type { ActionResult } from "@/lib/actions/knowledge";

export type LauncherIconType = "message" | "bot" | "headphones" | "help";
export type LauncherStyleType = "icon" | "pill";

export interface ChatbotConfig {
  botName: string;
  subtitle: string;
  welcomeMessage: string;
  inputPlaceholder: string;
  primaryColor: string;
  theme: "dark" | "light";
  position: "bottom-right" | "bottom-left";
  launcherIcon: LauncherIconType;
  launcherStyle: LauncherStyleType;
  launcherText: string;
  suggestedQuestions: string[];
  supportEmail: string;
  systemPrompt: string;
}

const VALID_ICONS = new Set<LauncherIconType>([
  "message",
  "bot",
  "headphones",
  "help",
]);

const DEFAULT_CONFIG: ChatbotConfig = {
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
  supportEmail: "",
  systemPrompt: "",
};

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color.trim());
}

function normalizeQuestions(questions?: string[]): string[] {
  if (!Array.isArray(questions)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of questions) {
    const val = String(q).trim();
    if (val && !seen.has(val.toLowerCase())) {
      seen.add(val.toLowerCase());
      out.push(val);
    }
    if (out.length >= 4) break;
  }
  return out;
}

export async function getChatbotSettings(): Promise<
  ActionResult<{ orgId: string; config: ChatbotConfig }>
> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [row] = await db
      .select()
      .from(chatbotSettings)
      .where(eq(chatbotSettings.organizationId, ctx.orgId))
      .limit(1);

    if (!row) {
      return { success: true, data: { orgId: ctx.orgId, config: DEFAULT_CONFIG } };
    }

    const icon = VALID_ICONS.has(row.launcherIcon as LauncherIconType)
      ? (row.launcherIcon as LauncherIconType)
      : "message";

    return {
      success: true,
      data: {
        orgId: ctx.orgId,
        config: {
          botName: row.botName,
          subtitle: row.subtitle || "Online",
          welcomeMessage: row.welcomeMessage,
          inputPlaceholder: row.inputPlaceholder || "Ask a question...",
          primaryColor: row.primaryColor,
          theme: row.theme === "light" ? "light" : "dark",
          position:
            row.position === "bottom-left" ? "bottom-left" : "bottom-right",
          launcherIcon: icon,
          launcherStyle: row.launcherStyle === "pill" ? "pill" : "icon",
          launcherText: row.launcherText || "Chat with us",
          suggestedQuestions: row.suggestedQuestions || [],
          supportEmail: row.supportEmail || "",
          systemPrompt: row.systemPrompt || "",
        },
      },
    };
  } catch (err) {
    console.error("Error loading chatbot settings:", err);
    return { success: false, error: "Failed to load chatbot settings" };
  }
}

export async function saveChatbotSettings(
  input: ChatbotConfig
): Promise<ActionResult<ChatbotConfig>> {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return { success: false, error: "Unauthorized" };
  }

  const botName = input.botName?.trim();
  const subtitle = input.subtitle?.trim() || "Online";
  const welcomeMessage = input.welcomeMessage?.trim();
  const inputPlaceholder = input.inputPlaceholder?.trim() || "Ask a question...";
  const primaryColor = input.primaryColor?.trim() || "#10b981";
  const theme = input.theme === "light" ? "light" : "dark";
  const position =
    input.position === "bottom-left" ? "bottom-left" : "bottom-right";
  const launcherIcon: LauncherIconType = VALID_ICONS.has(input.launcherIcon)
    ? input.launcherIcon
    : "message";
  const launcherStyle: LauncherStyleType =
    input.launcherStyle === "pill" ? "pill" : "icon";
  const launcherText = input.launcherText?.trim() || "Chat with us";
  const suggestedQuestions = normalizeQuestions(input.suggestedQuestions);
  const supportEmail = input.supportEmail?.trim() || "";
  const systemPrompt = input.systemPrompt?.trim() || "";

  if (!botName) {
    return { success: false, error: "Bot name is required" };
  }
  if (!welcomeMessage) {
    return { success: false, error: "Welcome message is required" };
  }
  if (!isValidHexColor(primaryColor)) {
    return {
      success: false,
      error: "Primary color must be a valid 6-digit hex code (e.g. #10b981)",
    };
  }

  const now = new Date().toISOString();

  try {
    const [existing] = await db
      .select({ id: chatbotSettings.id })
      .from(chatbotSettings)
      .where(eq(chatbotSettings.organizationId, ctx.orgId))
      .limit(1);

    const payload = {
      botName,
      subtitle,
      welcomeMessage,
      inputPlaceholder,
      primaryColor,
      theme,
      position,
      launcherIcon,
      launcherStyle,
      launcherText,
      suggestedQuestions,
      supportEmail: supportEmail || null,
      systemPrompt: systemPrompt || null,
      updatedAt: now,
    };

    if (existing) {
      await db
        .update(chatbotSettings)
        .set(payload)
        .where(eq(chatbotSettings.organizationId, ctx.orgId));
    } else {
      await db.insert(chatbotSettings).values({
        id: crypto.randomUUID(),
        organizationId: ctx.orgId,
        ...payload,
        createdAt: now,
      });
    }

    revalidatePath("/dashboard/chatbot");
    return {
      success: true,
      data: {
        botName,
        subtitle,
        welcomeMessage,
        inputPlaceholder,
        primaryColor,
        theme,
        position,
        launcherIcon,
        launcherStyle,
        launcherText,
        suggestedQuestions,
        supportEmail,
        systemPrompt,
      },
    };
  } catch (err) {
    console.error("Error saving chatbot settings:", err);
    return { success: false, error: "Failed to save chatbot settings" };
  }
}
