"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiUrl } from "@/lib/apiUrl";
import { Button, Input, InputGroup, Form, TextField, Label } from "@heroui/react";
import { Icon } from "@iconify/react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token?.trim()) {
      setError("Invalid or missing reset link. Request a new link from your profile.");
      return;
    }
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
          reset_token: token.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.replace("/login?reset=success");
      } else {
        setError(data.error || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token?.trim()) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center py-8">
        <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
          <h1 className="text-2xl font-semibold text-foreground">Reset password</h1>
          <p className="text-default-500 text-sm">
            This link is invalid or has expired. From your profile, use &quot;Reset password&quot; to receive a new link by email.
          </p>
          <Button variant="secondary" onPress={() => router.push("/login")}>
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center py-8">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <h1 className="text-2xl font-semibold text-foreground">Set new password</h1>
        <p className="text-default-500 text-sm">
          Enter your new password below. It must be at least 8 characters.
        </p>
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <TextField
            isRequired
            name="newPassword"
            value={newPassword}
            onChange={(v) => { setNewPassword(v); setError(""); }}
          >
            <Label>New password</Label>
            <InputGroup variant="secondary">
              <InputGroup.Input
                placeholder="Enter new password"
                type={isVisible ? "text" : "password"}
                autoComplete="new-password"
              />
              <InputGroup.Suffix>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsVisible(!isVisible)}
                  className="min-w-8 w-8 h-8 p-0"
                  aria-label={isVisible ? "Hide password" : "Show password"}
                >
                  <Icon className="text-xl text-default-400" icon={isVisible ? "solar:eye-closed-linear" : "solar:eye-bold"} />
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>
          <TextField
            isRequired
            name="confirmPassword"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); setError(""); }}
            isInvalid={!!confirmPassword && newPassword !== confirmPassword}
          >
            <Label>Confirm new password</Label>
            <InputGroup variant="secondary">
              <InputGroup.Input
                placeholder="Confirm new password"
                type={isConfirmVisible ? "text" : "password"}
                autoComplete="new-password"
              />
              <InputGroup.Suffix>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsConfirmVisible(!isConfirmVisible)}
                  className="min-w-8 w-8 h-8 p-0"
                  aria-label={isConfirmVisible ? "Hide password" : "Show password"}
                >
                  <Icon className="text-xl text-default-400" icon={isConfirmVisible ? "solar:eye-closed-linear" : "solar:eye-bold"} />
                </Button>
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-danger">Passwords do not match</p>
          )}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isPending={loading}
            isDisabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
          >
            Set new password
          </Button>
        </Form>
        <p className="text-center text-sm text-default-500">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
