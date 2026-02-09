import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/Sidebar";
import { LoginStatus } from "@/components/LoginStatus";
import { ThemeSwitch } from "@/components/theme-switch";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { ToastProvider } from "@heroui/toast";
import { LocationMiddleware } from "@/components/LocationMiddleware";
import { HelpDrawer } from "@/components/HelpDrawer";
import { ServerStatusProvider } from "@/contexts/ServerStatusContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ChatHintProvider } from "@/contexts/ChatHintContext";
import { NotificationPanel } from "@/components/NotificationPanel";
import { NewMessageToaster } from "@/components/NewMessageToaster";

export const metadata: Metadata = {
  title: {
    default: "Matcha",
    template: `%s - Matcha`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "h-screen text-foreground bg-background font-sans antialiased overflow-y-auto",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ToastProvider />
          <ServerStatusProvider>
            <NotificationProvider>
            <ChatHintProvider>
            <NewMessageToaster />
            <LocationMiddleware>
            <div className="relative flex flex-row h-full min-w-0">
              <Sidebar />
              <div className="flex-1 flex flex-col ml-0 md:ml-20 h-full min-w-0 pb-20 md:pb-0">
                <Navbar />
                <ScrollShadow className="flex-1 overflow-y-auto" size={100}>
                  <main className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-6 h-full min-h-0">
                    {children}
                  </main>
                </ScrollShadow>
                <footer className="w-full border-t border-default-200 dark:border-default-100 py-4 mt-auto">
                  <div className="container mx-auto max-w-7xl px-1 md:px-6">
                    <p className="text-xs text-default-500 text-center">
                      © 2026 Matcha Project. This is a matcha project created in 2026, all data is collected just for exploration purposes and accounts may be AI generated to simulate traffic. Please do not enter your information as it may be sent to LLMs or leaked on internet as a result. Thank you.
                    </p>
                  </div>
                </footer>
              </div>
              <NotificationPanel />
              <LoginStatus />
              <HelpDrawer />
            </div>
          </LocationMiddleware>
            </ChatHintProvider>
          </NotificationProvider>
          </ServerStatusProvider>
        </Providers>
      </body>
    </html>
  );
}
