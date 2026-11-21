import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Echo Support",
  description: "Privacy Policy for Echo Support services and customer data handling.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-zinc-500">
            Last updated: November 20, 2026
          </p>
        </header>

        <section className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300">
          <h2 className="text-base font-semibold text-white">1. Information We Collect</h2>
          <p>
            We collect account information (such as name, email address, and authentication credentials) and documentation data that you explicitly configure for automated indexing.
          </p>

          <h2 className="text-base font-semibold text-white">2. How Data is Used</h2>
          <p>
            Indexed documentation is converted to text chunks and vector embeddings strictly to fulfill query retrieval in your chat widget. We do not sell or monetize your data.
          </p>

          <h2 className="text-base font-semibold text-white">3. Data Retention and Security</h2>
          <p>
            All data in transit is encrypted using TLS 1.3, and data at rest is encrypted using AES-256. Customers may request complete deletion of their indexed documents and project telemetry at any time.
          </p>

          <h2 className="text-base font-semibold text-white">4. Contact Information</h2>
          <p>
            If you have questions regarding this Privacy Policy or your data, please contact privacy@echo.io.
          </p>
        </section>
      </div>
    </div>
  );
}
