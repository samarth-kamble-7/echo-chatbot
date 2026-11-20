"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { EchoLogo } from "./logo";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <EchoLogo className="w-7 h-7" />
          <span className="text-sm font-semibold tracking-tight text-white">
            Echo Support
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link
            href="#integrations"
            className="hover:text-white transition-colors"
          >
            Integrations
          </Link>
          <Link href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/api/auth"
            className="h-9 px-3.5 inline-flex items-center justify-center text-xs font-medium text-zinc-300 hover:text-white rounded-md hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            href="#pricing"
            className="h-9 px-4 inline-flex items-center justify-center text-xs font-medium bg-zinc-100 text-zinc-950 rounded-md hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-zinc-400 hover:text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-[#09090b] px-6 py-4 space-y-3">
          <Link
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-zinc-300 hover:text-white py-1"
          >
            Features
          </Link>
          <Link
            href="#integrations"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-zinc-300 hover:text-white py-1"
          >
            Integrations
          </Link>
          <Link
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-zinc-300 hover:text-white py-1"
          >
            Pricing
          </Link>
          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <Link
              href="/api/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-center font-medium text-zinc-300 hover:text-white py-2 rounded-md border border-zinc-800"
            >
              Sign In
            </Link>
            <Link
              href="/api/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-center font-medium bg-zinc-100 text-zinc-950 py-2 rounded-md hover:bg-zinc-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
