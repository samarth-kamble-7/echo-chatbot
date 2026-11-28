import React from "react";
import { getKnowledgeSources } from "@/lib/actions/knowledge";
import { KnowledgeClient } from "@/components/dashboard/knowledge/knowledge-client";
import { SubscriptionGate } from "@/components/dashboard/billing/subscription-gate";

export default async function KnowledgePage() {
  const result = await getKnowledgeSources();
  const initialSources = result.success ? result.data : [];

  return (
    <SubscriptionGate>
      <KnowledgeClient initialSources={initialSources} />
    </SubscriptionGate>
  );
}
