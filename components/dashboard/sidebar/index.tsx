"use client";

import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Bot,
  TrendingUp,
  Settings,
} from "lucide-react";

import { WorkspaceSwitcher } from "./workspace-switcher";
import { NavSection } from "./nav-section";
import { UserProfile } from "./user-profile";
import { NavItemConfig } from "./types";

export * from "./types";
export * from "./nav-item";
export * from "./nav-section";
export * from "./workspace-switcher";
export * from "./user-profile";

const MENU_ITEMS: NavItemConfig[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isExact: true,
  },
  {
    title: "Knowledge",
    href: "/dashboard/knowledge",
    icon: BookOpen,
  },
  {
    title: "Sections",
    href: "/dashboard/sections",
    icon: Layers,
  },
  {
    title: "Chatbot",
    href: "/dashboard/chatbot",
    icon: Bot,
  },
  {
    title: "Conversion",
    href: "/dashboard/conversion",
    icon: TrendingUp,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col justify-between bg-[#09090b] border-r border-zinc-800/80 shrink-0 select-none z-20">
      {/* Top Workspace + Navigation */}
      <div className="flex flex-col min-h-0 overflow-y-auto">
        <WorkspaceSwitcher />

        <div className="p-3">
          <NavSection items={MENU_ITEMS} />
        </div>
      </div>

      {/* Bottom User Bar */}
      <UserProfile />
    </aside>
  );
}

export default DashboardSidebar;
