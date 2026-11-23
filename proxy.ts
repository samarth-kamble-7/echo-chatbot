import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password(.*)",
  "/sso-callback(.*)",
  "/api/webhooks(.*)",
  "/terms(.*)",
  "/privacy(.*)",
]);

// Auth routes that should NOT be accessible when already logged in
const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password(.*)",
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  // Allow pending sessions (e.g. users who have not yet completed choose-organization onboarding)
  const { userId } = await auth({ treatPendingAsSignedOut: false });

  // 1. If user is already logged in and attempts to access auth pages, redirect to dashboard
  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Protect non-public routes: if user is not logged in, redirect directly to /sign-in
  if (!isPublicRoute(request) && !userId) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }
});

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
