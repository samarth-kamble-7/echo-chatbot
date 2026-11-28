"use client";

import React from "react";
import { useUser, UserButton } from "@clerk/nextjs";

export function UserProfile({ collapsed = false }: { collapsed?: boolean }) {
  const { user, isLoaded } = useUser();

  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";

  return (
    <div
      className={`py-3 border-t border-zinc-800/80 flex items-center ${
        collapsed ? "justify-center px-2" : "px-4 gap-3"
      }`}
    >
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox:
              "size-7 rounded-full border border-zinc-700/80 hover:border-zinc-500 transition-colors",
            userButtonPopoverCard:
              "border border-zinc-800 bg-[#0c0c0e] shadow-2xl rounded-xl",
          },
        }}
      />

      {!collapsed && (
        <span className="text-[13px] font-medium text-zinc-200 truncate">
          {isLoaded ? displayName : "Loading..."}
        </span>
      )}
    </div>
  );
}
