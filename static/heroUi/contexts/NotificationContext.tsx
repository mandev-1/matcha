"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  user_id?: number;
  related_user_id?: number;
}

interface NotificationContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: (opts?: { showLoading?: boolean; append?: boolean }) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: number) => void;
  loadOlder: () => void;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LIMIT = 20;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadNotifications = useCallback(
    async (opts?: { showLoading?: boolean; append?: boolean }) => {
      if (!token) return;
      const showLoading = opts?.showLoading !== false;
      const append = opts?.append === true;
      if (showLoading) setIsLoading(true);
      try {
        const currentOffset = append ? offset : 0;
        const response = await fetch(
          `/api/notifications?limit=${LIMIT}&offset=${currentOffset}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.data) {
          const list = (data.data.notifications || []) as Notification[];
          setNotifications((prev) => (append ? [...prev, ...list] : list));
          setUnreadCount(data.data.unread_count ?? 0);
          setHasMore(list.length === LIMIT);
          if (!append) setOffset(LIMIT);
          else setOffset((o) => o + LIMIT);
        }
      } catch {
        // ignore
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [token, offset]
  );

  useEffect(() => {
    if (!token) return;
    loadNotifications({ showLoading: true });
    // Poll every 10s so notifications appear within max 10 seconds (IV.7)
    const interval = setInterval(() => loadNotifications({ showLoading: false }), 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible" && token) {
        loadNotifications({ showLoading: false });
      }
    };
    window.addEventListener("visibilitychange", onFocus);
    return () => window.removeEventListener("visibilitychange", onFocus);
  }, [token, loadNotifications]);

  useEffect(() => {
    if (isOpen && token) {
      loadNotifications({ showLoading: false });
    }
  }, [isOpen]);

  const markAsRead = useCallback(
    async (id: number) => {
      if (!token) return;
      try {
        await fetch(`/api/notifications/${id}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    },
    [token]
  );

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, [token]);

  const clearNotification = useCallback((id: number) => {
    let wasUnread = false;
    setNotifications((prev) => {
      const n = prev.find((x) => x.id === id);
      wasUnread = n ? !n.is_read : false;
      return prev.filter((x) => x.id !== id);
    });
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    if (token) {
      fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [token]);

  const loadOlder = useCallback(() => {
    loadNotifications({ showLoading: false, append: true });
  }, [loadNotifications]);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      notifications,
      unreadCount,
      isLoading,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      clearNotification,
      loadOlder,
      hasMore,
    }),
    [
      isOpen,
      notifications,
      unreadCount,
      isLoading,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      clearNotification,
      loadOlder,
      hasMore,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (ctx === undefined) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
