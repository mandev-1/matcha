"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, LazyMotion, domAnimation } from "framer-motion";
import { useNotifications, type Notification } from "@/contexts/NotificationContext";

function formatTimeAgo(dateStr: string): string {
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
}

function NotificationItem({
  notification,
  index,
  onPress,
  onClear,
}: {
  notification: Notification;
  index: number;
  onPress: (n: Notification) => void;
  onClear: (id: number) => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: "easeOut" }}
      className={`group flex items-start gap-2 p-3 border-b border-default-100 transition-colors ${
        notification.is_read ? "bg-default-50/50" : "bg-primary-50/50 dark:bg-primary-900/10"
      } hover:bg-default-100`}
    >
      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={() => onPress(notification)}
      >
        <p
          className={`text-sm ${
            notification.is_read ? "text-default-600" : "text-default-900 font-medium"
          }`}
        >
          {notification.message}
        </p>
        <p className="text-xs text-default-500 mt-0.5">
          {formatTimeAgo(notification.created_at)}
        </p>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        {!notification.is_read && (
          <div className="w-2 h-2 bg-primary rounded-full" aria-hidden />
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="opacity-70 group-hover:opacity-100 min-w-8 w-8 h-8"
            aria-label="Clear notification"
            onPress={() => onClear(notification.id)}
          >
            <Icon icon="solar:close-circle-linear" className="text-default-500" />
          </Button>
        </div>
      </div>
    </m.div>
  );
}

export function NotificationPanel() {
  const {
    isOpen,
    setIsOpen,
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotification,
    loadOlder,
    hasMore,
  } = useNotifications();
  const router = useRouter();
  const [markingAll, setMarkingAll] = React.useState(false);
  const handleMarkAllAsRead = async () => {
    if (typeof markAllAsRead !== "function") return;
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.type === "like" || notification.type === "match" || notification.type === "view" || notification.type === "unlike") {
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

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <LazyMotion features={domAnimation} strict>
          <m.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "tween", duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 left-0 right-0 bottom-16 md:relative md:inset-auto md:bottom-auto z-40 md:z-auto w-full md:w-80 md:min-w-[280px] border-l border-default-200 dark:border-default-100 bg-content1 flex flex-col h-full md:h-full shrink-0 shadow-xl md:shadow-none"
            aria-label="Notifications"
          >
      <div className="p-3 border-b border-default-200 dark:border-default-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="text-xs text-default-500">{unreadCount} unread</span>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="md:ml-0 shrink-0"
            aria-label="Close notifications"
            onPress={() => setIsOpen(false)}
          >
            <Icon icon="solar:close-circle-linear" className="text-lg" />
          </Button>
        </div>
        {unreadCount > 0 && typeof markAllAsRead === "function" && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="w-full sm:w-auto shrink-0"
            onPress={handleMarkAllAsRead}
            isLoading={markingAll}
            startContent={<Icon icon="solar:check-read-linear" className="text-lg" />}
          >
            Mark all as read
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && notifications.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Icon icon="solar:bell-off-bold" className="text-4xl text-default-400 mb-2" />
            <p className="text-sm text-default-500">No notifications</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* New notifications (unread) */}
            <div className="px-3 pt-3 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-default-500">
                New notifications
              </p>
            </div>
            {unreadCount === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-default-500">No new notifications</p>
              </div>
            ) : (
              notifications
                .filter((n) => !n.is_read)
                .map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onPress={handleNotificationClick}
                    onClear={clearNotification}
                  />
                ))
            )}

            {/* Divider + older notifications (read) */}
            {notifications.some((n) => n.is_read) && (
              <>
                <div
                  className="px-3 py-2 mt-2 border-t border-default-200 dark:border-default-100 flex items-center gap-2"
                  role="separator"
                  aria-label="Older notifications"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-default-500">
                    Older notifications
                  </span>
                </div>
                {notifications
                  .filter((n) => n.is_read)
                  .map((notification, index) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      index={index}
                      onPress={handleNotificationClick}
                      onClear={clearNotification}
                    />
                  ))}
              </>
            )}

            {hasMore && (
              <div className="p-3 border-t border-default-100">
                <Button
                  variant="flat"
                  size="sm"
                  className="w-full"
                  onPress={loadOlder}
                  isLoading={isLoading}
                >
                  Load older
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
          </m.aside>
        </LazyMotion>
      )}
    </AnimatePresence>
  );
}
