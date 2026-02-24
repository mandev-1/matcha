"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSetup?: boolean;
  redirectIfAuth?: string; // Redirect if authenticated (for login/register pages)
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireSetup = false,
  redirectIfAuth,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If page requires auth but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // If user is authenticated but needs to set up profile
    if (isAuthenticated && requireSetup && user && !user.is_setup) {
      router.push("/runway");
      return;
    }

    // If user is authenticated and tries to access login/register, redirect
    if (isAuthenticated && redirectIfAuth) {
      router.push(user && !user.is_setup ? "/runway" : redirectIfAuth);
      return;
    }
  }, [isAuthenticated, user, requireAuth, requireSetup, redirectIfAuth, router]);

  // Show loading or nothing while redirecting
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (isAuthenticated && requireSetup && user && !user.is_setup) {
    return null;
  }

  if (isAuthenticated && redirectIfAuth) {
    return null; // Redirecting to runway or matcha
  }

  return <>{children}</>;
}

