"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Icon } from "@iconify/react";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";
import { NotificationIcon } from "@/components/icons";

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id?: number;
  related_user_id?: number;
}

export function NotificationBell() {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated || !token) return;

    const loadNotifications = async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);
        const response = await fetch("/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setNotifications(data.data.notifications || []);
            setUnreadCount(data.data.unread_count || 0);
          }
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    loadNotifications();

    // Poll every 15s so new likes/messages show up quickly
    const interval = setInterval(() => loadNotifications(false), 15000);

    // Refetch when tab becomes visible so receiving a chat/like shows immediately after switching back
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotifications(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated, token]);

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read && token) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate based on notification type
    if (notification.type === "like" || notification.type === "match" || notification.type === "view") {
      if (notification.related_user_id) {
        router.push(`/discover/${notification.related_user_id}`);
      }
    } else if (notification.type === "message") {
      if (notification.related_user_id) {
        router.push(`/chat/${notification.related_user_id}`);
      } else {
        router.push("/chats");
      }
    }

    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  const trigger = (
    <Button
      isIconOnly
      variant="light"
      aria-label="Notifications"
      className="text-2xl"
    >
      <NotificationIcon size={24} className="text-current" />
    </Button>
  );

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-end"
      showArrow
    >
      <PopoverTrigger>
        {unreadCount > 0 ? (
          <Badge
            color="danger"
            content={unreadCount > 99 ? "99+" : unreadCount}
            placement="top-right"
            shape="circle"
            size="sm"
          >
            {trigger}
          </Badge>
        ) : (
          trigger
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-default-500">
                {unreadCount} unread
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icon
                icon="solar:bell-off-bold"
                className="text-4xl text-default-400 mb-2"
              />
              <p className="text-sm text-default-500">No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.is_read
                      ? "bg-default-50 hover:bg-default-100"
                      : "bg-primary-50 hover:bg-primary-100"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          notification.is_read
                            ? "text-default-700"
                            : "text-default-900 font-medium"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-default-500 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
