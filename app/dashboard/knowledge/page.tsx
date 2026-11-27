import React from "react";
import { getKnowledgeSources } from "@/lib/actions/knowledge";
import { KnowledgeClient } from "@/components/dashboard/knowledge/knowledge-client";

export default async function KnowledgePage() {
  const result = await getKnowledgeSources();
  const initialSources = result.success ? result.data : [];

  return <KnowledgeClient initialSources={initialSources} />;
}
