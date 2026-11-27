import React from "react";
import { getSectionsWithSources } from "@/lib/actions/sections";
import { getKnowledgeSources } from "@/lib/actions/knowledge";
import { SectionsClient } from "@/components/dashboard/sections/sections-client";

export default async function SectionsPage() {
  const [sectionsRes, sourcesRes] = await Promise.all([
    getSectionsWithSources(),
    getKnowledgeSources(),
  ]);

  const initialSections = sectionsRes.success ? sectionsRes.data : [];
  const availableSources = sourcesRes.success ? sourcesRes.data : [];

  return (
    <SectionsClient
      initialSections={initialSections}
      availableSources={availableSources}
    />
  );
}
