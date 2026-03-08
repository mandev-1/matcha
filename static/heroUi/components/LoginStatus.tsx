"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

export function LoginStatus() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Ensure username is available - check both user.username and fallback
  const displayUsername = user?.username || "User";

  return (
    <div className="hidden md:block fixed bottom-4 right-4 z-[100] pointer-events-none">
      <div className="pointer-events-auto bg-default-200/80 dark:bg-default-100/80 backdrop-blur-md border border-default-300/80 dark:border-default-200/80 rounded-lg px-4 py-2 shadow-xl flex items-center gap-3">
        <span className="text-sm text-default-600">
          <span className="font-medium text-green-600 dark:text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
            Logged in
          </span>{" "}
          as <span className="font-semibold text-foreground">{displayUsername}</span>
        </span>
        <Button
          size="sm"
          variant="ghost"
          onPress={handleLogout}
          className="text-xs"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

