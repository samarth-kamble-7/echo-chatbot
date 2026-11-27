import React from "react";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { Search } from "lucide-react";

export const metadata = {
  title: "Echo Support | Workspace Dashboard",
  description: "Manage your AI customer support bots and documentation sources",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth({ treatPendingAsSignedOut: false });

  // 1. Must be authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Check if the user belongs to ANY organization
  const client = await clerkClient();
  let memberships: Awaited<
    ReturnType<typeof client.users.getOrganizationMembershipList>
  >["data"] = [];
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

  // Active org name
  let currentOrgName = "Workspace";
  const activeOrg = memberships.find((m) => m.organization.id === orgId) || memberships[0];
  if (activeOrg?.organization?.name) {
    currentOrgName = activeOrg.organization.name;
  }

  return (
    <div className="min-h-screen w-full bg-[#050509] text-zinc-100 flex antialiased selection:bg-zinc-800 selection:text-white">
      {/* Docked Full-Height Enterprise Sidebar */}
      <DashboardSidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header: Breadcrumbs & Searchbar Only */}
        <header className="h-14 px-8 flex items-center justify-between border-b border-zinc-800/80 bg-[#09090b]/80 sticky top-0 z-10 backdrop-blur-md shrink-0">
          {/* Breadcrumbs */}
          <Breadcrumbs orgName={currentOrgName} />

          {/* Searchbar */}
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400">
            <Search className="size-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search docs, bots, chats..."
              className="bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-500 w-44 sm:w-60"
            />
            <kbd className="hidden sm:inline-block font-mono text-[10px] text-zinc-500 border border-zinc-700/60 rounded px-1">
              ⌘K
            </kbd>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
