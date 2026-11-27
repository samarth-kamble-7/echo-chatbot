import React from "react";
import { getKnowledgeSources } from "@/lib/actions/knowledge";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { ChatPlayground } from "@/components/dashboard/chatbot/chat-playground";

export default async function ChatbotPage() {
  const res = await getKnowledgeSources();
  const sourceCount = res.success ? res.data.length : 0;

  return (
    <ChatPlayground
      geminiConfigured={isGeminiConfigured()}
      sourceCount={sourceCount}
    />
  );
}
