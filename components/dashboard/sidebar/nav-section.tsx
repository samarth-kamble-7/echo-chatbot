"use client";

import React from "react";
import { NavItemConfig } from "./types";
import { NavItem } from "./nav-item";

interface NavSectionProps {
  title?: string;
  items?: NavItemConfig[];
  collapsed?: boolean;
  children?: React.ReactNode;
}

export function NavSection({
  title,
  items,
  collapsed = false,
  children,
}: NavSectionProps) {
  return (
    <div className="space-y-1">
      {title && !collapsed && (
        <div className="px-3 pb-1 text-[11px] font-medium text-zinc-500">
          {title}
        </div>
      )}

      <div className="space-y-1">
        {items?.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}
        {children}
      </div>
    </div>
  );
}
