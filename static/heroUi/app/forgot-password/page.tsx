"use client";

import React from "react";
import { Link } from "@heroui/react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function ForgotPasswordPage() {
  return (
    <ProtectedRoute redirectIfAuth="/matcha">
      <div className="flex min-h-[80vh] w-full items-center justify-center py-8">
        <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
          <p className="text-left text-3xl font-semibold">Forgot password?</p>
          <p className="text-default-600 text-sm">
            Password reset is not available yet. If you need help accessing your account, please contact support.
          </p>
          <Link href="/login" className="text-pink-500 font-medium hover:underline">
            Back to Log In
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
