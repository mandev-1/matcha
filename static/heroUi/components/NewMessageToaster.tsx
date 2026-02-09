"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { addToast } from "@heroui/toast";
import { useNotifications, type Notification } from "@/contexts/NotificationContext";
import { useChatHint } from "@/contexts/ChatHintContext";

function ToastDescription() {
  return (
    <span>
      Someone just messaged you! Go to{" "}
      <Link
        href="/chats"
        className="underline font-medium text-foreground hover:opacity-80"
      >
        chat
      </Link>
      .
    </span>
  );
}

export function NewMessageToaster() {
  const { notifications } = useNotifications();
  const { triggerHint } = useChatHint();
  const seenUnreadMessageIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const unreadMessage = notifications.filter(
      (n) => n.type === "message" && !n.is_read
    );
    const unreadIds = new Set(unreadMessage.map((n) => n.id));
    const newIds = [...unreadIds].filter((id) => !seenUnreadMessageIdsRef.current.has(id));
    const isInitialLoad = seenUnreadMessageIdsRef.current.size === 0;
    if (isInitialLoad && unreadMessage.length > 0) {
      unreadIds.forEach((id) => seenUnreadMessageIdsRef.current.add(id));
      return;
    }
    if (newIds.length === 0) return;
    newIds.forEach((id) => seenUnreadMessageIdsRef.current.add(id));
    addToast({
      title: "New message",
      description: <ToastDescription />,
      color: "default",
    });
    triggerHint(unreadMessage.length);
  }, [notifications, triggerHint]);

  return null;
}
