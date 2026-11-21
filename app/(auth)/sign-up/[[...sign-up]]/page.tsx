"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useUser } from "@clerk/nextjs";
import { ArrowRight, Check, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { OAuthButton } from "@/components/auth/oauth-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthError } from "@/components/auth/auth-error";
import { AuthInput } from "@/components/auth/auth-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CustomSignUpPage() {
  const { signUp } = useSignUp();
  const { isSignedIn, isLoaded } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
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
    if (!signUp) {
      setError("Authentication is initializing. Please try again.");
      return;
    }
    try {
      await signUp.sso({
        strategy,
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/",
      });
    } catch (err: any) {
      setError(err?.message || `Failed to initiate ${strategy.replace("oauth_", "")} sign up.`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) {
      setError("Authentication service is initializing. Please try again.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await signUp.password({
        emailAddress: email,
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

      const sendRes = await signUp.verifications.sendEmailCode();
      if (sendRes.error) {
        setError(sendRes.error.message);
        return;
      }

      setPendingVerification(true);
    } catch (err: any) {
      const msg = err?.message || "Failed to create account.";
      if (msg.toLowerCase().includes("already signed in")) {
        router.replace("/");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setError("");

    try {
      const verifyRes = await signUp.verifications.verifyEmailCode({
        code,
      });

      if (verifyRes.error) {
        setError(verifyRes.error.message);
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize();
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoaded && isSignedIn) {
    return null;
  }

  if (pendingVerification) {
    return (
      <AuthShell
        mode="sign-up"
        title="Check Your Inbox"
        subtitle={`We sent a 6-digit confirmation code to ${email}`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>Enter the 6-digit code to verify your email and activate your workspace.</span>
          </div>

          <AuthError message={error} />

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="verification-code" className="text-xs font-medium text-zinc-300">
                Verification Code
              </Label>
              <Input
                id="verification-code"
                type="text"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="h-11 text-center font-mono tracking-widest text-base bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 rounded-lg"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-xs sm:text-sm font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Verify Code</span>
                  <Check className="size-4" />
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Use a different email address
              </button>
            </div>
          </form>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      mode="sign-up"
      title="Get Started Now"
      subtitle="Create your account to start building AI support bots."
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

        <form onSubmit={handleSignUp} className="space-y-4">
          <AuthInput
            label="Work Email"
            id="signup-email"
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
            id="signup-password"
            isPassword
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            minLength={6}
            icon={<Lock className="size-4" />}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-xs sm:text-sm font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
