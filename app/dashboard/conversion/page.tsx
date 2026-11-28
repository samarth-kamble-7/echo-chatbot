import React from "react";
import { getConversations } from "@/lib/actions/conversion";
import { ConversionInbox } from "@/components/dashboard/conversion/conversion-inbox";
import { SubscriptionGate } from "@/components/dashboard/billing/subscription-gate";

export default async function ConversionPage() {
  const res = await getConversations();
  const initialConversations = res.success ? res.data : [];

  return (
    <SubscriptionGate>
      <ConversionInbox initialConversations={initialConversations} />
    </SubscriptionGate>
  );
}
