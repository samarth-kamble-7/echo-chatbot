"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItemConfig } from "./types";

interface NavItemProps extends NavItemConfig {
  onClick?: () => void;
}

export function NavItem({
  title,
  href,
  icon: Icon,
  badge,
  isExact = false,
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
      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        isActive
          ? "bg-zinc-800/90 text-white shadow-sm"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className={`size-4 shrink-0 transition-colors ${
            isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
          }`}
        />
        <span className="truncate">{title}</span>
      </div>

      {badge && (
        <span
          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
            isActive
              ? "bg-emerald-500/15 text-emerald-400 font-semibold"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
