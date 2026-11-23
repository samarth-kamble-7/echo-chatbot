import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  Bot,
  FileText,
  Layers,
  Settings,
  Users,
} from "lucide-react";

import { EchoLogo } from "@/components/landing/logo";

export const metadata = {
  title: "Echo Support | Workspace Dashboard",
  description: "Manage your AI customer support bots and documentation sources",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth({ treatPendingAsSignedOut: false });

  // 1. Must be authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Check if the user belongs to ANY organization (created or joined)
  const client = await clerkClient();
  let memberships: any[] = [];
  try {
    const res = await client.users.getOrganizationMembershipList({
      userId,
      limit: 20,
    });
    memberships = res.data || [];
  } catch (err) {
    console.error("Error fetching user organization memberships:", err);
  }

  // If user has not created or joined any organization, redirect to create one
  if (memberships.length === 0) {
    redirect("/create-organization");
  }

  return (
    <div className="min-h-screen w-full bg-[#050509] text-zinc-100 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <EchoLogo className="size-6" />
            <span className="text-sm font-semibold tracking-tight text-white hidden sm:inline">
              Echo Support
            </span>
          </Link>

          <div className="h-5 w-px bg-zinc-800" />

          {/* Organization Switcher */}
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/create-organization"
            afterSelectOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                organizationSwitcherTrigger:
                  "h-9 px-3 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer",
                organizationSwitcherPopoverCard:
                  "border border-zinc-800 bg-[#0c0c0e] shadow-2xl rounded-xl text-zinc-100",
              },
            }}
          />
        </div>

        {/* User Button & Home Link */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "size-8 border border-zinc-700/80 hover:border-zinc-500 transition-colors",
              },
            }}
          />
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-8">
        {/* Workspace Sidebar */}
        <aside className="w-56 hidden md:flex flex-col gap-1 text-xs">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-800/60 text-white font-medium transition-colors"
          >
            <Layers className="size-4 text-zinc-300" />
            <span>Overview</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors"
          >
            <FileText className="size-4" />
            <span>Knowledge Base</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors"
          >
            <Bot className="size-4" />
            <span>Bot Playground</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors"
          >
            <Users className="size-4" />
            <span>Team Members</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors"
          >
            <Settings className="size-4" />
            <span>Settings</span>
          </Link>
        </aside>

        {/* Content Area */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
