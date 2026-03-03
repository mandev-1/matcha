import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";
import { LayoutClient } from "@/components/LayoutClient";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { ServerStatusProvider } from "@/contexts/ServerStatusContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ChatHintProvider } from "@/contexts/ChatHintContext";
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
          <ServerStatusProvider>
            <NotificationProvider>
              <ChatHintProvider>
                <NewMessageToaster />
                <LayoutClient>{children}</LayoutClient>
              </ChatHintProvider>
            </NotificationProvider>
          </ServerStatusProvider>
        </Providers>
      </body>
    </html>
  );
}
