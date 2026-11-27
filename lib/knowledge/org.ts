import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Resolves the authenticated Clerk userId and active organizationId.
 * Falls back to the user's first organization membership if orgId is not yet active on the session.
 */
export async function getActiveOrgContext(): Promise<{
  userId: string;
  orgId: string;
} | null> {
  const { userId, orgId } = await auth({ treatPendingAsSignedOut: false });
  if (!userId) return null;

  if (orgId) {
    return { userId, orgId };
  }

  try {
    const client = await clerkClient();
    const res = await client.users.getOrganizationMembershipList({
      userId,
      limit: 1,
    });
    const fallbackOrgId = res.data?.[0]?.organization?.id;
    if (fallbackOrgId) {
      return { userId, orgId: fallbackOrgId };
    }
  } catch (err) {
    console.error("Failed to resolve fallback organization:", err);
  }

  return null;
}
