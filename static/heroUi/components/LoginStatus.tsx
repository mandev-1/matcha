"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@heroui/button";
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
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-default-100 border border-default-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
        <span className="text-sm text-default-600">
          Logged in as <span className="font-semibold text-foreground">{displayUsername}</span>
        </span>
        <Button
          size="sm"
          variant="light"
          onPress={handleLogout}
          className="text-xs"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

