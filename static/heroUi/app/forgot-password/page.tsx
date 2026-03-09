"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/apiUrl";
import {
  Button,
  Input,
  Link,
  Form,
  TextField,
  Label,
  InputOTP,
} from "@heroui/react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***@***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return local + "****" + domain;
  return local[0] + "****" + domain;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/forgot-password/send-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep("otp");
        setResendCooldown(60);
        const t = setInterval(() => {
          setResendCooldown((c) => {
            if (c <= 1) {
              clearInterval(t);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/forgot-password/send-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (value: string) => {
    setCode(value);
    if (value.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/forgot-password/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: value,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.reset_token) {
        setResetToken(data.data.reset_token);
        setStep("reset");
      } else {
        setError(data.error || "Invalid or expired code.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/forgot-password/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep("done");
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute redirectIfAuth="/discover">
      <div className="flex min-h-[80vh] w-full items-center justify-center py-8">
        <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
          <p className="text-left text-3xl font-semibold">Forgot password?</p>

          {step === "email" && (
            <>
              <p className="text-default-600 text-sm">
                Enter your email and we&apos;ll send you a 6-digit code to reset your password.
              </p>
              <Form className="flex flex-col gap-4" onSubmit={handleSendCode}>
                {error && (
                  <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <TextField
                  isRequired
                  name="email"
                  type="email"
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    setError("");
                  }}
                >
                  <Label>Email</Label>
                  <Input
                    placeholder="Enter your email"
                    variant="secondary"
                    autoComplete="email"
                  />
                </TextField>
                <Button
                  className="w-full bg-pink-500 text-white hover:bg-pink-600"
                  type="submit"
                  isPending={loading}
                >
                  Send code
                </Button>
              </Form>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Verify your email</Label>
                <p className="text-sm text-default-500">
                  We&apos;ve sent a code to {maskEmail(email)}
                </p>
              </div>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={handleVerifyCode}
                isDisabled={loading}
              >
                <InputOTP.Group>
                  <InputOTP.Slot index={0} />
                  <InputOTP.Slot index={1} />
                  <InputOTP.Slot index={2} />
                </InputOTP.Group>
                <InputOTP.Separator />
                <InputOTP.Group>
                  <InputOTP.Slot index={3} />
                  <InputOTP.Slot index={4} />
                  <InputOTP.Slot index={5} />
                </InputOTP.Group>
              </InputOTP>
              {error && (
                <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2 px-1 pt-1">
                <p className="text-sm text-default-500">Didn&apos;t receive a code?</p>
                <Link
                  className="text-foreground underline cursor-pointer"
                  onPress={handleResend}
                  isDisabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                </Link>
              </div>
            </>
          )}

          {step === "reset" && (
            <>
              <p className="text-default-600 text-sm">
                Enter your new password below.
              </p>
              <Form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
                {error && (
                  <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <TextField
                  isRequired
                  name="newPassword"
                  value={newPassword}
                  onChange={(v) => {
                    setNewPassword(v);
                    setError("");
                  }}
                >
                  <Label>New password</Label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    variant="secondary"
                    autoComplete="new-password"
                  />
                </TextField>
                <TextField
                  isRequired
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(v) => {
                    setConfirmPassword(v);
                    setError("");
                  }}
                >
                  <Label>Confirm password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    variant="secondary"
                    autoComplete="new-password"
                  />
                </TextField>
                <Button
                  className="w-full bg-pink-500 text-white hover:bg-pink-600"
                  type="submit"
                  isPending={loading}
                >
                  Reset password
                </Button>
              </Form>
            </>
          )}

          {step === "done" && (
            <>
              <div className="bg-success/10 text-success p-3 rounded-lg text-sm">
                Your password has been reset. You can now log in.
              </div>
              <Link href="/login" className="w-full">
                <Button className="w-full bg-pink-500 text-white hover:bg-pink-600">
                  Back to Log In
                </Button>
              </Link>
            </>
          )}

          <Link href="/login" className="text-pink-500 font-medium hover:underline text-sm">
            Back to Log In
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
