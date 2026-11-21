"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn, useUser } from "@clerk/nextjs";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { OAuthButton } from "@/components/auth/oauth-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthError } from "@/components/auth/auth-error";
import { AuthInput } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function CustomSignInPage() {
  const { signIn } = useSignIn();
  const { isSignedIn, isLoaded } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, redirect away immediately
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    if (!signIn) {
      setError("Authentication is initializing. Please try again.");
      return;
    }
    try {
      await signIn.sso({
        strategy,
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/",
      });
    } catch (err: any) {
      setError(err?.message || `Failed to initiate ${strategy.replace("oauth_", "")} sign in.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) {
      setError("Authentication service is initializing. Please try again.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await signIn.create({
        identifier: email,
        password,
      });

      if (res.error) {
        if (res.error.message?.toLowerCase().includes("already signed in")) {
          router.replace("/");
          return;
        }
        setError(res.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();
        router.push("/");
      }
    } catch (err: any) {
      const msg = err?.message || "Invalid email or password.";
      if (msg.toLowerCase().includes("already signed in")) {
        router.replace("/");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoaded && isSignedIn) {
    return null;
  }

  return (
    <AuthShell
      mode="sign-in"
      title="Welcome Back"
      subtitle="Sign in to access your Echo Support dashboard."
    >
      <div className="space-y-4">
        {/* Dual Social Logins: Google and Apple */}
        <div className="grid grid-cols-2 gap-3">
          <OAuthButton
            provider="google"
            onClick={() => handleOAuth("oauth_google")}
            disabled={loading}
            label="Google"
          />
          <OAuthButton
            provider="apple"
            onClick={() => handleOAuth("oauth_apple")}
            disabled={loading}
            label="Apple"
          />
        </div>

        <AuthDivider label="or" />

        <AuthError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            label="Email"
            id="signin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            icon={<Mail className="size-4" />}
          />

          <AuthInput
            label="Password"
            id="signin-password"
            isPassword
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="size-4" />}
          />

          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 cursor-pointer select-none">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                className="border-zinc-700 bg-zinc-900 data-checked:bg-white data-checked:text-zinc-950"
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-xs sm:text-sm font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
