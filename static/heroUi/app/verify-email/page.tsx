"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! You can now log in.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The token may be invalid or expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("An error occurred during verification. Please try again.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex h-full w-full items-center justify-center min-h-screen">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10 text-center">
        <h1 className="text-3xl font-semibold mb-4">Email Verification</h1>
        
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            <p className="text-default-500">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl">✅</div>
            <p className="text-success">{message}</p>
            <Button
              as={Link}
              href="/login"
              className="w-full bg-pink-500 text-white hover:bg-pink-600"
            >
              Go to Login
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl">❌</div>
            <p className="text-danger">{message}</p>
            <div className="flex gap-2">
              <Button
                as={Link}
                href="/login"
                variant="bordered"
                className="flex-1"
              >
                Go to Login
              </Button>
              <Button
                as={Link}
                href="/register"
                className="flex-1 bg-pink-500 text-white hover:bg-pink-600"
              >
                Sign Up Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

