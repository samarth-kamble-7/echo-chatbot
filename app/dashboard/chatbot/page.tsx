import React from "react";
import { getSectionsWithSources } from "@/lib/actions/sections";
import { getChatbotSettings } from "@/lib/actions/chatbot";
import { ChatPlayground } from "@/components/dashboard/chatbot/chat-playground";
import { SubscriptionGate } from "@/components/dashboard/billing/subscription-gate";

export default async function ChatbotPage() {
  const [sectionsRes, settingsRes] = await Promise.all([
    getSectionsWithSources(),
    getChatbotSettings(),
  ]);

  const activeSections = sectionsRes.success
    ? sectionsRes.data
        .filter((s) => s.isActive)
        .map((s) => ({ id: s.id, name: s.name, tone: s.tone }))
    : [];

  const orgId = settingsRes.success ? settingsRes.data.orgId : "";
  const initialConfig = settingsRes.success
    ? settingsRes.data.config
    : {
        botName: "Echo Support",
        subtitle: "Online",
        welcomeMessage: "Hi! Ask me anything about our documentation.",
        inputPlaceholder: "Ask a question...",
        primaryColor: "#10b981",
        theme: "dark" as const,
        position: "bottom-right" as const,
        launcherIcon: "message" as const,
        launcherStyle: "icon" as const,
        launcherText: "Chat with us",
        suggestedQuestions: [],
        supportEmail: "",
        systemPrompt: "",
      };

  return (
    <SubscriptionGate>
      <ChatPlayground
        orgId={orgId}
        sections={activeSections}
        initialConfig={initialConfig}
      />
    </SubscriptionGate>
  );
}
