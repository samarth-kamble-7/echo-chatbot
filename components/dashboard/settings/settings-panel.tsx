"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useClerk, useOrganization, useUser } from "@clerk/nextjs";
import {
  Building2,
  User,
  Bell,
  Check,
  Copy,
  Users,
  UserPlus,
  Loader2,
  ShieldCheck,
  LogOut,
  Volume2,
  VolumeX,
  Clock,
  Trash2,
  Lock,
} from "lucide-react";

export interface SettingsMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  imageUrl: string | null;
}

export interface SettingsInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface SettingsPanelProps {
  orgId: string;
  initialOrgName: string;
  orgSlug: string | null;
  orgImageUrl: string | null;
  createdAt: string;
  currentUserId: string;
  hasActivePlan: boolean;
  memberLimit: number | null;
  initialMembers: SettingsMember[];
  initialInvitations: SettingsInvitation[];
}

type SettingsTab = "workspace" | "team" | "profile" | "notifications";

export function SettingsPanel({
  orgId,
  initialOrgName,
  orgSlug,
  orgImageUrl,
  createdAt,
  currentUserId,
  hasActivePlan,
  memberLimit,
  initialMembers,
  initialInvitations,
}: SettingsPanelProps) {
  const { organization } = useOrganization();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [activeTab, setActiveTab] = useState<SettingsTab>("workspace");

  // Workspace state
  const [orgName, setOrgName] = useState(initialOrgName);
  const [savingName, setSavingName] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Team invite state
  const [invitations, setInvitations] =
    useState<SettingsInvitation[]>(initialInvitations);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"org:member" | "org:admin">(
    "org:member",
  );
  const [inviting, setInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // User profile state
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Notification preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem("echo-inbox-sound") !== "false";
    } catch {
      return true;
    }
  });
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  });

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(orgId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orgName.trim();
    if (!trimmed || !organization || savingName) return;

    setSavingName(true);
    setNameFeedback(null);
    try {
      await organization.update({ name: trimmed });
      setNameFeedback({ type: "ok", text: "Workspace name updated." });
    } catch {
      setNameFeedback({
        type: "err",
        text: "Unable to update workspace name.",
      });
    } finally {
      setSavingName(false);
    }
  };

  const totalSeatsUsed = initialMembers.length + invitations.length;
  const seatLimitReached =
    !hasActivePlan || (memberLimit !== null && totalSeatsUsed >= memberLimit);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seatLimitReached) return;
    const email = inviteEmail.trim();
    if (!email || !organization || inviting) return;

    setInviting(true);
    setInviteFeedback(null);
    try {
      const created = await organization.inviteMember({
        emailAddress: email,
        role: inviteRole,
      });
      setInvitations((prev) => [
        {
          id: created.id,
          email: created.emailAddress,
          role: created.role,
          status: created.status || "pending",
          createdAt: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        },
        ...prev,
      ]);
      setInviteEmail("");
      setInviteFeedback({
        type: "ok",
        text: `Invitation sent to ${email}.`,
      });
    } catch (err) {
      setInviteFeedback({
        type: "err",
        text:
          err instanceof Error
            ? err.message
            : "Could not send invitation. Check permissions or email.",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    if (!organization || revokingId) return;
    setRevokingId(invId);
    try {
      const list = await organization.getInvitations({ status: ["pending"] });
      const target = list.data.find((i) => i.id === invId);
      if (target) {
        await target.revoke();
      }
      setInvitations((prev) => prev.filter((i) => i.id !== invId));
    } catch {
      setInviteFeedback({
        type: "err",
        text: "Failed to revoke invitation.",
      });
    } finally {
      setRevokingId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || savingProfile) return;

    setSavingProfile(true);
    setProfileFeedback(null);
    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setProfileFeedback({ type: "ok", text: "Profile updated." });
    } catch {
      setProfileFeedback({
        type: "err",
        text: "Could not update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleSoundPref = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      window.localStorage.setItem("echo-inbox-sound", String(next));
    } catch {
      // ignore
    }
  };

  const requestBrowserNotifs = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    } catch {
      // ignore
    }
  };

  const tabs: Array<{
    id: SettingsTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "workspace",
      label: "Manage Workspace",
      description: "Organization settings",
      icon: Building2,
    },
    {
      id: "team",
      label: `Team & Invites (${initialMembers.length + invitations.length})`,
      description: "Members & pending",
      icon: Users,
    },
    {
      id: "profile",
      label: "User Profile",
      description: "Personal account",
      icon: User,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Alerts & sound",
      icon: Bell,
    },
  ];

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ||
    initialMembers.find((m) => m.userId === currentUserId)?.email ||
    "-";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
          Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure your workspace, manage team access, and update your personal
          profile.
        </p>
      </div>

      {/* Horizontal Tab Bar */}
      <div className="border-b border-zinc-800 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-medium inline-flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MANAGE WORKSPACE */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* Workspace Identity Card */}
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-6 space-y-5">
            <div className="flex items-center gap-4">
              {orgImageUrl ? (
                <Image
                  src={orgImageUrl}
                  alt={orgName}
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded-xl border border-zinc-700 object-cover shrink-0"
                />
              ) : (
                <div className="size-12 rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 font-semibold text-base flex items-center justify-center shrink-0">
                  {(orgName || "W").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-100 truncate">
                  {orgName}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {orgSlug ? `${orgSlug} · ` : ""}Created {createdAt}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleRenameWorkspace}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Workspace ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={orgId}
                    className="flex-1 h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs font-mono text-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedId ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>{copiedId ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-1">
                {nameFeedback && (
                  <span
                    className={`text-xs ${
                      nameFeedback.type === "ok"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {nameFeedback.text}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingName || !orgName.trim() || !organization}
                  className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {savingName && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: TEAM & INVITES */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Invite Teammate Card */}
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <UserPlus className="size-4 text-emerald-400" />
                <h2>Invite Team Member</h2>
              </div>
              {memberLimit !== null && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {totalSeatsUsed} / {memberLimit} seats used
                </span>
              )}
            </div>

            {!hasActivePlan ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-amber-200">
                  <Lock className="size-4 text-amber-400 shrink-0" />
                  <span>
                    An active subscription is required to invite team members.
                  </span>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="h-8 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center justify-center shrink-0 transition-colors"
                >
                  View Plans
                </Link>
              </div>
            ) : seatLimitReached ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-amber-200">
                  <Lock className="size-4 text-amber-400 shrink-0" />
                  <span>
                    Seat limit reached ({totalSeatsUsed} / {memberLimit}).
                    Upgrade your plan to invite more teammates.
                  </span>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="h-8 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center justify-center shrink-0 transition-colors"
                >
                  Upgrade Plan
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleInviteMember}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite teammate by email..."
                  className="flex-1 h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
                />
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "org:member" | "org:admin")
                  }
                  className="h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="org:member">Member</option>
                  <option value="org:admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim() || !organization}
                  className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                >
                  {inviting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="size-3.5" />
                  )}
                  <span>Send Invite</span>
                </button>
              </form>
            )}

            {inviteFeedback && (
              <div
                className={`text-xs px-3 py-2 rounded-md border ${
                  inviteFeedback.type === "ok"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {inviteFeedback.text}
              </div>
            )}
          </div>

          {/* Active Members Table */}
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Users className="size-4 text-emerald-400" />
                <h2>Active Members ({initialMembers.length})</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-[#050509] text-[11px] font-medium text-zinc-400">
                    <th className="px-6 py-2.5">User</th>
                    <th className="px-6 py-2.5">Email</th>
                    <th className="px-6 py-2.5 text-right">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70 text-xs">
                  {initialMembers.map((m) => {
                    const roleLabel = m.role.replace(/^org:/, "");
                    const isYou = m.userId === currentUserId;
                    return (
                      <tr key={m.id} className="hover:bg-zinc-900/40">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {m.imageUrl ? (
                              <Image
                                src={m.imageUrl}
                                alt={m.name}
                                width={30}
                                height={30}
                                unoptimized
                                className="size-7.5 rounded-full border border-zinc-700 object-cover shrink-0"
                              />
                            ) : (
                              <div className="size-7.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
                                {m.name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-zinc-100 truncate">
                              {m.name}
                              {isYou && (
                                <span className="ml-1.5 text-[10px] text-emerald-400 font-normal">
                                  (You)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-zinc-400">{m.email}</td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded border text-[11px] capitalize ${
                              roleLabel === "admin"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-zinc-800 bg-zinc-900 text-zinc-300"
                            }`}
                          >
                            {roleLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Table */}
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Clock className="size-4 text-amber-400" />
                <h2>Pending Invitations ({invitations.length})</h2>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No pending invitations.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 bg-[#050509] text-[11px] font-medium text-zinc-400">
                      <th className="px-6 py-2.5">Email</th>
                      <th className="px-6 py-2.5">Role</th>
                      <th className="px-6 py-2.5">Status</th>
                      <th className="px-6 py-2.5">Sent</th>
                      <th className="px-6 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-xs">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-900/40">
                        <td className="px-6 py-3 font-medium text-zinc-200">
                          {inv.email}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 capitalize">
                            {inv.role.replace(/^org:/, "")}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] capitalize">
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-zinc-400">
                          {inv.createdAt}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            type="button"
                            disabled={revokingId === inv.id}
                            onClick={() => handleRevokeInvitation(inv.id)}
                            className="h-7 px-2.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {revokingId === inv.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Trash2 className="size-3" />
                            )}
                            <span>Revoke</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: USER PROFILE */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
              <div className="flex items-center gap-4 min-w-0">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || "User avatar"}
                    width={52}
                    height={52}
                    unoptimized
                    className="size-13 rounded-full border border-zinc-700 object-cover shrink-0"
                  />
                ) : (
                  <div className="size-13 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 font-semibold text-base flex items-center justify-center shrink-0">
                    {(firstName || primaryEmail).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-100 truncate">
                    {user?.fullName ||
                      [firstName, lastName].filter(Boolean).join(" ") ||
                      "Account User"}
                  </div>
                  <div className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                    <span>{primaryEmail}</span>
                    <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/sign-in" })}
                className="h-9 px-3.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-red-400 text-xs font-medium text-zinc-300 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={primaryEmail}
                    className="w-full h-9 px-3 rounded-md border border-zinc-800 bg-[#050509] text-xs text-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                {profileFeedback && (
                  <span
                    className={`text-xs ${
                      profileFeedback.type === "ok"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {profileFeedback.text}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingProfile || !user}
                  className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {savingProfile && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div className="rounded-xl border border-zinc-800 bg-[#09090b] divide-y divide-zinc-800">
          <div className="p-6 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="size-4 text-emerald-400" />
                ) : (
                  <VolumeX className="size-4 text-zinc-500" />
                )}
                <span>Escalation Sound Chime</span>
              </div>
              <p className="text-xs text-zinc-400">
                Play an audio chime in the Conversion inbox when a visitor
                escalates to a human operator.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSoundPref}
              className={`h-8 px-3.5 rounded-md border text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                soundEnabled
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400"
              }`}
            >
              {soundEnabled ? "Enabled" : "Muted"}
            </button>
          </div>

          <div className="p-6 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                <Bell className="size-4 text-emerald-400" />
                <span>Desktop Browser Notifications</span>
              </div>
              <p className="text-xs text-zinc-400">
                Show system notifications for newly escalated chats even when
                another tab is active.
              </p>
            </div>
            {notifPermission === "granted" ? (
              <span className="px-3 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium shrink-0">
                Allowed
              </span>
            ) : notifPermission === "denied" ? (
              <span className="px-3 py-1 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium shrink-0">
                Blocked in Browser
              </span>
            ) : (
              <button
                type="button"
                onClick={requestBrowserNotifs}
                className="h-8 px-3.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
