"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Link } from "@heroui/link";
import { Form } from "@heroui/form";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/profile");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="text-left text-3xl font-semibold">
          Log In
          <span aria-label="emoji" className="ml-2" role="img">
            👋
          </span>
        </p>

        {error && (
          <div className="bg-danger/10 text-danger pb-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Form className="flex flex-col gap-4" validationBehavior="native" onSubmit={handleSubmit}>
          <Input
            isRequired
            label="Email"
            labelPlacement="outside"
            name="email"
            placeholder="Enter your email"
            type="email"
            variant="bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            isRequired
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
            onChange={(e) => setPassword(e.target.value)}
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
  );
}

