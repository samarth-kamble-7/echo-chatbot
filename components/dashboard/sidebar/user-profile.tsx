"use client";

import React from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { Settings } from "lucide-react";

export function UserProfile() {
  const { user, isLoaded } = useUser();

  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";

  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="p-3 border-t border-zinc-800/80 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8 rounded-lg border border-zinc-700/80 hover:border-zinc-500 transition-colors",
              userButtonPopoverCard: "border border-zinc-800 bg-[#0c0c0e] shadow-2xl rounded-xl",
            },
          }}
        />

        <div className="min-w-0 flex flex-col">
          <span className="text-xs font-medium text-zinc-200 truncate">
            {isLoaded ? displayName : "Loading..."}
          </span>
          <span className="text-[11px] text-zinc-500 truncate max-w-[130px]">
            {isLoaded ? email : ""}
          </span>
        </div>
      </div>

      <Link
        href="/dashboard/settings"
        className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
        title="Settings"
      >
        <Settings className="size-4" />
      </Link>
    </div>
  );
}
