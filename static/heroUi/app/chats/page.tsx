"use client";

import React from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  location: string;
  biography: string;
  fame_rating: number;
  is_online: boolean;
  last_seen: string;
  profile_picture: string;
  tags: string[];
  gender?: string;
  connected_at?: string;
}

export default function ChatsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = React.useState<ConnectedUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Reset loading state immediately when component mounts or route changes
  React.useEffect(() => {
    setIsLoading(true);
    setConnections([]);
  }, []); // Only on mount/route change

  React.useEffect(() => {
    const loadConnections = async () => {
      try {
        setIsLoading(true);
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/connections`, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const connectionsData = data.data.connections || data.data;
            if (Array.isArray(connectionsData)) {
              setConnections(connectionsData);
            } else {
              setConnections([]);
            }
          } else {
            setConnections([]);
          }
        } else {
          setConnections([]);
        }
      } catch (error) {
        console.error("Error loading connections:", error);
        setConnections([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadConnections();
    }
  }, [token]);

  const formatLastSeen = (lastSeen: string): string => {
    if (!lastSeen) return "Never";
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  return (
    <ProtectedRoute requireAuth={true} requireSetup={true}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-2 md:px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold">Your Connections</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" color="primary" />
            <p className="mt-4 text-default-500">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Icon icon="solar:users-group-rounded-linear" className="text-6xl text-default-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No connections yet</h2>
            <p className="text-default-500 text-center">
              Start liking profiles to make connections! When someone likes you back, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {connections.map((connection) => (
              <Card
                key={connection.id}
                className="w-full hover:scale-105 transition-transform"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    alt={connection.first_name}
                    className="object-cover w-full h-full"
                    src={connection.profile_picture || "https://heroui.com/images/hero-card.jpeg"}
                  />
                  {connection.is_online && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center gap-2 text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded drop-shadow-lg">
                      <span>Level {Math.floor(connection.fame_rating)}</span>
                    </div>
                  </div>
                </div>
                <CardBody className="p-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">
                      {connection.first_name} {connection.last_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-default-500">
                      {connection.age > 0 && <span>{connection.age} years old</span>}
                      {connection.location && (
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:map-point-linear" className="text-xs" />
                          {connection.location}
                        </span>
                      )}
                    </div>
                    {connection.last_seen && (
                      <div className="flex items-center gap-1 text-xs text-default-400">
                        <Icon icon="solar:clock-circle-linear" className="text-xs" />
                        <span>{formatLastSeen(connection.last_seen)}</span>
                      </div>
                    )}
                  </div>
                  {connection.biography && (
                    <p className="text-sm text-default-600 mt-2 line-clamp-2">
                      {connection.biography}
                    </p>
                  )}
                  {connection.tags && connection.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {connection.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag} size="sm" variant="flat" color="primary">
                          {tag}
                        </Chip>
                      ))}
                      {connection.tags.length > 3 && (
                        <Chip size="sm" variant="flat" color="default">
                          +{connection.tags.length - 3}
                        </Chip>
                      )}
                    </div>
                  )}
                </CardBody>
                <CardFooter className="pt-0 gap-2">
                  <Button
                    color="primary"
                    variant="solid"
                    size="sm"
                    className="flex-1"
                    startContent={<Icon icon="solar:chat-round-line-bold" className="text-lg" />}
                    onPress={() => {
                      router.push(`/chat/${connection.id}`);
                    }}
                  >
                    Start Chat
                  </Button>
                  <Button
                    variant="light"
                    size="sm"
                    isIconOnly
                    aria-label="View Profile"
                    onPress={() => {
                      router.push(`/discover/${connection.id}`);
                    }}
                  >
                    <Icon icon="solar:user-id-bold" className="text-lg" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
