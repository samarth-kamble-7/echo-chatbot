"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn, useUser } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { OAuthButton } from "@/components/auth/oauth-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthError } from "@/components/auth/auth-error";
import { AuthInput } from "@/components/auth/auth-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function CustomSignInPage() {
  const { signIn } = useSignIn();
  const { isSignedIn, isLoaded } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // 2FA / Device Trust state
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<"email_code" | "phone_code" | "totp">("email_code");
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, redirect away immediately to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
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
        redirectUrl: "/dashboard",
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
      // Use signIn.password to authenticate password credentials directly
      const res = await signIn.password({
        identifier: email.trim(),
        password,
      });

      if (res?.error) {
        if (res.error.message?.toLowerCase().includes("already signed in")) {
          window.location.href = "/dashboard";
          return;
        }
        setError(res.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();
        window.location.href = "/dashboard";
        return;
      }

      // Check if sign in requires verification (needs_client_trust, needs_first_factor, needs_second_factor)
      const currentStatus = (signIn.status as string) || "";
      if (
        currentStatus === "needs_first_factor" ||
        currentStatus === "needs_second_factor" ||
        currentStatus === "needs_client_trust" ||
        (signIn as any).firstFactorVerification?.status === "unverified"
      ) {
        const hasEmail =
          signIn.supportedSecondFactors?.some((f) => f.strategy === "email_code") ||
          signIn.supportedFirstFactors?.some((f) => f.strategy === "email_code") ||
          (signIn as any).firstFactorVerification?.strategy === "email_code" ||
          currentStatus === "needs_client_trust";

        const hasPhone =
          signIn.supportedSecondFactors?.some((f) => f.strategy === "phone_code") ||
          signIn.supportedFirstFactors?.some((f) => f.strategy === "phone_code");

        const hasTotp =
          signIn.supportedSecondFactors?.some((f) => f.strategy === "totp");

        if (hasEmail || (!hasPhone && !hasTotp)) {
          // In Clerk Future API, email verification is triggered via signIn.emailCode
          try {
            if (typeof signIn.emailCode?.sendCode === "function") {
              await signIn.emailCode.sendCode({ emailAddress: email.trim() });
            }
          } catch (sendErr) {
            console.warn("Notice triggering email code:", sendErr);
          }
          setSecondFactorStrategy("email_code");
          setNeedsSecondFactor(true);
          return;
        } else if (hasPhone) {
          try {
            if (typeof signIn.phoneCode?.sendCode === "function") {
              await signIn.phoneCode.sendCode({});
            } else if (typeof signIn.mfa?.sendPhoneCode === "function") {
              await signIn.mfa.sendPhoneCode();
            }
          } catch (phoneErr) {
            console.warn("Notice triggering phone code:", phoneErr);
          }
          setSecondFactorStrategy("phone_code");
          setNeedsSecondFactor(true);
          return;
        } else if (hasTotp) {
          setSecondFactorStrategy("totp");
          setNeedsSecondFactor(true);
          return;
        }
      }

      setError("Unable to complete sign in. Please verify your credentials.");
    } catch (err: any) {
      const msg = err?.message || "Invalid email or password.";
      if (msg.toLowerCase().includes("already signed in")) {
        window.location.href = "/dashboard";
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSecondFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setLoading(true);
    setError("");

    try {
      let verifyRes: any;
      if (secondFactorStrategy === "email_code") {
        if (typeof signIn.emailCode?.verifyCode === "function") {
          verifyRes = await signIn.emailCode.verifyCode({ code: code.trim() });
        } else if (typeof (signIn.mfa as any)?.verifyEmailCode === "function") {
          verifyRes = await (signIn.mfa as any).verifyEmailCode({ code: code.trim() });
        }
      } else if (secondFactorStrategy === "phone_code") {
        if (typeof signIn.phoneCode?.verifyCode === "function") {
          verifyRes = await signIn.phoneCode.verifyCode({ code: code.trim() });
        } else if (typeof signIn.mfa?.verifyPhoneCode === "function") {
          verifyRes = await signIn.mfa.verifyPhoneCode({ code: code.trim() });
        }
      } else if (secondFactorStrategy === "totp") {
        if (typeof signIn.mfa?.verifyTOTP === "function") {
          verifyRes = await signIn.mfa.verifyTOTP({ code: code.trim() });
        }
      }

      if (verifyRes?.error) {
        setError(verifyRes.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();
        window.location.href = "/dashboard";
        return;
      }

      setError("Verification incomplete. Please check the code.");
    } catch (err: any) {
      setError(err?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signIn) return;
    setResending(true);
    setError("");
    try {
      if (secondFactorStrategy === "email_code") {
        if (typeof signIn.emailCode?.sendCode === "function") {
          await signIn.emailCode.sendCode({ emailAddress: email.trim() });
        }
      } else if (secondFactorStrategy === "phone_code") {
        if (typeof signIn.phoneCode?.sendCode === "function") {
          await signIn.phoneCode.sendCode({});
        } else if (typeof signIn.mfa?.sendPhoneCode === "function") {
          await signIn.mfa.sendPhoneCode();
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  if (isLoaded && isSignedIn) {
    return null;
  }

  // 2FA / Device Trust Verification Screen
  if (needsSecondFactor) {
    return (
      <AuthShell
        mode="sign-in"
        title="Verify It's You"
        subtitle={
          secondFactorStrategy === "totp"
            ? "Enter the code from your authenticator app"
            : `We sent a 6-digit confirmation code to ${email}`
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span>
              {secondFactorStrategy === "totp"
                ? "Enter your 6-digit authenticator code to verify device access."
                : "Enter the 6-digit code sent to your email to trust this device."}
            </span>
          </div>

          <AuthError message={error} />

          <form onSubmit={handleSecondFactorSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signin-2fa-code" className="text-xs font-medium text-zinc-300">
                Verification Code
              </Label>
              <Input
                id="signin-2fa-code"
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

            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full h-11 text-xs sm:text-sm font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Verify & Sign In</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between pt-1">
              {secondFactorStrategy !== "totp" && (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending || loading}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setNeedsSecondFactor(false);
                  setCode("");
                  setError("");
                }}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto"
              >
                Back to sign in
              </button>
            </div>
          </form>
        </div>
      </AuthShell>
    );
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
