"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface BreadcrumbsProps {
  orgName?: string;
}

export function Breadcrumbs({ orgName = "Workspace" }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Extract the segment after /dashboard
  const segments = pathname.split("/").filter(Boolean);
  const currentSection =
    segments.length > 1
      ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
      : "Overview";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-500 font-medium">Echo</span>
      <span className="text-zinc-600">/</span>
      <span className="text-zinc-300 font-medium truncate max-w-[160px] sm:max-w-none">
        {orgName}
      </span>
      <span className="text-zinc-600">/</span>
      <span className="text-white font-semibold">{currentSection}</span>
    </div>
  );
}
