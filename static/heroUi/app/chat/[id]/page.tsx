"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Image } from "@heroui/image";
import { Skeleton } from "@heroui/skeleton";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { addToast } from "@heroui/toast";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { getApiUrl, getUploadUrl } from "@/lib/apiUrl";

interface Message {
  id: number;
  content: string;
  is_from_current_user: boolean;
  created_at: string;
  is_read?: boolean;
}

interface ChatUser {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture: string;
  is_online: boolean;
}

export default function ChatPage() {
  const { token, isInitialized } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string;
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [chatUser, setChatUser] = React.useState<ChatUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [showBlockDialog, setShowBlockDialog] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load chat user info first (quick)
  React.useEffect(() => {
    if (!chatId || !token || !isInitialized) return;

    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const userResponse = await fetch(getApiUrl(`/api/user/${chatId}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.data) {
            const data = userData.data;
            setChatUser({
              id: data.id,
              first_name: data.first_name,
              last_name: data.last_name,
              profile_picture: data.profile_picture && data.profile_picture !== "-" 
                ? getUploadUrl(data.profile_picture) 
                : data.images?.[0] && data.images[0] !== "-"
                ? getUploadUrl(data.images[0])
                : "",
              is_online: data.is_online || false,
            });
            const iBlockThem = !!data.is_blocked;
            const theyBlockMe = !!data.they_block_me;
            if (iBlockThem || theyBlockMe) {
              setShowBlockDialog(true);
            }
          } else {
            router.push("/chats");
          }
        } else {
          router.push("/chats");
        }
      } catch (error) {
        console.error("Error loading user:", error);
        router.push("/chats");
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, [chatId, token, isInitialized, router]);

  // Load messages function (reusable); handles network errors without throwing
  const loadMessages = React.useCallback(async (showLoading = true) => {
    if (!chatId || !token) return;

    try {
      if (showLoading) {
        setIsLoadingMessages(true);
      }
      const messagesResponse = await fetch(getApiUrl(`/api/messages/${chatId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        if (messagesData.success && messagesData.data) {
          const newMessages = messagesData.data.messages || [];
          setMessages((prevMessages) => {
            if (prevMessages.length !== newMessages.length) return newMessages;
            const hasChanges = prevMessages.some((prev, idx) => {
              const newMsg = newMessages[idx];
              return !newMsg || prev.id !== newMsg.id || prev.content !== newMsg.content;
            });
            return hasChanges ? newMessages : prevMessages;
          });
        }
      } else {
        if (showLoading) {
          addToast({
            title: "Error",
            description: "Failed to load messages",
            color: "danger",
          });
        }
      }
    } catch (_err) {
      // Network errors (e.g. "Failed to fetch") when server is unreachable
      if (showLoading) {
        addToast({
          title: "Connection error",
          description: "Could not load messages. Check your connection.",
          color: "danger",
        });
      }
      // Don't log or rethrow during polling to avoid console noise
    } finally {
      if (showLoading) {
        setIsLoadingMessages(false);
      }
    }
  }, [chatId, token]);

  // Initial load of messages
  React.useEffect(() => {
    if (!isInitialized) return;
    loadMessages(true);
  }, [chatId, token, isInitialized, loadMessages]);

  // Poll for new messages every 3 seconds while chat is open
  React.useEffect(() => {
    if (!chatId || !token || !isInitialized) return;

    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollInterval) return; // Already polling
      pollInterval = setInterval(() => {
        // Silently check for new messages; catch so polling never throws
        loadMessages(false).catch(() => {});
      }, 3000); // Poll every 3 seconds
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Start polling when page is visible
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    // Handle page visibility changes (pause when tab is hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling();
        // Immediately check for new messages when page becomes visible
        loadMessages(false);
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, token, isInitialized, loadMessages]);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update timestamps dynamically (frontend only, no API calls)
  React.useEffect(() => {
    if (messages.length === 0) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextUpdate = () => {
      const now = new Date();
      
      // Check if any message is less than 1 minute old
      const hasRecentMessages = messages.some((msg) => {
        const msgDate = new Date(msg.created_at);
        const diffMs = now.getTime() - msgDate.getTime();
        return diffMs < 60000; // Less than 1 minute
      });

      // Update current time to trigger re-render
      setCurrentTime(new Date());

      // Schedule next update with minimum 15 second interval
      if (hasRecentMessages) {
        // Minimum 15 seconds for recent messages
        timeoutId = setTimeout(scheduleNextUpdate, 15000);
      } else {
        // 1 minute interval for older messages
        timeoutId = setTimeout(scheduleNextUpdate, 60000);
      }
    };

    // Initial update
    scheduleNextUpdate();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending || !chatId || !token) return;

    setIsSending(true);
    try {
      const response = await fetch(getApiUrl(`/api/messages/${chatId}`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessageText("");
          // Refresh messages to get the server response with proper ID and timestamp
          await loadMessages(false);
        }
      } else {
        addToast({
          title: "Error",
          description: "Failed to send message",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addToast({
        title: "Error",
        description: "Failed to send message",
        color: "danger",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (createdAt: string): string => {
    const date = new Date(createdAt);
    const diffMs = currentTime.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffSecs === 0) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading only for user info (messages load async)
  if (isLoadingUser || !chatUser) {
    return (
      <ProtectedRoute requireAuth={true} requireSetup={true}>
        <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto w-full px-2 md:px-4 py-8">
          <Skeleton className="rounded-lg">
            <div className="h-full w-full rounded-lg bg-default-300" />
          </Skeleton>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true} requireSetup={true}>
      {/* Blocking yellow dialog: you're blocking them or they're blocking you */}
      <Modal
        isOpen={showBlockDialog}
        onClose={() => {}}
        isDismissable={false}
        hideCloseButton
        placement="center"
        classNames={{
          base: "border-2 border-warning bg-warning-50 dark:bg-warning-100/10",
          header: "border-b border-warning-200",
          body: "py-6",
          footer: "border-t border-warning-200",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-warning-700 dark:text-warning-600">
            Blocked
          </ModalHeader>
          <ModalBody>
            <p className="text-default-700 dark:text-default-300">
              You are blocking this person right now (or they blocked you lmao). 😂 Be cool bro,
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="warning"
              onPress={() => {
                setShowBlockDialog(false);
                router.push("/matcha");
              }}
            >
              OK
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto w-full px-2 md:px-4 py-8">
        <Card className="flex flex-col h-full">
          {/* Chat Header */}
          <CardHeader className="flex items-center justify-between border-b border-default-200 p-4">
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => router.push("/chats")}
                aria-label="Back to chats"
              >
                <Icon icon="solar:arrow-left-linear" className="text-xl" />
              </Button>
              <div className="relative">
                <Image
                  alt={chatUser.first_name}
                  className="w-10 h-10 rounded-full object-cover"
                  src={chatUser.profile_picture && chatUser.profile_picture !== "-" ? getUploadUrl(chatUser.profile_picture) : "https://heroui.com/images/hero-card.jpeg"}
                />
                {chatUser.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {chatUser.first_name} {chatUser.last_name}
                </h2>
                {chatUser.is_online ? (
                  <p className="text-xs text-success">Online</p>
                ) : (
                  <p className="text-xs text-default-400">Offline</p>
                )}
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => router.push(`/discover/${chatId}`)}
              aria-label="View profile"
            >
              <Icon icon="solar:user-id-bold" className="text-xl" />
            </Button>
          </CardHeader>

          {/* Messages Area */}
          <CardBody className="flex-1 p-0 overflow-hidden">
            <ScrollShadow className="h-full overflow-y-auto p-4">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex flex-col gap-3 w-full max-w-md">
                    {/* Loading skeleton for messages */}
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className="rounded-lg">
                          <div className={`h-16 w-48 rounded-lg bg-default-200`} />
                        </Skeleton>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Icon icon="solar:chat-round-line-linear" className="text-6xl text-default-400 mb-4" />
                      <p className="text-default-500">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_from_current_user ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.is_from_current_user
                              ? "bg-primary text-primary-foreground"
                              : "bg-default-100 text-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.is_from_current_user
                                ? "text-primary-foreground/70"
                                : "text-default-400"
                            }`}
                          >
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollShadow>
          </CardBody>

          {/* Message Input */}
          <div className="border-t border-default-200 p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onValueChange={setMessageText}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-12",
                }}
                endContent={
                  <Button
                    isIconOnly
                    color="primary"
                    size="sm"
                    isDisabled={!messageText.trim() || isSending}
                    isLoading={isSending}
                    onPress={handleSendMessage}
                    aria-label="Send message"
                  >
                    <Icon icon="solar:arrow-up-linear" className="text-lg" />
                  </Button>
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
