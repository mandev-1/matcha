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
            <LocationMiddleware>
            <div className="relative flex flex-row h-full">
              <Sidebar />
              <div className="flex-1 flex flex-col ml-20 h-full">
                <Navbar />
                <ScrollShadow className="flex-1 overflow-y-auto" size={100}>
                  <main className="container mx-auto max-w-7xl px-1 md:px-6 h-full">
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
              <div className="fixed bottom-4 left-24 z-50">
                <ThemeSwitch />
              </div>
              <LoginStatus />
              <HelpDrawer />
            </div>
          </LocationMiddleware>
          </ServerStatusProvider>
        </Providers>
      </body>
    </html>
  );
}
