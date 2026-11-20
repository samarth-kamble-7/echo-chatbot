import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Echo Support | Customer Support Chatbot Builder",
  description:
    "Index your product documentation, API references, and help centers to answer customer questions accurately with strict guardrails.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.className} bg-[#09090b] min-h-screen flex flex-col p-0 antialiased text-zinc-100 selection:bg-zinc-800 font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
