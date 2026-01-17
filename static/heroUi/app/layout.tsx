import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { LoginStatus } from "@/components/LoginStatus";
import { ThemeSwitch } from "@/components/theme-switch";
import { ScrollShadow } from "@heroui/scroll-shadow";

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
          <div className="relative flex flex-col h-full">
            <Navbar />
            <ScrollShadow className="flex-1 overflow-y-auto" size={100}>
              <main className="container mx-auto max-w-7xl px-6 h-full">
                {children}
              </main>
            </ScrollShadow>
            <div className="fixed bottom-4 left-[76px] z-50">
              <ThemeSwitch />
            </div>
            <LoginStatus />
          </div>
        </Providers>
      </body>
    </html>
  );
}
