import React from "react";
import { clerkClient } from "@clerk/nextjs/server";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import {
  SettingsPanel,
  type SettingsInvitation,
  type SettingsMember,
} from "@/components/dashboard/settings/settings-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return null;
  }

  const client = await clerkClient();
  const [org, membershipsRes, invitationsRes] = await Promise.all([
    client.organizations.getOrganization({ organizationId: ctx.orgId }),
    client.organizations.getOrganizationMembershipList({
      organizationId: ctx.orgId,
      limit: 25,
    }),
    client.organizations.getOrganizationInvitationList({
      organizationId: ctx.orgId,
      status: ["pending"],
      limit: 25,
    }),
  ]);

  const members: SettingsMember[] = (membershipsRes.data || []).map((m) => {
    const pub = m.publicUserData;
    const fullName = [pub?.firstName, pub?.lastName].filter(Boolean).join(" ");
    return {
      id: m.id,
      userId: pub?.userId || "",
      name: fullName || pub?.identifier || "Team Member",
      email: pub?.identifier || "-",
      role: m.role,
      imageUrl: pub?.imageUrl || null,
    };
  });

  const invitations: SettingsInvitation[] = (invitationsRes.data || []).map(
    (inv) => ({
      id: inv.id,
      email: inv.emailAddress,
      role: inv.role,
      status: inv.status || "pending",
      createdAt: inv.createdAt
        ? new Date(inv.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "-",
    })
  );

  const createdAt = org.createdAt
    ? new Date(org.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

  return (
    <SettingsPanel
      orgId={org.id}
      initialOrgName={org.name}
      orgSlug={org.slug ?? null}
      orgImageUrl={org.imageUrl || null}
      createdAt={createdAt}
      currentUserId={ctx.userId}
      initialMembers={members}
      initialInvitations={invitations}
    />
  );
}
