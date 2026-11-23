import { auth, clerkClient } from "@clerk/nextjs/server";
import { Bot, CheckCircle2, FileText, Sparkles, Users } from "lucide-react";

export default async function DashboardPage() {
  const { userId, orgId } = await auth({ treatPendingAsSignedOut: false });

  let orgName = "Your Workspace";
  const client = await clerkClient();

  if (orgId) {
    try {
      const org = await client.organizations.getOrganization({
        organizationId: orgId,
      });
      if (org?.name) {
        orgName = org.name;
      }
    } catch (e) {
      console.warn("Could not fetch organization name:", e);
    }
  } else if (userId) {
    try {
      const res = await client.users.getOrganizationMembershipList({
        userId,
        limit: 1,
      });
      if (res.data?.[0]?.organization?.name) {
        orgName = res.data[0].organization.name;
      }
    } catch (e) {
      console.warn("Could not fetch user memberships:", e);
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/80 via-[#0c0c0e] to-zinc-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/80 text-[11px] font-medium text-zinc-300">
            <Sparkles className="size-3 text-emerald-400" />
            <span>Workspace Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {orgName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Your support knowledge base is connected. Echo uses deterministic
            retrieval to ground answers strictly in your verified documentation.
          </p>
        </div>
      </div>

      {/* Quick Setup / Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-zinc-800 bg-[#0c0c0e] space-y-3">
          <div className="size-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <FileText className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Knowledge Base</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Connect documentation sources, OpenAPI specs, and help centers.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="size-3" />
              <span>Ready to index</span>
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800 bg-[#0c0c0e] space-y-3">
          <div className="size-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Bot className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Test queries and check grounded citations in real time.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
              <span>0 test conversations</span>
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800 bg-[#0c0c0e] space-y-3">
          <div className="size-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Users className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Team Members</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Invite teammates to collaborate on support workflows.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400">
              <span>Workspace Admin</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
