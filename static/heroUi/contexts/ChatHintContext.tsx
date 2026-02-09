"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

interface ChatHintContextType {
  showHint: boolean;
  unreadCount: number;
  isZapping: boolean;
  triggerHint: (unreadCount: number) => void;
}

const ChatHintContext = createContext<ChatHintContextType | undefined>(undefined);

export function ChatHintProvider({ children }: { children: React.ReactNode }) {
  const [showHint, setShowHint] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isZapping, setIsZapping] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerHint = useCallback((count: number) => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (zapTimerRef.current) clearTimeout(zapTimerRef.current);
    setUnreadCount(count);
    // Show popover 5 seconds from now
    showTimerRef.current = setTimeout(() => {
      showTimerRef.current = null;
      setShowHint(true);
      // After 5 more seconds, zap out then hide
      zapTimerRef.current = setTimeout(() => {
        setIsZapping(true);
        setTimeout(() => {
          setShowHint(false);
          setIsZapping(false);
          zapTimerRef.current = null;
        }, 400);
      }, 5000);
    }, 5000);
  }, []);

  const value = React.useMemo(
    () => ({ showHint, unreadCount, isZapping, triggerHint }),
    [showHint, unreadCount, isZapping, triggerHint]
  );

  return (
    <ChatHintContext.Provider value={value}>
      {children}
    </ChatHintContext.Provider>
  );
}

export function useChatHint() {
  const ctx = useContext(ChatHintContext);
  if (ctx === undefined) {
    throw new Error("useChatHint must be used within ChatHintProvider");
  }
  return ctx;
}
