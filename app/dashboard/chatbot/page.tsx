import React from "react";
import { getKnowledgeSources } from "@/lib/actions/knowledge";
import { getSectionsWithSources } from "@/lib/actions/sections";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { ChatPlayground } from "@/components/dashboard/chatbot/chat-playground";

export default async function ChatbotPage() {
  const [sourcesRes, sectionsRes] = await Promise.all([
    getKnowledgeSources(),
    getSectionsWithSources(),
  ]);

  const sourceCount = sourcesRes.success ? sourcesRes.data.length : 0;
  const activeSections = sectionsRes.success
    ? sectionsRes.data
        .filter((s) => s.isActive)
        .map((s) => ({ id: s.id, name: s.name, tone: s.tone }))
    : [];

  return (
    <ChatPlayground
      geminiConfigured={isGeminiConfigured()}
      sourceCount={sourceCount}
      sections={activeSections}
    />
  );
}
