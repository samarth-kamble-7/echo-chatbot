import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already logged in, redirect them to the home page / dashboard
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full bg-[#050509] text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-zinc-800 selection:text-white">
      {children}
    </div>
  );
}
