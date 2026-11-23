"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn, useUser } from "@clerk/nextjs";
import { ArrowLeft, Check, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthError } from "@/components/auth/auth-error";
import { AuthInput } from "@/components/auth/auth-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const { signIn } = useSignIn();
  const { isSignedIn, isLoaded } = useUser();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, redirect away immediately
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) {
      setError("Authentication service is initializing. Please try again.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const createRes = await signIn.create({
        identifier: email,
      });

      if (createRes?.error) {
        if (createRes.error.message?.toLowerCase().includes("already signed in")) {
          window.location.href = "/";
          return;
        }
        setError(createRes.error.message);
        return;
      }

      const sendRes = await signIn.resetPasswordEmailCode.sendCode();
      if (sendRes?.error) {
        setError(sendRes.error.message);
        return;
      }

      setStep("code");
    } catch (err: any) {
      const msg = err?.message || "Failed to send reset code. Please verify your email.";
      if (msg.toLowerCase().includes("already signed in")) {
        window.location.href = "/";
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const verifyRes = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (verifyRes?.error) {
        setError(verifyRes.error.message);
        return;
      }

      const submitRes = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
      });

      if (submitRes?.error) {
        setError(submitRes.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. Please verify the code.");
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
      title={step === "email" ? "Reset Password" : "Create New Password"}
      subtitle={
        step === "email"
          ? "Enter your email to receive a 6-digit verification code."
          : `Enter the code sent to ${email} and choose a new password.`
      }
    >
      <div className="space-y-4">
        {step === "code" && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>We sent a 6-digit recovery code to {email}.</span>
          </div>
        )}

        <AuthError message={error} />

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <AuthInput
              label="Account Email"
              id="reset-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              icon={<Mail className="size-4" />}
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
                  <span>Send Recovery Code</span>
                  <Check className="size-4" />
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-code" className="text-xs font-medium text-zinc-300">
                6-Digit Verification Code
              </Label>
              <Input
                id="reset-code"
                type="text"
                required
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                maxLength={6}
                className="h-11 tracking-widest text-center text-lg font-mono bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 rounded-lg"
              />
            </div>

            <AuthInput
              label="New Password"
              id="reset-new-password"
              isPassword
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="size-4" />}
            />

            <AuthInput
              label="Confirm New Password"
              id="reset-confirm-password"
              isPassword
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="size-4" />}
            />

            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full h-11 text-xs sm:text-sm font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Reset Password</span>
                  <Check className="size-4" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Change email
              </button>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
