import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatMessage, chatSession } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import { getConversations } from "@/lib/actions/conversion";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId")?.trim();

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;

  // Conversation list stream when no sessionId is provided
  if (!sessionId) {
    let lastSignature = "";
    const stream = new ReadableStream({
      async start(controller) {
        const sendListUpdate = async () => {
          try {
            const res = await getConversations();
            if (!res.success) return;
            const sig = res.data
              .map(
                (c) =>
                  `${c.id}:${c.status}:${c.messageCount}:${c.lastActiveAt}`
              )
              .join("|");
            if (sig !== lastSignature) {
              lastSignature = sig;
              const payload = JSON.stringify({ conversations: res.data });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
          } catch {
            // ignore transient errors
          }
        };

        await sendListUpdate();
        timer = setInterval(sendListUpdate, 1500);

        req.signal.addEventListener("abort", () => {
          if (timer) clearInterval(timer);
          try {
            controller.close();
          } catch {
            // already closed
          }
        });
      },
      cancel() {
        if (timer) clearInterval(timer);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const [initialSession] = await db
    .select({ id: chatSession.id })
    .from(chatSession)
    .where(
      and(
        eq(chatSession.id, sessionId),
        eq(chatSession.organizationId, ctx.orgId)
      )
    )
    .limit(1);

  if (!initialSession) {
    return new Response("Not found", { status: 404 });
  }

  let lastMsgCount = -1;
  let lastStatus = "";

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const [sessRows, msgs] = await Promise.all([
            db
              .select({ status: chatSession.status })
              .from(chatSession)
              .where(eq(chatSession.id, sessionId))
              .limit(1),
            db
              .select()
              .from(chatMessage)
              .where(
                and(
                  eq(chatMessage.sessionId, sessionId),
                  eq(chatMessage.organizationId, ctx.orgId)
                )
              )
              .orderBy(asc(chatMessage.createdAt)),
          ]);

          const sess = sessRows[0];
          if (!sess) return;

          if (msgs.length !== lastMsgCount || sess.status !== lastStatus) {
            lastMsgCount = msgs.length;
            lastStatus = sess.status;
            const payload = JSON.stringify({
              status: sess.status,
              messages: msgs,
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch {
          // ignore transient errors
        }
      };

      await sendUpdate();
      timer = setInterval(sendUpdate, 1200);

      req.signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
