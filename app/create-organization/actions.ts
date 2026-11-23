"use server";

import { db } from "@/db/client";
import { organization, user } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function saveOrganizationToDb({
  id,
  name,
  slug: providedSlug,
  website,
  logo,
}: {
  id: string;
  name: string;
  slug?: string | null;
  website?: string | null;
  logo?: string | null;
}) {
  const { userId } = await auth({ treatPendingAsSignedOut: false });

  // Use Clerk's slug or auto-generate fallback
  const slug =
    providedSlug ||
    `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "org"}-${id.slice(-5)}`;

  try {
    await db
      .insert(organization)
      .values({
        id,
        name: name.trim(),
        slug,
        logo: logo || null,
        website: website?.trim() || null,
      })
      .onConflictDoUpdate({
        target: organization.id,
        set: {
          name: name.trim(),
          slug,
          logo: logo || null,
          website: website?.trim() || null,
        },
      });

    // Link user to this organization in database
    if (userId) {
      await db
        .update(user)
        .set({ organization_id: id })
        .where(eq(user.id, userId));
    }

    return { success: true, slug };
  } catch (err: any) {
    console.error("[Database] Error saving organization:", err);
    return { success: false, error: err?.message };
  }
}
