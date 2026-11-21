import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

interface ClerkWebhookEvent {
  data: ClerkUserData;
  type: string;
}

export async function POST(req: Request) {
  const SIGNING_SECRET =
    process.env.CLERK_WEBHOOK_SECRET || process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET in environment variables");
    return new Response(
      "Missing CLERK_WEBHOOK_SECRET in environment variables",
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(SIGNING_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as unknown as ClerkWebhookEvent;
  } catch (err) {
    console.error("Error verifying Clerk webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  const eventType = evt.type;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      if (id && primaryEmail) {
        await db
          .insert(user)
          .values({
            id,
            email: primaryEmail,
            name,
            image: image_url || null,
          })
          .onConflictDoUpdate({
            target: user.id,
            set: {
              email: primaryEmail,
              name,
              image: image_url || null,
            },
          });
      }
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      if (id) {
        await db.delete(user).where(eq(user.id, id));
      }
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (dbError) {
    console.error("Error saving Clerk user to database:", dbError);
    return new Response("Internal Server Error", { status: 500 });
  }
}
