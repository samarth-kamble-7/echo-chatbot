import React from "react";
import Link from "next/link";
import { EchoLogo } from "./logo";

export const Footer = () => {
  return (
    <footer className="border-t border-zinc-800 bg-[#09090b] text-zinc-400 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <EchoLogo className="w-6 h-6" />
              <span className="text-sm font-semibold tracking-tight text-white">
                Echo Support
              </span>
            </Link>
            <p className="text-zinc-500 max-w-sm leading-relaxed">
              Customer support chatbot builder grounded strictly in your verified documentation and APIs.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <p className="font-mono uppercase tracking-wider text-zinc-300">Product</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#integrations" className="hover:text-white transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-2">
            <p className="font-mono uppercase tracking-wider text-zinc-300">Legal</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>&copy; 2026 Echo Support. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
