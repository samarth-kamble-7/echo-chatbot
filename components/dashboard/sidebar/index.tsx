"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Library,
  Layers,
  Palette,
  Inbox,
  Settings,
  Code2,
  CreditCard,
  Menu,
  X,
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

const SUPPORT_ITEMS: NavItemConfig[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isExact: true,
  },
  {
    title: "Conversion",
    href: "/dashboard/conversion",
    icon: Inbox,
  },
  {
    title: "Knowledge",
    href: "/dashboard/knowledge",
    icon: Library,
  },
];

const CONFIG_ITEMS: NavItemConfig[] = [
  {
    title: "Sections",
    href: "/dashboard/sections",
    icon: Layers,
  },
  {
    title: "Chatbot",
    href: "/dashboard/chatbot",
    icon: Palette,
  },
  {
    title: "Integration",
    href: "/dashboard/integration",
    icon: Code2,
  },
];

const ACCOUNT_ITEMS: NavItemConfig[] = [
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function MobileSidebarButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("echo-open-sidebar"))}
      aria-label="Open navigation menu"
      className="md:hidden h-8 w-8 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
    >
      <Menu className="size-4" />
    </button>
  );
}

export function DashboardSidebar({
  defaultCollapsed = false,
  planLabel = "No Active Plan",
  hasActivePlan = false,
}: {
  defaultCollapsed?: boolean;
  planLabel?: string;
  hasActivePlan?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setMobileOpen(true);
    window.addEventListener("echo-open-sidebar", handleOpen);
    return () => window.removeEventListener("echo-open-sidebar", handleOpen);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `echo-sidebar-collapsed=${String(
        next
      )}; path=/; max-age=31536000; SameSite=Lax`;
      return next;
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } hidden md:flex h-dvh min-h-screen sticky top-0 flex-col justify-between bg-[#09090b] border-r border-zinc-800/80 shrink-0 select-none z-30 transition-[width] duration-200`}
      >
        {/* Top Workspace Switcher (outside overflow container so popover never clips) */}
        <WorkspaceSwitcher
          collapsed={collapsed}
          planLabel={planLabel}
          hasActivePlan={hasActivePlan}
        />

        {/* Scrollable Grouped Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div
            className={`flex-1 ${
              collapsed ? "px-2 py-4 space-y-3" : "px-3 py-4 space-y-5"
            }`}
          >
            <NavSection
              title="Customer Support"
              items={SUPPORT_ITEMS}
              collapsed={collapsed}
            />
            <NavSection
              title="Configuration"
              items={CONFIG_ITEMS}
              collapsed={collapsed}
            />
            <NavSection
              title="Account"
              items={ACCOUNT_ITEMS}
              collapsed={collapsed}
            />
          </div>
        </div>

        {/* Bottom User Bar */}
        <UserProfile collapsed={collapsed} />

        {/* Clickable Right Border Rail to Collapse / Expand */}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-0 -right-1.5 h-full w-3 cursor-col-resize z-30 group flex items-center justify-center focus:outline-none"
        >
          <span className="h-full w-px bg-transparent group-hover:bg-emerald-500/70 transition-colors" />
        </button>
      </aside>

      {/* Mobile Left Slide-Over Sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-dvh flex flex-col justify-between bg-[#09090b] border-r border-zinc-800 shadow-2xl select-none">
            <div className="h-12 px-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-zinc-200">
                Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="h-7 w-7 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <WorkspaceSwitcher
              collapsed={false}
              planLabel={planLabel}
              hasActivePlan={hasActivePlan}
            />

            <div
              className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) {
                  setMobileOpen(false);
                }
              }}
            >
              <div className="flex-1 px-3 py-4 space-y-5">
                <NavSection
                  title="Customer Support"
                  items={SUPPORT_ITEMS}
                  collapsed={false}
                />
                <NavSection
                  title="Configuration"
                  items={CONFIG_ITEMS}
                  collapsed={false}
                />
                <NavSection
                  title="Account"
                  items={ACCOUNT_ITEMS}
                  collapsed={false}
                />
              </div>
            </div>

            <UserProfile collapsed={false} />
          </aside>
        </div>
      )}
    </>
  );
}

export default DashboardSidebar;
