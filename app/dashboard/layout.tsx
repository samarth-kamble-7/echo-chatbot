import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  DashboardSidebar,
  MobileSidebarButton,
} from "@/components/dashboard/sidebar";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { HeaderSearch } from "@/components/dashboard/header-search";

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
  const activeOrg =
    memberships.find((m) => m.organization.id === orgId) || memberships[0];
  if (activeOrg?.organization?.name) {
    currentOrgName = activeOrg.organization.name;
  }

  const cookieStore = await cookies();
  const defaultCollapsed =
    cookieStore.get("echo-sidebar-collapsed")?.value === "true";

  return (
    <div className="min-h-screen w-full bg-[#050509] text-zinc-100 flex antialiased selection:bg-zinc-800 selection:text-white">
      {/* Docked Full-Height Enterprise Sidebar */}
      <DashboardSidebar defaultCollapsed={defaultCollapsed} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Header: Mobile Menu, Breadcrumbs & Searchbar */}
        <header className="h-14 px-4 md:px-8 flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-[#09090b]/80 sticky top-0 z-10 backdrop-blur-md shrink-0">
          {/* Mobile Menu + Breadcrumbs */}
          <div className="flex items-center gap-2.5 min-w-0">
            <MobileSidebarButton />
            <Breadcrumbs orgName={currentOrgName} />
          </div>

          {/* Searchbar */}
          <HeaderSearch />
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-4 md:p-8 w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
