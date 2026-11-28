"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItemConfig } from "./types";

interface NavItemProps extends NavItemConfig {
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavItem({
  title,
  href,
  icon: Icon,
  badge,
  isExact = false,
  collapsed = false,
  onClick,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = isExact
    ? pathname === href
    : pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? title : undefined}
      className={`group flex items-center h-9 rounded-md text-[13px] transition-colors ${
        collapsed ? "justify-center px-0" : "justify-between px-3"
      } ${
        isActive
          ? "bg-emerald-500 text-zinc-950 font-semibold"
          : "text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-medium"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={`size-4 shrink-0 transition-colors ${
            isActive
              ? "text-zinc-950"
              : "text-zinc-400 group-hover:text-zinc-200"
          }`}
        />
        {!collapsed && <span className="truncate">{title}</span>}
      </div>

      {!collapsed && badge && (
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            isActive
              ? "bg-zinc-950/15 text-zinc-950 font-semibold"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
