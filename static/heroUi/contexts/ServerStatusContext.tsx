"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
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
      const response = await fetch("/api/health", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setIsServerOffline(false);
      } else if (response.status >= 500) {
        setIsServerOffline(true);
      } else {
        // 404 or other client error: don't show offline modal
        setIsServerOffline(false);
      }
    } catch {
      setIsServerOffline(true);
    }
  }, []);

  const handleRetry = useCallback(async () => {
    setIsServerOffline(false);
    await checkServerStatus();
  }, [checkServerStatus]);

  // Check server on mount and when window regains focus so the modal shows on all pages
  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);

  useEffect(() => {
    const onFocus = () => checkServerStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
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
