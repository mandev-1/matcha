"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Icon } from "@iconify/react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatHint } from "@/contexts/ChatHintContext";
import clsx from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    label: "Matcha",
    href: "/matcha",
    icon: "solar:heart-bold",
  },
  {
    label: "Discover",
    href: "/discover",
    icon: "solar:users-group-rounded-bold",
  },
  {
    label: "Chats",
    href: "/chats",
    icon: "solar:chat-round-line-bold",
  },
  {
    label: "Profile",
    href: "/Profile",
    icon: "solar:user-bold",
  },
];

/** Desktop-only: compass opens Trends (popular tags, personality, gender, orientation). */
const desktopOnlyNavItems: NavItem[] = [
  {
    label: "Trends",
    href: "/trends",
    icon: "solar:compass-bold",
  },
];

interface ChatConversation {
  id: number;
  unread_count?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const { showHint, unreadCount, isZapping } = useChatHint();
  const [loadingHref, setLoadingHref] = React.useState<string | null>(null);
  const [hasUnreadChat, setHasUnreadChat] = React.useState(false);

  // Clear loading state when pathname changes (navigation completed)
  React.useEffect(() => {
    setLoadingHref(null);
  }, [pathname]);

  // Poll for unread chat so the chat icon can show pink when there are new messages
  React.useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkUnreadChat = async () => {
      try {
        const response = await fetch("/api/chat", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const conversations: ChatConversation[] = data.data?.conversations ?? [];
          const totalUnread = conversations.reduce(
            (sum, c) => sum + (Number(c.unread_count) || 0),
            0
          );
          setHasUnreadChat(totalUnread > 0);
        }
      } catch {
        // ignore
      }
    };

    checkUnreadChat();
    const interval = setInterval(checkUnreadChat, 15000); // every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  // Don't show sidebar on login/register pages
  if (!isAuthenticated || pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/sign-up")) {
    return null;
  }

  const handleNavigation = (href: string) => {
    setLoadingHref(href);
    router.push(href);
  };

  const chatHintText =
    unreadCount === 1
      ? "You have 1 unread message!"
      : `You have ${unreadCount} unread messages!`;

  return (
    <>
      {/* Desktop: fixed sidebar (includes Trends / compass) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-default-100 border-r border-default-200 dark:border-default-100 z-40 flex-col items-center py-6 gap-4">
        {[...navItems, ...desktopOnlyNavItems].map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const isChatActive = item.href === "/chats" && (pathname === "/chats" || pathname?.startsWith("/chat/"));
          const isLoading = loadingHref === item.href;
          const isChats = item.href === "/chats";
          const showPinkChat = isChats && hasUnreadChat && !isActive && !isChatActive;
          const btn = (
            <Button
              key={item.href}
              isIconOnly
              variant={isActive ? "solid" : "light"}
              color={isActive ? "primary" : "default"}
              className={clsx(
                "transition-all duration-200",
                isChats && showPinkChat ? "w-16 h-16 min-w-16" : "w-14 h-14 min-w-14",
                isActive && "bg-[#00b7fa] text-white",
                showPinkChat && "text-pink-500"
              )}
              aria-label={item.label}
              onPress={() => handleNavigation(item.href)}
              title={item.label}
              isLoading={isLoading}
            >
              <Icon
                icon={item.icon}
                className={clsx(
                  "transition-all duration-200",
                  showPinkChat ? "text-3xl text-pink-500 animate-chat-dance animate-chat-beep-beep" : "text-2xl"
                )}
              />
            </Button>
          );
          if (isChats && (showHint || isZapping)) {
            return (
              <Popover key={item.href} isOpen={showHint || isZapping} placement="right" showArrow>
                <PopoverTrigger>{btn}</PopoverTrigger>
                <PopoverContent>
                  <div
                    className={clsx(
                      "px-3 py-2 text-sm font-medium",
                      isZapping && "animate-zap-out"
                    )}
                  >
                    {chatHintText}
                  </div>
                </PopoverContent>
              </Popover>
            );
          }
          return <React.Fragment key={item.href}>{btn}</React.Fragment>;
        })}
      </aside>

      {/* Mobile: bottom nav bar (no drawer — less clutter) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around gap-1 px-2 py-2 bg-content1/95 backdrop-blur-sm border-t border-default-200 dark:border-default-100"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const isChatActive = item.href === "/chats" && (pathname === "/chats" || pathname?.startsWith("/chat/"));
          const isLoading = loadingHref === item.href;
          const isChats = item.href === "/chats";
          const showPinkChat = isChats && hasUnreadChat && !isActive && !isChatActive;
          const mobileBtn = (
            <Button
              isIconOnly
              variant="light"
              color={isActive ? "primary" : "default"}
              size="sm"
              className={clsx(
                "min-w-11 w-11 h-11 flex-shrink-0",
                isActive && "bg-primary/15 text-primary",
                showPinkChat && "text-pink-500"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              onPress={() => handleNavigation(item.href)}
              isLoading={isLoading}
            >
              <Icon
                icon={item.icon}
                className={clsx(
                  "text-xl transition-all duration-200",
                  showPinkChat && "text-pink-500 animate-chat-dance animate-chat-beep-beep"
                )}
              />
            </Button>
          );
          if (isChats && (showHint || isZapping)) {
            return (
              <Popover key={item.href} isOpen={showHint || isZapping} placement="top" showArrow>
                <PopoverTrigger>{mobileBtn}</PopoverTrigger>
                <PopoverContent>
                  <div
                    className={clsx(
                      "px-3 py-2 text-sm font-medium",
                      isZapping && "animate-zap-out"
                    )}
                  >
                    {chatHintText}
                  </div>
                </PopoverContent>
              </Popover>
            );
          }
          return <React.Fragment key={item.href}>{mobileBtn}</React.Fragment>;
        })}
      </nav>
    </>
  );
}
