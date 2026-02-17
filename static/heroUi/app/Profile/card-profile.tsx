"use client";

import React from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl, getUploadUrl } from "@/lib/apiUrl";

interface CardProfileProps {
  userImages: (string | null)[];
  firstName: string;
  lastName: string;
  user: { username?: string } | null;
  selectedGender: string;
  bio: string;
  tags: string[];
  selectedPreference: string;
  mbti: string;
  lastSeen: string | null;
  likesReceivedCount?: number;
  onImageUploadModalOpen: () => void;
  onEditClick: () => void;
}

export default function CardProfile({
  userImages,
  firstName,
  lastName,
  user,
  selectedGender,
  bio,
  tags,
  selectedPreference,
  mbti,
  lastSeen,
  likesReceivedCount = 0,
  onImageUploadModalOpen,
  onEditClick,
}: CardProfileProps) {
  const formatLastSeen = (lastSeenStr: string | null): string => {
    if (!lastSeenStr) return "Never";
    
    const lastSeenDate = new Date(lastSeenStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return lastSeenDate.toLocaleDateString();
  };
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 md:px-4">
      <div className="flex justify-center items-center">
        <Card isFooterBlurred className="border-none w-full h-auto md:h-[450px]" radius="lg">
          <div className="grid grid-cols-12 gap-1 md:gap-2 h-full p-1 md:p-2">
            {/* Big image on the left - 6 columns (Profile image - slot 1) */}
            <div className="col-span-12 md:col-span-6 h-[402px] md:h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
              <Image
                alt="Main profile image"
                className="object-contain w-full h-full rounded-lg"
                src={userImages[0] && userImages[0] !== "-" ? getUploadUrl(userImages[0]) : "https://heroui.com/images/hero-card.jpeg"}
              />
            </div>
            {/* 4 smaller images on the right - 3 columns each, 2 rows (slots 2-5) */}
            <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-1 md:gap-2 h-[300px] md:h-full min-h-0">
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 2"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[1] && userImages[1] !== "-" ? getUploadUrl(userImages[1]) : "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 3"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[2] && userImages[2] !== "-" ? getUploadUrl(userImages[2]) : "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 4"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[3] && userImages[3] !== "-" ? getUploadUrl(userImages[3]) : "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 5"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[4] && userImages[4] !== "-" ? getUploadUrl(userImages[4]) : "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
            </div>
          </div>
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">{likesReceivedCount === 1 ? "1 like." : `${likesReceivedCount} likes.`}</p>
            <Button
              className="text-tiny text-white bg-black/20"
              color="default"
              radius="lg"
              size="sm"
              variant="flat"
              onPress={onImageUploadModalOpen}
              startContent={<Icon icon="solar:gallery-add-linear" className="text-sm" />}
            >
              Upload new Images
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Profile Information */}
      <Card className="w-full relative" radius="lg">
        <Button
          className="absolute top-4 right-4 z-10"
          color="primary"
          variant="flat"
          size="sm"
          onPress={onEditClick}
          startContent={<Icon icon="solar:pen-linear" className="text-lg" />}
        >
          Edit
        </Button>
        <CardBody className="flex flex-col gap-4 p-4 md:p-6">
          {/* Name and Basic Info */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              {firstName && lastName ? `${firstName} ${lastName}` : user?.username || "Your Name"}
            </h2>
            {selectedGender && (
              <p className="text-default-500 text-sm md:text-base">
                {selectedGender === "male" ? "He/Him" : selectedGender === "female" ? "She/Her" : selectedGender}
              </p>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <div className="flex flex-col gap-1">
              <p className="text-sm md:text-base text-foreground whitespace-pre-wrap">
                {bio}
              </p>
            </div>
          )}

          {/* Tags/Interests */}
          {tags && tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-default-600">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    variant="flat"
                    color="primary"
                    size="sm"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex flex-wrap gap-4 text-sm text-default-500">
            {selectedPreference && (
              <div className="flex items-center gap-1">
                <Icon icon="solar:heart-linear" className="text-lg" />
                <span>Looking for: {selectedPreference === "male" ? "Men" : selectedPreference === "female" ? "Women" : selectedPreference === "both" ? "Everyone" : "Everyone"}</span>
              </div>
            )}
            {mbti && (
              <div className="flex items-center gap-1">
                <Icon icon="solar:user-id-linear" className="text-lg" />
                <span>MBTI: {mbti}</span>
              </div>
            )}
            {lastSeen && (
              <div className="flex items-center gap-1">
                <Icon icon="solar:clock-circle-linear" className="text-lg" />
                <span>Last online: {formatLastSeen(lastSeen)}</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Profile Visitors */}
      <ProfileVisitorsCard />


      {/* Fame Rating Evolution */}
      <FameRatingEvolutionCard />
      {/* Connections Table */}
      <ConnectionsTable />
    </div>
  );
}

interface Visitor {
  viewer_id: number;
  first_name: string;
  last_name: string;
  username: string;
  viewed_at: string;
  profile_picture: string;
  distance: number;
  location?: string;
  is_connected: boolean;
  connected_at?: string;
  gave_like?: boolean; // They liked me but I didn't like them back
}

function ProfileVisitorsCard() {
  const [visitors, setVisitors] = React.useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadVisitors = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(getApiUrl("/api/profile/visitors"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const allVisitors = data.data.visitors || [];
            // Filter to only show the first visit from each viewer_id
            const seenViewerIds = new Set<number>();
            const uniqueVisitors = allVisitors.filter((visitor: Visitor) => {
              if (seenViewerIds.has(visitor.viewer_id)) {
                return false; // Skip duplicate
              }
              seenViewerIds.add(visitor.viewer_id);
              return true; // Keep first occurrence
            });
            setVisitors(uniqueVisitors);
          }
        }
      } catch (error) {
        console.error("Error loading visitors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVisitors();
  }, []);

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const formatDistance = (distance: number): string => {
    if (distance < 0) return "Unknown";
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${distance.toFixed(1)}km away`;
  };

  if (isLoading) {
    return (
      <Card className="w-full" radius="lg">
        <CardBody>
          <p className="text-default-500">Loading visitors...</p>
        </CardBody>
      </Card>
    );
  }

  if (visitors.length === 0) {
    return (
      <Card className="w-full" radius="lg">
        <CardBody>
          <div className="flex flex-col items-center justify-center py-8">
            <Icon icon="solar:eye-linear" className="text-4xl text-default-400 mb-2" />
            <p className="text-default-500 text-center">No one has visited your profile yet</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full" radius="lg">
      <CardBody>
        <div className="flex flex-col gap-2">
          {visitors.map((visitor, index) => (
            <div
              key={`visitor-${visitor.viewer_id}-${visitor.viewed_at}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
            >
              <Image
                alt={visitor.first_name}
                className="w-12 h-12 rounded-full object-cover"
                src={visitor.profile_picture && visitor.profile_picture !== "-" ? getUploadUrl(visitor.profile_picture) : "https://heroui.com/images/hero-card.jpeg"}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">
                    {visitor.first_name} {visitor.last_name}
                  </p>
                  {visitor.is_connected && (
                    <Chip size="sm" color="success" variant="flat">
                      Connected
                    </Chip>
                  )}
                  {visitor.gave_like && !visitor.is_connected && (
                    <Chip size="sm" className="bg-pink-500/20 text-pink-500 border-pink-500/30" variant="flat">
                      Gave Like
                    </Chip>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-default-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:clock-circle-linear" className="text-xs" />
                    {formatTimeAgo(visitor.viewed_at)}
                  </span>
                  {visitor.distance >= 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:map-point-linear" className="text-xs" />
                        {formatDistance(visitor.distance)}
                      </span>
                    </>
                  )}
                  {visitor.location && (
                    <>
                      <span>•</span>
                      <span className="truncate">{visitor.location}</span>
                    </>
                  )}
                </div>
                {visitor.is_connected && visitor.connected_at && (
                  <p className="text-xs text-success mt-1">
                    Connected {formatTimeAgo(visitor.connected_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

interface Connection {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  location?: string;
  fame_rating: number;
  is_online: boolean;
  last_seen: string;
  profile_picture?: string;
  tags: string[];
  connected_at?: string;
}

function ConnectionsTable() {
  const router = useRouter();
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadConnections = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(getApiUrl("/api/connections"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

    loadConnections();
  }, []);

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

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="w-full" radius="lg">
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" color="primary" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (connections.length === 0) {
    return (
      <Card className="w-full" radius="lg">
        <CardBody>
          <div className="flex flex-col items-center justify-center py-8">
            <Icon icon="solar:users-group-rounded-linear" className="text-4xl text-default-400 mb-2" />
            <p className="text-default-500 text-center">No connections yet</p>
          </div>
        </CardBody>
      </Card>
    );
  }  return (
    <Card className="w-full" radius="lg">
      <CardBody className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-sky-300">Connections</h3>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            onPress={() => router.push("/chats")}
            endContent={<Icon icon="solar:chat-round-line-linear" className="text-lg" />}
          >
            Continue chatting
          </Button>
        </div>

        <Table 
          aria-label="Connections table"
          selectionMode="none"
          removeWrapper
        >
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>AGE</TableColumn>
            <TableColumn>LOCATION</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>FAME</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No connections found.">
            {connections.map((connection) => (
              <TableRow
                key={connection.id}
                className="cursor-pointer hover:bg-default-100"
                onClick={() => router.push(`/discover/${connection.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      alt={connection.first_name}
                      className="w-10 h-10 rounded-full object-cover"
                      src={connection.profile_picture && connection.profile_picture !== "-" ? getUploadUrl(connection.profile_picture) : "https://heroui.com/images/hero-card.jpeg"}
                    />
                    <div>
                      <p className="font-semibold">
                        {connection.first_name} {connection.last_name}
                      </p>
                      <p className="text-xs text-default-500">@{connection.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {connection.age > 0 ? `${connection.age} years` : "-"}
                </TableCell>
                <TableCell>
                  {connection.location || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {connection.is_online ? (
                      <Chip size="sm" color="success" variant="flat">
                        Online
                      </Chip>
                    ) : (
                      <span className="text-xs text-default-500">
                        {formatLastSeen(connection.last_seen)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat" color="primary">
                      Level {Math.floor(connection.fame_rating)}
                    </Chip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}



function FameRatingEvolutionCard() {
  const { token } = useAuth();
  const [fameRating, setFameRating] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadFameRating = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(getApiUrl("/api/profile"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.fame_rating !== undefined) {
            setFameRating(data.data.fame_rating);
          }
        }
      } catch (error) {
        console.error("Error loading fame rating:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadFameRating();
    }
  }, [token]);

  if (isLoading) {
    return (
      <Card className="w-full" radius="lg">
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" color="primary" />
          </div>
        </CardBody>
      </Card>
    );
  }

  const currentLevel = Math.floor(fameRating);
  const nextLevel = currentLevel + 1;
  const progressInCurrentLevel = fameRating - currentLevel;
  const progressPercentage = progressInCurrentLevel * 100;

  const chartData = [];
  const maxLevel = Math.min(currentLevel + 5, 100);
  for (let i = Math.max(1, currentLevel - 4); i <= maxLevel; i++) {
    if (i < currentLevel) {
      chartData.push({ level: i, value: 1.0 });
    } else if (i === currentLevel) {
      chartData.push({ level: i, value: progressInCurrentLevel });
    } else {
      chartData.push({ level: i, value: 0 });
    }
  }

  const maxValue = Math.max(...chartData.map(d => d.value), 0.1);
  const chartHeight = 120;
  const chartWidth = 400;
  const padding = 20;
  const chartInnerWidth = chartWidth - padding * 2;
  const chartInnerHeight = chartHeight - padding * 2;

  const points = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1 || 1)) * chartInnerWidth;
    const y = padding + chartInnerHeight - (d.value / maxValue) * chartInnerHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return (
    <Card className="w-full" radius="lg">
      <CardBody className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-sky-300">Fame Rating Evolution</h3>
          <Chip size="lg" color="primary" variant="flat">
            Level {currentLevel}
          </Chip>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-default-600">Current Rating</span>
            <span className="text-lg font-bold text-primary">{fameRating.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-default-500">
            <span>Level {currentLevel}</span>
            <span>Level {nextLevel}</span>
          </div>
          <Progress
            value={progressPercentage}
            color="primary"
            size="lg"
            className="w-full"
            aria-label="Progress to next level"
          />
          <div className="text-xs text-center text-default-500">
            {progressPercentage.toFixed(1)}% to Level {nextLevel}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-default-600">Level Progression</h4>
          <div className="w-full overflow-x-auto">
            <svg
              width={chartWidth}
              height={chartHeight}
              className="w-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            >
              {[0, 0.25, 0.5, 0.75, 1.0].map((val, i) => {
                const y = padding + chartInnerHeight - (val / maxValue) * chartInnerHeight;
                return (
                  <line
                    key={i}
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-default-200"
                    strokeDasharray="2,2"
                  />
                );
              })}

              <path
                d={`${pathData} L ${chartWidth - padding},${padding + chartInnerHeight} L ${padding},${padding + chartInnerHeight} Z`}
                fill="url(#gradient)"
                opacity="0.3"
              />

              <path
                d={pathData}
                fill="none"
                stroke="hsl(var(--heroui-primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {chartData.map((d, i) => {
                const x = padding + (i / (chartData.length - 1 || 1)) * chartInnerWidth;
                const y = padding + chartInnerHeight - (d.value / maxValue) * chartInnerHeight;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="hsl(var(--heroui-primary))"
                    className="drop-shadow-sm"
                  />
                );
              })}

              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--heroui-primary))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--heroui-primary))" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between text-xs text-default-500 px-2">
            {chartData.map((d, i) => (
              <span key={i}>L{d.level}</span>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}


function JoinDateMessage() {
  const { token } = useAuth();
  const [daysSinceJoin, setDaysSinceJoin] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadJoinDate = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(getApiUrl("/api/profile"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.created_at) {
            const createdAt = new Date(data.data.created_at);
            const now = new Date();
            const diffTime = now.getTime() - createdAt.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            setDaysSinceJoin(diffDays);
          }
        }
      } catch (error) {
        console.error("Error loading join date:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadJoinDate();
    }
  }, [token]);

  if (isLoading || daysSinceJoin === null) {
    return null;
  }

  return (
    <Card className="w-full" radius="lg">
      <CardBody className="p-4 md:p-6">
        <p className="text-base text-default-700 text-center">
          I joined matcha {daysSinceJoin} {daysSinceJoin === 1 ? 'day' : 'days'} ago! I love my friends, and will give Martin and Madi 5 stars.
        </p>
      </CardBody>
    </Card>
  );
}
