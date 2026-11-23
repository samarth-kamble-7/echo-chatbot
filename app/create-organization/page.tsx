"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useOrganizationList } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import { EchoLogo } from "@/components/landing/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveOrganizationToDb } from "./actions";

export default function CreateOrganizationPage() {
  const { createOrganization, setActive, userMemberships } =
    useOrganizationList({
      userMemberships: {
        infinite: true,
      },
    });

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  // Logo file selection & preview
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOrganization) {
      setError("Organization service is initializing. Please try again.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a workspace / organization name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Create Organization in Clerk
      const org = await createOrganization({
        name: name.trim(),
      });

      // 2. Set Organization Logo if provided
      let uploadedLogoUrl: string | null = null;
      if (logoFile && (org as any)?.setLogo) {
        try {
          const logoRes = await (org as any).setLogo({ file: logoFile });
          uploadedLogoUrl = logoRes?.imageUrl || null;
        } catch (logoErr: any) {
          console.warn("Could not set organization logo:", logoErr?.message);
        }
      }

      // 3. Save organization with auto-generated slug to database
      await saveOrganizationToDb({
        id: org.id,
        name: name.trim(),
        slug: (org as any)?.slug || null,
        website: website.trim() || null,
        logo: uploadedLogoUrl || (org as any)?.imageUrl || null,
      });

      // 4. Activate the new organization in current session
      if (setActive) {
        await setActive({ organization: org.id });
      }

      // 5. Redirect directly to the dashboard
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to create organization. Slug or name may already be in use."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050509] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-zinc-800 selection:text-white">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800/80 bg-[#0c0c0e] shadow-2xl p-6 sm:p-10 flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <EchoLogo className="size-6" />
            <span className="text-sm font-semibold tracking-tight text-white">
              Echo Support
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Existing Membership Banner */}
        {userMemberships?.data && userMemberships.data.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-300">
                You belong to{" "}
                <strong className="text-white font-medium">
                  {userMemberships.data[0].organization.name}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (setActive) {
                  await setActive({
                    organization: userMemberships.data[0].organization.id,
                  });
                }
                window.location.href = "/dashboard";
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-zinc-300 underline underline-offset-4 cursor-pointer self-start sm:self-auto"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}

        {/* Form Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-[11px] font-medium text-zinc-300">
            <Building2 className="size-3 text-zinc-400" />
            <span>Workspace Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white pt-1">
            Create an Organization
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Set up your organization to host your documentation sources, customer
            support bots, and team members.
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Create Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* 1. Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="org-name"
              className="text-xs font-medium text-zinc-300"
            >
              Organization Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="org-name"
              type="text"
              required
              autoFocus
              placeholder="Acme Support"
              value={name}
              onChange={handleNameChange}
              className="h-11 text-xs sm:text-sm bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 rounded-lg"
            />
          </div>

          {/* 2. Logo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-300">
              Organization Logo (Optional)
            </Label>
            <div className="flex items-center gap-4 pt-1">
              {logoPreview ? (
                <div className="relative size-16 rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900 flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="size-16 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 flex flex-col items-center justify-center text-zinc-500">
                  <Building2 className="size-6 text-zinc-500" />
                </div>
              )}

              <label className="cursor-pointer inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-colors">
                <Upload className="size-3.5" />
                <span>{logoPreview ? "Change Logo" : "Upload Logo"}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 3. Website */}
          <div className="space-y-1.5">
            <Label
              htmlFor="org-website"
              className="text-xs font-medium text-zinc-300"
            >
              Website / Documentation URL (Optional)
            </Label>
            <div className="relative">
              <Globe className="size-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="org-website"
                type="url"
                placeholder="https://docs.acme.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="h-11 pl-10 text-xs sm:text-sm bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 rounded-lg"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Echo will use this address to connect your support articles and
              API references.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full h-11 text-xs sm:text-sm font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <span>Create Workspace & Continue</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
