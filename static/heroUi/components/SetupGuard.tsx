"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/** Paths that unconfigured users are allowed to visit (home "/" redirects via page.tsx) */
const ALLOWED_WHEN_NOT_SETUP = ["/", "/runway", "/login", "/register", "/sign-up", "/verify-email"];

/**
 * Always redirects authenticated users without a configured profile to /runway.
 * Runs globally so no page can be accessed without profile setup.
 */
export function SetupGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !user) return;
    if (user.is_setup) return;

    const path = pathname ?? "";
    const isAllowed = ALLOWED_WHEN_NOT_SETUP.some(
      (p) => path === p || path.startsWith(p + "/")
    );
    if (isAllowed) return;

    router.replace("/runway");
  }, [isInitialized, isAuthenticated, user, pathname, router]);

  return <>{children}</>;
}
