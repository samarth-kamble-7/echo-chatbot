import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatMessage, chatSession } from "@/db/schema";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!orgId || !token) {
    return new Response("Missing org or token", {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const [initialSession] = await db
    .select()
    .from(chatSession)
    .where(
      and(
        eq(chatSession.organizationId, orgId),
        eq(chatSession.sessionToken, token)
      )
    )
    .limit(1);

  if (!initialSession) {
    return new Response("Session not found", {
      status: 404,
      headers: CORS_HEADERS,
    });
  }

  const encoder = new TextEncoder();
  let lastMsgCount = -1;
  let lastStatus = "";
  let lastOperatorTyping = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const [sessRows, msgs] = await Promise.all([
            db
              .select({
                status: chatSession.status,
                expiresAt: chatSession.expiresAt,
                metadata: chatSession.metadata,
              })
              .from(chatSession)
              .where(eq(chatSession.id, initialSession.id))
              .limit(1),
            db
              .select({
                id: chatMessage.id,
                role: chatMessage.role,
                content: chatMessage.content,
                createdAt: chatMessage.createdAt,
              })
              .from(chatMessage)
              .where(eq(chatMessage.sessionId, initialSession.id))
              .orderBy(asc(chatMessage.createdAt)),
          ]);

          const sess = sessRows[0];
          if (!sess) return;

          const typingUntil = Number(sess.metadata?.operatorTypingUntil || 0);
          const operatorTyping =
            sess.status !== "resolved" && typingUntil > Date.now();

          if (
            msgs.length !== lastMsgCount ||
            sess.status !== lastStatus ||
            operatorTyping !== lastOperatorTyping
          ) {
            lastMsgCount = msgs.length;
            lastStatus = sess.status;
            lastOperatorTyping = operatorTyping;
            const payload = JSON.stringify({
              status: sess.status,
              operatorTyping,
              messages: msgs,
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch {
          // ignore transient poll errors inside stream
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
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
