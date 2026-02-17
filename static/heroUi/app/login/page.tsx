"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiUrl } from "@/lib/apiUrl";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Link } from "@heroui/link";
import { Form } from "@heroui/form";
import { Icon } from "@iconify/react";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isVisible, setIsVisible] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [emailNotVerified, setEmailNotVerified] = React.useState(false);
  const registered = searchParams.get("registered") === "true";

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleResendVerification = async () => {
    if (!username.trim()) {
      setError("Please enter your username first");
      return;
    }

    setResending(true);
    setError("");

    try {
      const response = await fetch(getApiUrl("/api/resend-verification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        setError("");
        setEmailNotVerified(false);
        setSuccess("Verification email sent! Please check your email.");
        setTimeout(() => {
          setSuccess("");
        }, 5000);
      } else {
        setError(data.error || "Failed to resend verification email");
        setEmailNotVerified(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setEmailNotVerified(false);

    // Basic required field check
    if (!username.trim() || !password) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if email is not verified
        if (data.data?.email_verified === false) {
          setEmailNotVerified(true);
          setError("");
          return;
        }

        // Store token and user in auth context
        if (data.data?.token && data.data?.user) {
          const userData = {
            id: data.data.user.id,
            username: data.data.user.username || username, // Fallback to form username if not in response
            email: data.data.user.email,
            set_up: data.data.user.set_up,
            is_setup: data.data.user.is_setup || false,
          };
          
          login(data.data.token, userData);
        }

        // Check if user needs to set up profile
        if (data.data?.user?.is_setup === false || data.data?.user?.is_setup === 0) {
          router.push("/runway");
        } else {
          router.push("/matcha");
        }
      } else {
        setError(data.error || "Login failed");
        setEmailNotVerified(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute redirectIfAuth="/matcha">
      <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="text-left text-3xl font-semibold">
          Log In
          <span aria-label="emoji" className="ml-2" role="img">
            👋
          </span>
        </p>

        {(registered && !error && !emailNotVerified && !success) && (
          <div className="bg-success/10 text-success p-3 rounded-lg text-sm">
            Registration successful! Please check your email for verification link.
          </div>
        )}

        {success && (
          <div className="bg-success/10 text-success p-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {emailNotVerified && (
          <div className="bg-warning/10 text-warning p-3 rounded-lg text-sm">
            You did not verify your email yet.{" "}
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="underline font-semibold hover:opacity-80 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Click this link to resend email verification"}
            </button>
          </div>
        )}

        {error && !emailNotVerified && (
          <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Form className="flex flex-col gap-4" validationBehavior="native" onSubmit={handleSubmit}>
          <Input
            isRequired
            label="Username"
            labelPlacement="outside"
            name="username"
            placeholder="Enter your username"
            type="text"
            variant="bordered"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError("");
              if (success) setSuccess("");
            }}
            autoComplete="username"
          />
          <Input
            isRequired
            inputMode="text"
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="text-default-400 pointer-events-none text-2xl"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            label="Password"
            labelPlacement="outside"
            name="password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            variant="bordered"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
              if (success) setSuccess("");
            }}
            autoComplete="current-password"
          />
          <div className="flex w-full items-center justify-between px-1 py-2">
            <Checkbox defaultSelected name="remember" size="sm">
              Remember me
            </Checkbox>
            <Link className="text-default-500" href="#" size="sm">
              Forgot password?
            </Link>
          </div>
          <Button className="w-full bg-pink-500 text-white hover:bg-pink-600" type="submit" isLoading={loading}>
            Log In
          </Button>
        </Form>
        <p className="text-small text-center">
          <Link href="/register" size="sm">
            Create an account
          </Link>
        </p>
      </div>
    </div>
    </ProtectedRoute>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

