"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
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
      isIconOnly
      variant="light"
      aria-label="Notifications"
      aria-expanded={isOpen}
      className="text-2xl"
      onPress={() => setIsOpen(!isOpen)}
    >
      {unreadCount > 0 ? (
        <Badge
          color="danger"
          content={unreadCount > 99 ? "99+" : unreadCount}
          placement="top-right"
          shape="circle"
          size="md"
          classNames={{
            badge: "min-w-6 h-6 text-sm font-semibold",
          }}
        >
          {icon}
        </Badge>
      ) : (
        icon
      )}
    </Button>
  );
}
