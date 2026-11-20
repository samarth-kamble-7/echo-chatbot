import React from "react";
import { BookOpen, FileCode2, Database, GitBranch, Layers, FileText } from "lucide-react";

export const SocialProof = () => {
  const sources = [
    { name: "Notion", icon: Database },
    { name: "Zendesk", icon: Layers },
    { name: "GitHub Docs", icon: GitBranch },
    { name: "Markdown / MDX", icon: FileText },
    { name: "OpenAPI", icon: FileCode2 },
    { name: "Confluence", icon: BookOpen },
  ];

  return (
    <section className="py-12 border-b border-zinc-800 bg-[#09090b]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-xs font-mono uppercase tracking-wider text-zinc-500 mb-8">
          Direct Ingestion From Your Existing Knowledge Base
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center">
          {sources.map((source) => {
            const Icon = source.icon;
            return (
              <div
                key={source.name}
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Icon className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-medium">{source.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
