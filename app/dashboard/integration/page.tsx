import React from "react";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatbotSettings } from "@/db/schema";
import { getActiveOrgContext } from "@/lib/knowledge/org";
import { WidgetEmbedPanel } from "@/components/dashboard/widget/widget-embed-panel";

export const dynamic = "force-dynamic";

export default async function IntegrationPage() {
  const ctx = await getActiveOrgContext();
  if (!ctx) {
    return null;
  }

  const [headerList, botRows] = await Promise.all([
    headers(),
    db
      .select({ botName: chatbotSettings.botName })
      .from(chatbotSettings)
      .where(eq(chatbotSettings.organizationId, ctx.orgId))
      .limit(1),
  ]);

  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : "http://localhost:3000";
  const botName = botRows[0]?.botName || "Echo Support";

  return (
    <WidgetEmbedPanel orgId={ctx.orgId} origin={origin} botName={botName} />
  );
}
