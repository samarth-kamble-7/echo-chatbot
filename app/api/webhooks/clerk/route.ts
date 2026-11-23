import { Webhook } from "svix";
import { headers } from "next/headers";
import fs from "fs";
import path from "path";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

interface ClerkWebhookEvent {
  data: ClerkUserData | any;
  type: string;
}

function getSigningSecret(): string | undefined {
  if (process.env.CLERK_WEBHOOK_SECRET) return process.env.CLERK_WEBHOOK_SECRET;
  if (process.env.SIGNING_SECRET) return process.env.SIGNING_SECRET;

  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, "utf-8");
      const match = envFile.match(/CLERK_WEBHOOK_SECRET=["']?([^"'\n\r]+)["']?/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const SIGNING_SECRET = getSigningSecret();

    if (!SIGNING_SECRET) {
      console.error("[Clerk Webhook] Missing CLERK_WEBHOOK_SECRET in environment or .env");
      return new Response(
        JSON.stringify({ error: "Missing CLERK_WEBHOOK_SECRET" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("[Clerk Webhook] Missing Svix headers");
      return new Response(
        JSON.stringify({ error: "Missing svix headers" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get raw body as text for precise cryptographic signature verification
    const body = await req.text();

    const wh = new Webhook(SIGNING_SECRET);

    try {
      wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err: any) {
      console.error("[Clerk Webhook] Verification failed:", err?.message);
      return new Response(
        JSON.stringify({ error: "Verification failed", details: err?.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const evt = JSON.parse(body) as ClerkWebhookEvent;
    const eventType = evt?.type;
    console.log(`[Clerk Webhook] Received verified event: ${eventType}`);

    // --- User Events ---
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;
      const image = image_url || null;

      if (id && primaryEmail) {
        try {
          await db
            .insert(user)
            .values({
              id,
              email: primaryEmail,
              name,
              image,
            })
            .onConflictDoUpdate({
              target: user.id,
              set: {
                email: primaryEmail,
                name,
                image,
              },
            });
          console.log(`[Clerk Webhook] Successfully saved user ${id} to database.`);
        } catch (dbErr: any) {
          console.error(`[Clerk Webhook] DB write error for user ${id}:`, dbErr);
          return new Response(
            JSON.stringify({
              error: "Database write failed",
              details: dbErr?.message || String(dbErr),
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data as any;
      if (id) {
        try {
          await db.delete(user).where(eq(user.id, id));
          console.log(`[Clerk Webhook] Successfully deleted user ${id} from database.`);
        } catch (dbErr: any) {
          console.error(`[Clerk Webhook] DB delete error for user ${id}:`, dbErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, event: eventType }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (topLevelErr: any) {
    console.error("[Clerk Webhook] Top-level handler crash:", topLevelErr);
    return new Response(
      JSON.stringify({
        error: "Top-level webhook crash",
        details: topLevelErr?.message || String(topLevelErr),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
