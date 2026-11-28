import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@/db/client";
import { chatMessage, chatSession, organization, type VisitorMetadata } from "@/db/schema";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org")?.trim();
  const token = searchParams.get("token")?.trim();

  if (!orgId || !token) {
    return NextResponse.json(
      { valid: false, error: "Missing org or token" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const [session] = await db
      .select()
      .from(chatSession)
      .where(
        and(
          eq(chatSession.organizationId, orgId),
          eq(chatSession.sessionToken, token)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { valid: false, expired: true },
        { headers: CORS_HEADERS }
      );
    }

    const nowMs = Date.now();
    const expiresMs = new Date(session.expiresAt).getTime();
    if (Number.isNaN(expiresMs) || expiresMs <= nowMs) {
      return NextResponse.json(
        { valid: false, expired: true },
        { headers: CORS_HEADERS }
      );
    }

    // Refresh 24-hour sliding window on active visit
    const nowIso = new Date(nowMs).toISOString();
    const nextExpiresIso = new Date(nowMs + SESSION_DURATION_MS).toISOString();

    const [, history, allVisitorSessions] = await Promise.all([
      db
        .update(chatSession)
        .set({
          lastActiveAt: nowIso,
          expiresAt: nextExpiresIso,
        })
        .where(eq(chatSession.id, session.id)),
      db
        .select({
          id: chatMessage.id,
          role: chatMessage.role,
          content: chatMessage.content,
          createdAt: chatMessage.createdAt,
        })
        .from(chatMessage)
        .where(eq(chatMessage.sessionId, session.id))
        .orderBy(asc(chatMessage.createdAt)),
      db
        .select({
          id: chatSession.id,
          sessionToken: chatSession.sessionToken,
          status: chatSession.status,
          lastActiveAt: chatSession.lastActiveAt,
          expiresAt: chatSession.expiresAt,
        })
        .from(chatSession)
        .where(
          and(
            eq(chatSession.organizationId, orgId),
            eq(chatSession.visitorEmail, session.visitorEmail)
          )
        )
        .orderBy(desc(chatSession.lastActiveAt))
        .limit(10),
    ]);

    const sessionIds = allVisitorSessions.map((s) => s.id);
    const allMsgs =
      sessionIds.length > 0
        ? await db
            .select({
              sessionId: chatMessage.sessionId,
              role: chatMessage.role,
              content: chatMessage.content,
              createdAt: chatMessage.createdAt,
            })
            .from(chatMessage)
            .where(inArray(chatMessage.sessionId, sessionIds))
            .orderBy(asc(chatMessage.createdAt))
        : [];

    const msgsBySession = new Map<
      string,
      Array<{ role: string; content: string; createdAt: string | null }>
    >();
    for (const m of allMsgs) {
      const list = msgsBySession.get(m.sessionId) || [];
      list.push({ role: m.role, content: m.content, createdAt: m.createdAt });
      msgsBySession.set(m.sessionId, list);
    }

    const conversations = allVisitorSessions
      .filter((s) => new Date(s.expiresAt).getTime() > nowMs)
      .map((s) => {
        const msgs = msgsBySession.get(s.id) || [];
        const last = msgs[msgs.length - 1];
        return {
          sessionToken: s.sessionToken,
          status: s.status,
          lastActiveAt: s.lastActiveAt,
          expiresAt: s.expiresAt,
          lastMessage: last ? last.content : null,
          messages: msgs,
        };
      });

    return NextResponse.json(
      {
        valid: true,
        status: session.status,
        visitorName: session.visitorName,
        visitorEmail: session.visitorEmail,
        expiresAt: nextExpiresIso,
        messages: history,
        conversations,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Widget session check error:", err);
    return NextResponse.json(
      { valid: false, error: "Failed to verify session" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      orgId?: string;
      name?: string;
      email?: string;
      metadata?: VisitorMetadata;
    };

    const orgId = body.orgId?.trim();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const metadata: VisitorMetadata | null =
      body.metadata && typeof body.metadata === "object"
        ? {
            userAgent: body.metadata.userAgent?.slice(0, 300),
            language: body.metadata.language?.slice(0, 40),
            platform: body.metadata.platform?.slice(0, 80),
            screenResolution: body.metadata.screenResolution?.slice(0, 40),
            viewportSize: body.metadata.viewportSize?.slice(0, 40),
            timezone: body.metadata.timezone?.slice(0, 80),
            referrer: body.metadata.referrer?.slice(0, 500),
            currentUrl: body.metadata.currentUrl?.slice(0, 500),
          }
        : null;

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing organization ID" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Please enter your name" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const [org] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + SESSION_DURATION_MS).toISOString();
    const sessionToken = crypto.randomBytes(24).toString("hex");

    await db.insert(chatSession).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      sessionToken,
      visitorName: name,
      visitorEmail: email,
      status: "unresolved",
      metadata,
      expiresAt,
      lastActiveAt: nowIso,
      createdAt: nowIso,
    });

    return NextResponse.json(
      {
        sessionToken,
        visitorName: name,
        visitorEmail: email,
        expiresAt,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Widget session create error:", err);
    return NextResponse.json(
      { error: "Unable to start chat session" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
