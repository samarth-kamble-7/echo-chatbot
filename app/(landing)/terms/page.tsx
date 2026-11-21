import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | Echo Support",
  description: "Terms and Conditions for using the Echo Support platform and services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Echo Support</span>
        </Link>

        <header className="border-b border-zinc-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Terms and Conditions
          </h1>
          <p className="text-xs font-mono text-zinc-500">
            Last updated: November 20, 2026
          </p>
        </header>

        <section className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300">
          <h2 className="text-base font-semibold text-white">1. Service Overview</h2>
          <p>
            Echo Support (&quot;we&quot;, &quot;us&quot;, or &quot;the Service&quot;) provides automated chatbot builder infrastructure that crawls, parses, and indexes client documentation, help articles, and technical specifications to generate automated conversational customer support responses.
          </p>

          <h2 className="text-base font-semibold text-white">2. Acceptable Use</h2>
          <p>
            You agree not to use the Service to ingest confidential third-party data without authorization, generate misleading, abusive, or unlawful content, or probe the Service for vulnerabilities without prior written consent.
          </p>

          <h2 className="text-base font-semibold text-white">3. Customer Data and Intellectual Property</h2>
          <p>
            You retain all rights, title, and interest in and to your documentation and content submitted to Echo Support. We do not use your proprietary documentation or customer interaction logs to train public foundation models without your explicit opt-in.
          </p>

          <h2 className="text-base font-semibold text-white">4. Availability and Service Level</h2>
          <p>
            We strive to maintain high availability across our API and widget delivery networks. Scheduled maintenance windows will be communicated via our status updates.
          </p>

          <h2 className="text-base font-semibold text-white">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Echo Support shall not be liable for indirect, incidental, special, consequential, or punitive damages resulting from the use of or inability to use the Service.
          </p>
        </section>
      </div>
    </div>
  );
}
