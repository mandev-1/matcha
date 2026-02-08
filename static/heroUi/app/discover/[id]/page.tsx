"use client";

import React from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { addToast } from "@heroui/toast";

interface UserProfile {
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
  images: string[];
  tags: string[];
  gender?: string;
  sexual_preference?: string;
  mbti?: string;
  latitude?: number;
  longitude?: number;
  big_five?: {
    openness?: string;
    conscientiousness?: string;
    extraversion?: string;
    agreeableness?: string;
    neuroticism?: string;
  };
  siblings?: string;
  caliper_profile?: string;
  is_liked: boolean;
  is_connected?: boolean;
  has_viewed_your_profile?: boolean;
  is_blocked?: boolean;
  blocked_at?: string;
}

export default function UserProfilePage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLiking, setIsLiking] = React.useState(false);
  const [currentUserTags, setCurrentUserTags] = React.useState<string[]>([]);

  // Load current user's tags
  React.useEffect(() => {
    const loadCurrentUserTags = async () => {
      try {
        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.tags) {
            setCurrentUserTags(data.data.tags || []);
          }
        }
      } catch (error) {
        console.error("Error loading current user tags:", error);
      }
    };

    if (token) {
      loadCurrentUserTags();
    }
  }, [token]);

  React.useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setProfile(data.data);
          }
        } else {
          addToast({
            title: "Error",
            description: "Failed to load profile",
            color: "danger",
          });
          router.push("/discover");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        addToast({
          title: "Error",
          description: "Failed to load profile",
          color: "danger",
        });
        router.push("/discover");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, token, router]);

  const handleLike = async () => {
    if (!profile || isLiking) return;

    setIsLiking(true);
    try {
      const endpoint = profile.is_liked ? `/api/unlike/${userId}` : `/api/like/${userId}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newIsLiked = !profile.is_liked;
          const newIsConnected = data.data?.is_connected || false;
          setProfile({ ...profile, is_liked: newIsLiked, is_connected: newIsConnected });
          addToast({
            title: profile.is_liked ? "Unliked" : "Liked",
            description: profile.is_liked
              ? "Removed from your likes"
              : newIsConnected
              ? "It's a match! You can now chat."
              : "Added to your likes",
            color: "success",
          });
        }
      }
    } catch (error) {
      console.error("Error liking/unliking:", error);
      addToast({
        title: "Error",
        description: "Failed to update like",
        color: "danger",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const formatLastSeen = (lastSeen: string): string => {
    if (!lastSeen) return "Never";
    
    const lastSeenDate = new Date(lastSeen);
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

  if (isLoading) {
    return (
      <ProtectedRoute requireAuth={true} requireSetup={true}>
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 md:px-4 py-8">
          <Skeleton className="rounded-lg">
            <div className="h-96 w-full rounded-lg bg-default-300" />
          </Skeleton>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return null;
  }

  const userImages = profile.images && profile.images.length > 0
    ? profile.images
    : profile.profile_picture
    ? [profile.profile_picture]
    : Array(5).fill(null);

  const handleBlock = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/block/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile({ ...profile, is_blocked: true, blocked_at: new Date().toISOString() });
          addToast({
            title: "User Blocked",
            description: "This user has been blocked and will no longer appear in your discover feed.",
            color: "success",
          });
        }
      } else {
        addToast({
          title: "Error",
          description: "Failed to block user",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      addToast({
        title: "Error",
        description: "Failed to block user",
        color: "danger",
      });
    }
  };

  const handleUnblock = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/unblock/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile({ ...profile, is_blocked: false, blocked_at: undefined });
          addToast({
            title: "User Unblocked",
            description: "This user has been unblocked and may appear in your discover feed again.",
            color: "success",
          });
        }
      } else {
        addToast({
          title: "Error",
          description: "Failed to unblock user",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      addToast({
        title: "Error",
        description: "Failed to unblock user",
        color: "danger",
      });
    }
  };

  const handleReport = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/report/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "This is not a human",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addToast({
            title: "User Reported",
            description: "Thank you for reporting. We'll review this account.",
            color: "success",
          });
        }
      } else {
        addToast({
          title: "Error",
          description: "Failed to report user",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error reporting user:", error);
      addToast({
        title: "Error",
        description: "Failed to report user",
        color: "danger",
      });
    }
  };

  const handleSimulateConnection = async () => {
    if (!profile) return;

    try {
      const response = await fetch(`/api/simulate-connection/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile({ ...profile, is_liked: true, is_connected: true });
          addToast({
            title: "Connection Simulated",
            description: "Mutual like created (Dev Only)",
            color: "success",
          });
        }
      } else {
        addToast({
          title: "Error",
          description: "Failed to simulate connection",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error simulating connection:", error);
      addToast({
        title: "Error",
        description: "Failed to simulate connection",
        color: "danger",
      });
    }
  };

  const formatBlockedDate = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ProtectedRoute requireAuth={true} requireSetup={true}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 md:px-4 py-8">
        {/* Blocked Message */}
        {profile.is_blocked && (
          <Card className="w-full border-warning" radius="lg">
            <CardBody className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <Icon icon="solar:block-bold" className="text-2xl text-warning" />
                <h3 className="text-lg font-semibold text-warning">You blocked this profile</h3>
              </div>
              {profile.blocked_at && (
                <p className="text-sm text-default-500">
                  Blocked on {formatBlockedDate(profile.blocked_at)}
                </p>
              )}
              <Button
                color="primary"
                variant="flat"
                size="sm"
                className="self-start"
                onPress={handleUnblock}
                startContent={<Icon icon="solar:unlock-bold" />}
              >
                Unblock Profile
              </Button>
            </CardBody>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="flat"
            size="sm"
            onPress={() => router.back()}
            startContent={<Icon icon="solar:arrow-left-linear" />}
          >
            Back to Discover
          </Button>
          <Popover
            showArrow
            backdrop="opaque"
            classNames={{
              base: [
                "before:bg-default-200",
              ],
              content: [
                "py-3 px-4 border border-default-200",
                "bg-linear-to-br from-white to-default-300",
                "dark:from-default-100 dark:to-default-50",
              ],
            }}
            placement="bottom-end"
          >
            <PopoverTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                aria-label="More options"
              >
                <Icon icon="solar:menu-dots-bold" className="text-xl" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              {(titleProps) => (
                <div className="px-1 py-2 w-48">
                  <h3 className="text-small font-bold mb-2" {...titleProps}>
                    Options
                  </h3>
                  <div className="flex flex-col gap-1">
                    {profile.is_blocked ? (
                      <Button
                        variant="light"
                        size="sm"
                        className="justify-start"
                        startContent={<Icon icon="solar:unlock-bold" className="text-lg" />}
                        onPress={handleUnblock}
                      >
                        Unblock
                      </Button>
                    ) : (
                      <Button
                        variant="light"
                        size="sm"
                        className="justify-start"
                        startContent={<Icon icon="solar:block-bold" className="text-lg" />}
                        onPress={handleBlock}
                      >
                        Block
                      </Button>
                    )}
                    <Button
                      variant="light"
                      size="sm"
                      className="justify-start"
                      startContent={<Icon icon="solar:flag-bold" className="text-lg" />}
                      onPress={handleReport}
                    >
                      Flag as "This is not a human"
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      className="justify-start text-warning"
                      startContent={<Icon icon="solar:link-bold" className="text-lg" />}
                      onPress={handleSimulateConnection}
                    >
                      Simulate Connection (Dev Only)
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Image Gallery */}
        <Card isFooterBlurred className="border-none w-full h-auto md:h-[450px]" radius="lg">
          <div className="grid grid-cols-12 gap-1 md:gap-2 h-full p-1 md:p-2">
            {/* Big image on the left - 6 columns (Profile image - slot 1) */}
            <div className="col-span-12 md:col-span-6 h-[402px] md:h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
              <Image
                alt="Main profile image"
                className="object-contain w-full h-full rounded-lg"
                src={userImages[0] || "https://heroui.com/images/hero-card.jpeg"}
              />
            </div>
            {/* 4 smaller images on the right - 3 columns each, 2 rows (slots 2-5) */}
            <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-1 md:gap-2 h-[300px] md:h-full min-h-0">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                  <Image
                    alt={`Profile image ${idx + 1}`}
                    className="object-contain w-full h-full rounded-lg"
                    src={userImages[idx] || "https://heroui.com/images/hero-card.jpeg"}
                  />
                </div>
              ))}
            </div>
          </div>
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white font-semibold drop-shadow-lg">
              Level {Math.floor(profile.fame_rating)} |{" "}
              {profile.is_liked ? (
                profile.is_connected ? (
                  <>
                    Start chatting with{" "}
                    <span 
                      className="underline cursor-pointer hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/chats");
                      }}
                    >
                      your connection
                    </span>
                    !
                  </>
                ) : (
                  <span className="font-normal italic">Once this user likes you you can start chatting!</span>
                )
              ) : (
                (profile.is_online || profile.has_viewed_your_profile) ? (
                  "This person was just online!"
                ) : (
                  <>
                    {profile.gender === "male" ? "He" : profile.gender === "female" ? "She" : "They"} did not visit your profile just yet.
                  </>
                )
              )}
            </p>
            <Button
              className="text-tiny text-white bg-black/20"
              color={profile.is_liked ? "danger" : "default"}
              radius="lg"
              size="sm"
              variant="flat"
              onPress={handleLike}
              isLoading={isLiking}
              isDisabled={profile.is_blocked}
              startContent={<Icon icon={profile.is_liked ? "solar:heart-bold" : "solar:heart-linear"} />}
            >
              {profile.is_liked ? "I don't like anymore" : "Like"}
            </Button>
          </CardFooter>
        </Card>

        {/* Profile Information */}
        <Card className="w-full" radius="lg">
          <CardBody className="flex flex-col gap-4 p-4 md:p-6">
            {/* Name and Basic Info */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                {profile.first_name} {profile.last_name}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-default-500">
                {profile.age > 0 && <span>{profile.age} years old</span>}
                {profile.gender && (
                  <span>
                    {profile.gender === "male" ? "He/Him" : profile.gender === "female" ? "She/Her" : profile.gender}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:map-point-linear" className="text-sm" />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.biography && (
              <div className="flex flex-col gap-1">
                <p className="text-sm md:text-base text-foreground whitespace-pre-wrap">
                  {profile.biography}
                </p>
              </div>
            )}

            {/* Tags/Interests */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-default-600">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag) => {
                    // Normalize tags for comparison (remove # and lowercase)
                    const normalizeTag = (t: string) => t.replace(/^#/, "").toLowerCase();
                    const normalizedTag = normalizeTag(tag);
                    const hasCommonTag = currentUserTags.some(
                      (userTag) => normalizeTag(userTag) === normalizedTag
                    );
                    
                    return (
                      <Chip
                        key={tag}
                        variant="flat"
                        color={hasCommonTag ? "warning" : "primary"}
                        size="sm"
                        className={hasCommonTag ? "bg-warning/20 text-warning border-warning/30" : ""}
                      >
                        {tag}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-sm text-default-500">
              {profile.sexual_preference && (
                <div className="flex items-center gap-1">
                  <Icon icon="solar:heart-linear" className="text-lg" />
                  <span>
                    Looking for:{" "}
                    {profile.sexual_preference === "male"
                      ? "Men"
                      : profile.sexual_preference === "female"
                      ? "Women"
                      : profile.sexual_preference === "both"
                      ? "Everyone"
                      : "Everyone"}
                  </span>
                </div>
              )}
              {profile.mbti && (
                <div className="flex items-center gap-1">
                  <Icon icon="solar:user-id-linear" className="text-lg" />
                  <span>MBTI: {profile.mbti}</span>
                </div>
              )}
              {profile.last_seen && (
                <div className="flex items-center gap-1">
                  <Icon icon="solar:clock-circle-linear" className="text-lg" />
                  <span>Last online: {formatLastSeen(profile.last_seen)}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
