"use client";

import React from "react";
import { NavItemConfig } from "./types";
import { NavItem } from "./nav-item";

interface NavSectionProps {
  title?: string;
  items?: NavItemConfig[];
  children?: React.ReactNode;
}

export function NavSection({ title, items, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      {title && (
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          {title}
        </div>
      )}

      <div className="space-y-2">
        {items?.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
        {children}
      </div>
    </div>
  );
}
