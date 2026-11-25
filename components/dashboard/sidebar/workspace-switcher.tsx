"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { ChevronsUpDown, Check, Plus, Building2, Sparkles } from "lucide-react";
import { EchoLogo } from "@/components/landing/logo";

export function WorkspaceSwitcher() {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { userMemberships, setActive, isLoaded: isListLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOrg = organization || userMemberships?.data?.[0]?.organization;
  const orgName = currentOrg?.name || "Your Workspace";
  const orgLogo = currentOrg?.imageUrl;

  return (
    <div className="relative p-3 border-b border-zinc-800/80" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group cursor-pointer text-left border border-transparent hover:border-zinc-800"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo / Org Avatar */}
          <div className="size-8 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            {orgLogo ? (
              <img src={orgLogo} alt={orgName} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center bg-zinc-800 text-xs font-bold text-emerald-400">
                {orgName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Org Name & Status */}
          <div className="min-w-0 flex flex-col">
            <span className="text-xs font-semibold text-zinc-100 truncate group-hover:text-white">
              {orgName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-zinc-400 font-medium">Pro Workspace</span>
            </div>
          </div>
        </div>

        {/* UpDown Chevrons like Linear/Vercel */}
        <ChevronsUpDown className="size-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0 ml-1" />
      </button>

      {/* Workspace Dropdown */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] inset-x-3 z-50 p-1.5 rounded-xl bg-[#0e0e12] border border-zinc-800 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Workspaces
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {userMemberships?.data?.map((mem) => {
              const isCurrent = mem.organization.id === currentOrg?.id;
              return (
                <button
                  key={mem.id}
                  type="button"
                  onClick={async () => {
                    if (setActive) {
                      await setActive({ organization: mem.organization.id });
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isCurrent
                      ? "bg-zinc-800/80 text-white font-medium"
                      : "text-zinc-300 hover:bg-zinc-800/40 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="size-5 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 overflow-hidden text-[9px] font-bold text-zinc-300">
                      {mem.organization.imageUrl ? (
                        <img
                          src={mem.organization.imageUrl}
                          alt={mem.organization.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        mem.organization.name.slice(0, 1)
                      )}
                    </div>
                    <span className="truncate">{mem.organization.name}</span>
                  </div>
                  {isCurrent && <Check className="size-3 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1 mt-1 border-t border-zinc-800/80">
            <Link
              href="/create-organization"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
            >
              <Plus className="size-3.5 text-zinc-400" />
              <span>Create New Workspace</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
