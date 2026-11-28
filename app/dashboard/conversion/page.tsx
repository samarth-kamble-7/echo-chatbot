import React from "react";
import { getConversations } from "@/lib/actions/conversion";
import { ConversionInbox } from "@/components/dashboard/conversion/conversion-inbox";

export default async function ConversionPage() {
  const res = await getConversations();
  const initialConversations = res.success ? res.data : [];

  return <ConversionInbox initialConversations={initialConversations} />;
}
