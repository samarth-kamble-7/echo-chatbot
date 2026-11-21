import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark as any,
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#0c0c0e",
          colorDanger: "#ef4444",
          colorNeutral: "#ffffff",
          borderRadius: "0.625rem",
        },
        elements: {
          userPreviewMainIdentifier: "text-white font-medium",
          userPreviewSecondaryIdentifier: "text-zinc-300 font-normal",
          userButtonPopoverCard:
            "border border-zinc-800 bg-[#0c0c0e] shadow-2xl rounded-xl text-zinc-100",
          userButtonPopoverActionButton:
            "hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors",
          userButtonPopoverActionButtonText: "text-xs font-normal text-zinc-200",
          userButtonPopoverActionButtonIcon: "text-zinc-400 size-4",
          userButtonPopoverFooter: "border-t border-zinc-800/80 bg-zinc-950/60 text-zinc-500",
          userProfileModalCard:
            "border border-zinc-800 bg-[#0c0c0e] shadow-2xl rounded-2xl text-zinc-100",
          userProfileModalNavbar: "border-r border-zinc-800 bg-[#09090b]",
          modalBackdrop: "bg-black/70 backdrop-blur-sm",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${dmSans.className} bg-[#09090b] min-h-screen flex flex-col p-0 antialiased text-zinc-100 selection:bg-zinc-800 font-sans`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
