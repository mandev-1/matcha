"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Card, CardBody } from "@heroui/card";
import { Icon } from "@iconify/react";
import { getApiUrl } from "@/lib/apiUrl";

function VerifyEmailContent() {
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
        const response = await fetch(getApiUrl(`/api/verify-email?token=${token}`));
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
    <div className="flex h-full w-full items-center justify-center min-h-screen bg-gradient-to-br from-pink-500/5 via-background to-purple-500/5">
      <Card className="w-full max-w-md mx-4 shadow-xl border border-default-200/50 dark:border-default-100/20">
        <CardBody className="p-8 md:p-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-pink-500/10 dark:bg-pink-500/20">
              <Icon
                icon="solar:letter-bold"
                className="text-6xl text-pink-500"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Email Verification
            </h1>

            {status === "verifying" && (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-14 w-14 border-2 border-primary/30 border-t-pink-500"></div>
                  <Icon
                    icon="solar:letter-bold"
                    className="absolute inset-0 m-auto text-2xl text-pink-500/5"
                  />
                </div>
                <p className="text-default-500 max-w-xs">{message}</p>
                <p className="text-xs text-default-400">This usually takes a few seconds...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-6 py-2">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-success/20 border-2 border-success/30 animate-in zoom-in duration-300">
                  <Icon icon="solar:check-circle-bold" className="text-5xl text-success" />
                </div>
                <p className="text-success font-medium text-lg">{message}</p>
                <Button
                  as={Link}
                  href="/login"
                  className="w-full bg-pink-500 text-white hover:bg-pink-600 font-semibold"
                  size="lg"
                  startContent={<Icon icon="solar:login-2-bold" />}
                >
                  Go to Login
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-6 py-2">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-danger/20 border-2 border-danger/30">
                  <Icon icon="solar:close-circle-bold" className="text-5xl text-danger" />
                </div>
                <p className="text-danger font-medium max-w-sm">{message}</p>
                <div className="flex gap-3 w-full">
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
        </CardBody>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center min-h-screen">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

