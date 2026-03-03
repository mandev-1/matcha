"use client";

import React from "react";
import { Button, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationIcon } from "@/components/icons";

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { isOpen, setIsOpen, unreadCount } = useNotifications();

  if (!isAuthenticated) {
    return null;
  }

  const icon = <NotificationIcon size={24} className="text-current" />;

  return (
    <Button
      variant="ghost"
      aria-label="Notifications"
      aria-expanded={isOpen}
      className="text-2xl min-w-8 w-8 h-8 p-0"
      onPress={() => setIsOpen(!isOpen)}
    >
      {unreadCount > 0 ? (
        <Badge placement="top-right" size="md" className="min-w-6 h-6 text-sm font-semibold">
          <Badge.Anchor>{icon}</Badge.Anchor>
          <Badge.Label>{unreadCount > 99 ? "99+" : String(unreadCount)}</Badge.Label>
        </Badge>
      ) : (
        icon
      )}
    </Button>
  );
}
