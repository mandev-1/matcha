"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ServerStatusModal } from "@/components/ServerStatusModal";

interface ServerStatusContextType {
  isServerOffline: boolean;
  setIsServerOffline: (offline: boolean) => void;
  checkServerStatus: () => Promise<void>;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [isServerOffline, setIsServerOffline] = useState(false);

  const checkServerStatus = useCallback(async () => {
    try {
      // Try a simple API call to check server status
      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok || response.status === 401) {
        // Server is online (401 is OK - just means not authenticated)
        setIsServerOffline(false);
      } else if (response.status >= 500) {
        // Server error
        setIsServerOffline(true);
      } else {
        // Other errors might be client-side, don't mark as offline
        setIsServerOffline(false);
      }
    } catch (error) {
      // Network error - server is likely offline
      setIsServerOffline(true);
    }
  }, [setIsServerOffline]);

  const handleRetry = useCallback(async () => {
    setIsServerOffline(false);
    await checkServerStatus();
  }, [checkServerStatus]);

  return (
    <ServerStatusContext.Provider
      value={{
        isServerOffline,
        setIsServerOffline,
        checkServerStatus,
      }}
    >
      {children}
      <ServerStatusModal isOpen={isServerOffline} onRetry={handleRetry} />
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus() {
  const context = useContext(ServerStatusContext);
  if (context === undefined) {
    throw new Error("useServerStatus must be used within a ServerStatusProvider");
  }
  return context;
}
