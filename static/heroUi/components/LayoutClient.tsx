"use client";

import { usePathname } from "next/navigation";
import { ScrollShadow, Toast } from "@heroui/react";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoginStatus } from "@/components/LoginStatus";
import { LocationMiddleware } from "@/components/LocationMiddleware";
import { HelpDrawer } from "@/components/HelpDrawer";
import { NotificationPanel } from "@/components/NotificationPanel";
import { SetupGuard } from "@/components/SetupGuard";
import { useAuth } from "@/contexts/AuthContext";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const sidebarVisible =
    isAuthenticated &&
    !pathname?.startsWith("/login") &&
    !pathname?.startsWith("/register") &&
    !pathname?.startsWith("/sign-up");

  return (
    <>
      <Toast.Provider />
      <LocationMiddleware>
        <SetupGuard>
          <div className="relative flex flex-row h-full min-h-screen w-full max-w-[100vw] overflow-x-hidden">
            <Sidebar />
            <div
              className={`flex-1 flex flex-col min-w-0 w-full max-w-full h-full pb-20 md:pb-0 overflow-x-hidden ${sidebarVisible ? "md:ml-20" : ""}`}
            >
              <Navbar />
              <ScrollShadow className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" size={100}>
                <main className="container mx-auto max-w-7xl w-full px-3 sm:px-4 md:px-6 py-4 min-h-0 pb-24 md:pb-4">
                  {children}
                </main>
              </ScrollShadow>
              {/* Mobile: fixed above bottom nav. Desktop: in flow at end of content. */}
              <footer className="md:relative fixed bottom-16 left-0 right-0 z-30 md:bottom-auto md:mt-auto w-full border-t border-default-200 dark:border-default-100 bg-background/95 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none py-2 md:py-4">
                <div className="container mx-auto max-w-7xl px-3 md:px-6">
                  <p className="text-[10px] md:text-xs text-default-500 text-center leading-tight">
                    © 2026 Matcha Project. This is a matcha project created in 2026, all data is collected just for exploration purposes and accounts may be AI generated to simulate traffic. Please do not enter your information as it may be sent to LLMs or leaked on internet as a result. Thank you.
                  </p>
                </div>
              </footer>
            </div>
            <NotificationPanel />
            <LoginStatus />
            <HelpDrawer />
          </div>
        </SetupGuard>
      </LocationMiddleware>
    </>
  );
}
