"use client";

import React, { useTransition } from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Link } from "@heroui/link";
import { Alert } from "@heroui/alert";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Select, SelectItem } from "@heroui/select";
import { Slider } from "@heroui/slider";
import { Checkbox } from "@heroui/checkbox";
import { RadioGroup, Radio } from "@heroui/radio";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { addToast } from "@heroui/toast";
import { ServerStatusModal } from "@/components/ServerStatusModal";

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
  tags: string[];
  gender?: string;
  distance_km?: number;
  is_connected?: boolean;
}

interface PopularTag {
  tag: string;
  user_count: number;
}

interface TagMatchStatus {
  has_matching_tags: boolean;
  tag_count: number;
  has_too_many_tags: boolean;
  match_count?: number;
}

/** Level at which a user is shown as "mafia boss" (rainbow glow + hover dialog). Use 100 to match max level in docs, or 1000 for a future tier. */
const MAFIA_BOSS_LEVEL = 100;

export default function DiscoverPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profiles, setProfiles] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [tagMatchStatus, setTagMatchStatus] = React.useState<TagMatchStatus | null>(null);
  const [popularTags, setPopularTags] = React.useState<PopularTag[]>([]);
  const [currentUserTags, setCurrentUserTags] = React.useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = React.useState(false);
  const [isServerOffline, setIsServerOffline] = React.useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [showTagAlert, setShowTagAlert] = React.useState(true);
  const [addedTags, setAddedTags] = React.useState<Set<string>>(new Set());
  const [forceTagsAlert, setForceTagsAlert] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("");
  const {isOpen: isFilterModalOpen, onOpen: onFilterModalOpen, onOpenChange: onFilterModalOpenChange} = useDisclosure();

  // Mafia boss hover dialog: which profile's popover is open (if any)
  const [mafiaPopoverProfileId, setMafiaPopoverProfileId] = React.useState<number | null>(null);
  const mafiaPopoverCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Filter states
  const [distanceRange, setDistanceRange] = React.useState<number[]>([0, 5000]);
  const [ageRange, setAgeRange] = React.useState<number[]>([18, 100]);
  const [onlyCommonTags, setOnlyCommonTags] = React.useState(false);
  const [fameRatingMin, setFameRatingMin] = React.useState<number>(0);

  const loadProfiles = React.useCallback(async (currentOffset: number = 0) => {
    try {
      setIsLoading(true);
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const sortParam = sortBy ? `&sort=${sortBy}` : "";
      const minAgeParam = ageRange[0] > 18 ? `&minAge=${ageRange[0]}` : "";
      const maxAgeParam = ageRange[1] < 100 ? `&maxAge=${ageRange[1]}` : "";
      const minDistanceParam = distanceRange[0] > 0 ? `&minDistance=${distanceRange[0]}` : "";
      const maxDistanceParam = distanceRange[1] < 5000 ? `&maxDistance=${distanceRange[1]}` : "";
      const onlyCommonTagsParam = onlyCommonTags ? `&onlyCommonTags=true` : "";
      const fameRatingMinParam = fameRatingMin > 0 ? `&fameRatingMin=${fameRatingMin}` : "";
      
      const filterParams = `${sortParam}${minAgeParam}${maxAgeParam}${minDistanceParam}${maxDistanceParam}${onlyCommonTagsParam}${fameRatingMinParam}`;
      const response = await fetch(`/api/browse?limit=20&offset=${currentOffset}${filterParams}`, {
        headers,
      }).catch((error) => {
        // Network error - server is likely offline
        console.error("Network error:", error);
        setIsServerOffline(true);
        throw error;
      });

      if (response.ok) {
        setIsServerOffline(false);
        const data = await response.json();
        console.log("Browse API response:", data);
        
        // Handle both possible response formats
        let profilesData = null;
        if (data.success && data.data) {
          profilesData = data.data.profiles || data.data;
        } else if (data.profiles) {
          // Direct profiles array
          profilesData = data.profiles;
        } else if (Array.isArray(data)) {
          // Direct array response
          profilesData = data;
        }
        
        if (profilesData && Array.isArray(profilesData)) {
          const newProfiles = profilesData;
          if (currentOffset === 0) {
            setProfiles(newProfiles);
          } else {
            setProfiles((prev) => [...prev, ...newProfiles]);
          }
          setHasMore(newProfiles.length === 20);
        } else {
          console.error("API response format error - no profiles array:", data);
          setProfiles([]);
        }
      } else {
        // Check if it's a server error (500, 502, 503, 504) or connection issue
        // Status 0 usually means network error (server not reachable)
        if (response.status === 0 || response.status >= 500) {
          setIsServerOffline(true);
        } else {
          // Other errors (401, 404, etc.) are not server offline issues
          setIsServerOffline(false);
        }
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API error:", response.status, errorData);
        setProfiles([]);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      // Network errors (connection refused, timeout, etc.)
      if (error instanceof TypeError || (error as any)?.message?.includes("fetch")) {
        setIsServerOffline(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, sortBy, ageRange, distanceRange, onlyCommonTags, fameRatingMin]);

  // Reset loading state immediately when component mounts or route changes
  React.useEffect(() => {
    setIsLoading(true);
    setProfiles([]);
    setOffset(0);
    setHasMore(true);
  }, []); // Only on mount/route change

  React.useEffect(() => {
    loadProfiles(0);
  }, [loadProfiles]);

  // Load tag match status, popular tags, and user's current tags
  React.useEffect(() => {
    if (!token) return;

    const loadTagInfo = async () => {
      try {
        // Load user's current tags
        const profileResponse = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((error) => {
          setIsServerOffline(true);
          throw error;
        });

        if (profileResponse.ok) {
          setIsServerOffline(false);
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.data && profileData.data.tags) {
            // Store raw tags for comparison
            setCurrentUserTags(profileData.data.tags || []);
            // Normalize tags and add to addedTags set
            const userTags = (profileData.data.tags as string[]).map(tag => {
              const normalized = tag.trim();
              return normalized.startsWith("#") ? normalized : `#${normalized}`;
            });
            setAddedTags(new Set(userTags.map(tag => tag.toLowerCase())));
          }
        } else if (profileResponse.status >= 500) {
          setIsServerOffline(true);
        }

        // Load tag match status
        const matchResponse = await fetch("/api/tags/user-match", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((error) => {
          setIsServerOffline(true);
          throw error;
        });

        if (matchResponse.ok) {
          setIsServerOffline(false);
          const matchData = await matchResponse.json();
          if (matchData.success && matchData.data) {
            setTagMatchStatus(matchData.data);
          }
        } else if (matchResponse.status >= 500) {
          setIsServerOffline(true);
        }

        // Load popular tags
        const popularResponse = await fetch("/api/tags/popular", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch((error) => {
          setIsServerOffline(true);
          throw error;
        });

        if (popularResponse.ok) {
          setIsServerOffline(false);
          const popularData = await popularResponse.json();
          if (popularData.success && popularData.data) {
            setPopularTags(popularData.data.popular_tags || []);
          }
        } else if (popularResponse.status >= 500) {
          setIsServerOffline(true);
        }
      } catch (error) {
        console.error("Error loading tag info:", error);
        if (error instanceof TypeError || (error as any)?.message?.includes("fetch")) {
          setIsServerOffline(true);
        }
      }
    };

    loadTagInfo();
  }, [token]);

  const handleRemoveTag = async (tag: string) => {
    if (!token) return;

    // Normalize tag for comparison
    const normalizedTag = tag.trim().toLowerCase();

    try {
      const response = await fetch("/api/tags/remove", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag }),
      }).catch((error) => {
        setIsServerOffline(true);
        throw error;
      });

      if (response.ok) {
        setIsServerOffline(false);
        const data = await response.json();
        if (data.success) {
          // Remove from addedTags set
          setAddedTags(prev => {
            const newSet = new Set(prev);
            newSet.delete(normalizedTag);
            return newSet;
          });
          
          addToast({
            title: "Tag Removed",
            description: `Removed ${tag} from your profile`,
            color: "success",
          });
          // Reload tag match status
          const matchResponse = await fetch("/api/tags/user-match", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            if (matchData.success && matchData.data) {
              setTagMatchStatus(matchData.data);
            }
          }
        }
      } else {
        const errorData = await response.json();
        addToast({
          title: "Error",
          description: errorData.error || "Failed to remove tag",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error removing tag:", error);
      addToast({
        title: "Error",
        description: "Failed to remove tag",
        color: "danger",
      });
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!token) return;

    // Normalize tag for comparison
    const normalizedTag = tag.trim().toLowerCase();
    const tagWithHash = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;

    setIsLoadingTags(true);
    try {
      const response = await fetch("/api/tags/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag: tagWithHash }),
      }).catch((error) => {
        setIsServerOffline(true);
        throw error;
      });

      if (response.ok) {
        setIsServerOffline(false);
        const data = await response.json();
        if (data.success) {
          // Add to addedTags set (keep popover open and alert visible)
          setAddedTags(prev => new Set([...prev, normalizedTag]));
          
          // Create a toast with a revert link
          const TagAddedDescription = () => (
            <span>
              Added {tagWithHash} to your profile.{" "}
              <button
                onClick={() => handleRemoveTag(tagWithHash)}
                className="underline text-primary hover:text-primary-600 font-medium cursor-pointer"
              >
                Revert
              </button>
            </span>
          );

          addToast({
            title: "Tag Added",
            description: <TagAddedDescription />,
            color: "success",
          });
          
          // Reload tag match status (but keep popover open and alert visible)
          const matchResponse = await fetch("/api/tags/user-match", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            if (matchData.success && matchData.data) {
              setTagMatchStatus(matchData.data);
            }
          }
          
          // Reload profiles with updated filters
          setOffset(0);
          loadProfiles(0);
          
          // Keep popover open and alert visible - don't close them
          setIsPopoverOpen(true);
          setShowTagAlert(true);
        }
      } else {
        const errorData = await response.json();
        addToast({
          title: "Error",
          description: errorData.error || "Failed to add tag",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      addToast({
        title: "Error",
        description: "Failed to add tag",
        color: "danger",
      });
    } finally {
      setIsLoadingTags(false);
    }
  };

  const loadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    loadProfiles(newOffset);
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  // Show alert if:
  // 1. We have tag match status
  // 2. showTagAlert is true OR popover is open (master control - alert stays visible when interacting with popover)
  // 3. User has no matching tags OR forceTagsAlert is true
  const shouldShowAlert = tagMatchStatus && (showTagAlert || isPopoverOpen) && (
    !tagMatchStatus.has_matching_tags || forceTagsAlert
  );

  // Clear forceTagsAlert when user has 5 tags
  React.useEffect(() => {
    if (tagMatchStatus && tagMatchStatus.tag_count >= 5) {
      setForceTagsAlert(false);
    }
  }, [tagMatchStatus]);

  // Reset showTagAlert when tag match status changes (new data loaded)
  React.useEffect(() => {
    if (tagMatchStatus && !tagMatchStatus.has_matching_tags && !tagMatchStatus.has_too_many_tags) {
      // If user now has matching tags and not too many, reset the alert state
      // But only if popover is not open (keep alert visible if popover is open)
      if (!isPopoverOpen) {
        setShowTagAlert(true);
      }
    }
  }, [tagMatchStatus, isPopoverOpen]);

  const handleRetryConnection = async () => {
    setIsServerOffline(false);
    
    // Temporarily suppress console.error for retry attempts
    const originalConsoleError = console.error;
    const suppressedErrors: any[] = [];
    console.error = (...args: any[]) => {
      // Suppress errors during retry
      suppressedErrors.push(args);
    };
    
    try {
      await loadProfiles(0);
      
      // Reload tag info if server came back online
      if (token) {
        try {
          const matchResponse = await fetch("/api/tags/user-match", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {
            setIsServerOffline(true);
            return null;
          });
          
          if (matchResponse && matchResponse.ok) {
            const matchData = await matchResponse.json();
            if (matchData.success && matchData.data) {
              setTagMatchStatus(matchData.data);
            }
          }

          const popularResponse = await fetch("/api/tags/popular", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {
            setIsServerOffline(true);
            return null;
          });
          
          if (popularResponse && popularResponse.ok) {
            const popularData = await popularResponse.json();
            if (popularData.success && popularData.data) {
              setPopularTags(popularData.data.popular_tags || []);
            }
          }
        } catch (error) {
          // Silently handle errors - server might still be offline
          setIsServerOffline(true);
        }
      }
    } catch (error) {
      // Silently handle any unexpected errors - server is still offline
      setIsServerOffline(true);
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  };

  return (
    <ProtectedRoute requireAuth={true} requireSetup={true}>
      <ServerStatusModal 
        isOpen={isServerOffline} 
        onRetry={handleRetryConnection}
      />
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-2 md:px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 
            onClick={onFilterModalOpen}
            className="text-3xl md:text-4xl font-bold underline decoration-blue-500 text-default-900 dark:text-default-100 hover:decoration-blue-600 transition-colors cursor-pointer"
          >
            Discover
          </h1>
        </div>

        {/* Tag Alert */}
        {shouldShowAlert && (
          <Alert
            color="warning"
            description="You don't have any tags which the other users have. Review them and you will match with more people."
            endContent={
              <Popover 
                placement="right"
                isOpen={isPopoverOpen}
                onOpenChange={(open) => {
                  setIsPopoverOpen(open);
                  if (!open) {
                    // Only hide alert when popover closes (user clicks away)
                    setShowTagAlert(false);
                  } else {
                    // When popover opens, ensure alert stays visible and set forceTagsAlert
                    setShowTagAlert(true);
                    setForceTagsAlert(true);
                  }
                }}
              >
                <PopoverTrigger>
                  <Button 
                    color="warning" 
                    size="sm" 
                    variant="flat"
                    onPress={() => {
                      // Set forceTagsAlert when Review button is clicked
                      setForceTagsAlert(true);
                      setIsPopoverOpen(true);
                      setShowTagAlert(true);
                    }}
                  >
                    Review
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  {(titleProps) => (
                    <div className="px-1 py-2 w-64">
                      <h3 className="text-small font-bold mb-3" {...titleProps}>
                        These are popular tags
                      </h3>
                      <div className="flex flex-col gap-2">
                        {popularTags.length > 0 ? (
                          popularTags.map((popularTag) => {
                            const normalizedTag = popularTag.tag.trim().toLowerCase();
                            const isAdded = addedTags.has(normalizedTag);
                            const isDisabled = isLoadingTags || isAdded || (tagMatchStatus?.tag_count || 0) >= 5;
                            
                            return (
                              <div
                                key={popularTag.tag}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-default-100 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{popularTag.tag}</span>
                                  <span className="text-xs text-default-500">
                                    {popularTag.user_count} {popularTag.user_count === 1 ? "person" : "people"} have this tag
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color={isAdded ? "success" : "primary"}
                                  onPress={() => {
                                    if (!isAdded) {
                                      handleAddTag(popularTag.tag);
                                    }
                                  }}
                                  isDisabled={isDisabled}
                                >
                                  {isAdded ? "Added" : "Add"}
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-tiny text-default-500">No popular tags available</p>
                        )}
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            }
            title="Tags, tags, tags, tags....."
            variant="faded"
          />
        )}


        {isLoading && profiles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="w-full">
                <Skeleton className="rounded-lg">
                  <div className="h-48 w-full rounded-lg bg-default-300" />
                </Skeleton>
                <CardBody className="gap-2">
                  <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-4 w-3/5 rounded-lg bg-default-200" />
                  </Skeleton>
                  <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-3 w-4/5 rounded-lg bg-default-200" />
                  </Skeleton>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Icon icon="solar:users-group-rounded-linear" className="text-6xl text-default-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No profiles found</h2>
            <p className="text-default-500 text-center">
              There are no users to discover yet. Check back later!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profiles.map((profile) => {
                const isMafiaBoss = Math.floor(profile.fame_rating) >= MAFIA_BOSS_LEVEL;
                const card = (
                  <Card
                    key={profile.id}
                    className={`w-full hover:scale-105 transition-transform cursor-pointer ${
                      isMafiaBoss
                        ? "animate-rainbow-glow"
                        : ""
                    } ${
                      profile.is_connected && !isMafiaBoss
                        ? "shadow-[0_0_8px_rgba(34,197,94,0.3),0_0_16px_rgba(34,197,94,0.2)] border border-green-500/30"
                        : ""
                    }`}
                    onClick={() => {
                      startTransition(() => {
                        router.push(`/discover/${profile.id}`);
                      });
                    }}
                  >
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      alt={profile.first_name}
                      className="object-cover w-full h-full"
                      src={profile.profile_picture || "https://heroui.com/images/hero-card.jpeg"}
                    />
                    {profile.is_online && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center gap-2 text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded drop-shadow-lg">
                        <span>Level {Math.floor(profile.fame_rating)}</span>
                      </div>
                    </div>
                  </div>
                  <CardBody className="p-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-default-500">
                        {profile.age > 0 && <span>{profile.age} years old</span>}
                        {profile.distance_km !== undefined && profile.distance_km > 0 && (
                          <>
                            {profile.age > 0 && <span>•</span>}
                            <span className="flex items-center gap-1">
                              <Icon icon="solar:map-point-linear" className="text-xs" />
                              {profile.distance_km.toFixed(1)} km
                            </span>
                          </>
                        )}
                        {profile.location && profile.location !== "-" && (
                          <>
                            {(profile.age > 0 || profile.distance_km) && <span>•</span>}
                            <span className="flex items-center gap-1">
                              <Icon icon="solar:location-linear" className="text-xs" />
                              {profile.location}
                            </span>
                          </>
                        )}
                      </div>
                      {profile.last_seen && (
                        <div className="flex items-center gap-1 text-xs text-default-400">
                          <Icon icon="solar:clock-circle-linear" className="text-xs" />
                          <span>{formatLastSeen(profile.last_seen)}</span>
                        </div>
                      )}
                    </div>
                    {profile.biography && (
                      <p className="text-sm text-default-600 mt-2 line-clamp-2">
                        {profile.biography}
                      </p>
                    )}
                    {profile.tags && profile.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.tags.slice(0, 3).map((tag) => {
                          const normalizeTag = (t: string) => t.replace(/^#/, "").toLowerCase();
                          const normalizedTag = normalizeTag(tag);
                          const hasCommonTag = currentUserTags.some(
                            (userTag) => normalizeTag(userTag) === normalizedTag
                          );
                          // Yellow for shared tags only when "only show people with shared tags" is on; otherwise white text
                          const showSharedAsYellow = onlyCommonTags && hasCommonTag;
                          return (
                            <Chip
                              key={tag}
                              size="sm"
                              variant="flat"
                              color={showSharedAsYellow ? "warning" : "default"}
                              className={showSharedAsYellow ? "bg-warning/20 text-warning border-warning/30" : "text-default-700 dark:text-default-300"}
                            >
                              {tag}
                            </Chip>
                          );
                        })}
                        {profile.tags.length > 3 && (
                          <Chip size="sm" variant="flat" color="default">
                            +{profile.tags.length - 3}
                          </Chip>
                        )}
                      </div>
                    )}
                  </CardBody>
                  <CardFooter className="pt-0">
                    <div
                      className="w-full px-3 py-1.5 text-sm text-center rounded-lg bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        startTransition(() => {
                          router.push(`/discover/${profile.id}`);
                        });
                      }}
                    >
                      View Profile
                    </div>
                  </CardFooter>
                </Card>
                );

                if (isMafiaBoss) {
                  return (
                    <Popover
                      key={profile.id}
                      isOpen={mafiaPopoverProfileId === profile.id}
                      onOpenChange={(open) => !open && setMafiaPopoverProfileId(null)}
                      placement="top"
                      showArrow
                      classNames={{ content: "max-w-xs" }}
                    >
                      <PopoverTrigger>
                        <div
                          className="w-full"
                          onMouseEnter={() => {
                            if (mafiaPopoverCloseTimeoutRef.current) {
                              clearTimeout(mafiaPopoverCloseTimeoutRef.current);
                              mafiaPopoverCloseTimeoutRef.current = null;
                            }
                            setMafiaPopoverProfileId(profile.id);
                          }}
                          onMouseLeave={() => {
                            mafiaPopoverCloseTimeoutRef.current = setTimeout(
                              () => setMafiaPopoverProfileId(null),
                              400
                            );
                          }}
                        >
                          {card}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div
                          className="px-3 py-3"
                          onMouseEnter={() => {
                            if (mafiaPopoverCloseTimeoutRef.current) {
                              clearTimeout(mafiaPopoverCloseTimeoutRef.current);
                              mafiaPopoverCloseTimeoutRef.current = null;
                            }
                          }}
                          onMouseLeave={() => setMafiaPopoverProfileId(null)}
                        >
                          <p className="font-semibold text-default-900 dark:text-default-100 mb-2">
                            Congratulations! You found your first level {MAFIA_BOSS_LEVEL} mafia boss!
                          </p>
                          <p className="italic text-default-600 dark:text-default-400 text-sm mb-4">
                            This user is as popular as possible!
                          </p>
                          <Button
                            size="sm"
                            color="primary"
                            className="w-full"
                            onPress={() => {
                              setMafiaPopoverProfileId(null);
                              startTransition(() => router.push(`/discover/${profile.id}`));
                            }}
                          >
                            Check them out
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
                return card;
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  color="primary"
                  variant="flat"
                  onPress={loadMore}
                  isLoading={isLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter and Sort Modal */}
      <Modal isOpen={isFilterModalOpen} onOpenChange={onFilterModalOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-xl font-semibold">Filter & Sort</h2>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setSortBy("");
                      setDistanceRange([0, 5000]);
                      setAgeRange([18, 100]);
                      setOnlyCommonTags(false);
                      setFameRatingMin(0);
                      setOffset(0);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sort Section */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold">Sort By</h3>
                    <RadioGroup
                      value={sortBy}
                      onValueChange={(value) => {
                        setSortBy(value);
                        setOffset(0);
                      }}
                      orientation="vertical"
                    >
                      <Radio value="">Default (Distance & Tags)</Radio>
                      <Radio value="age_asc">Age (Youngest First)</Radio>
                      <Radio value="age_desc">Age (Oldest First)</Radio>
                      <Radio value="location">Location (Closest First)</Radio>
                      <Radio value="fame">Fame Rating (Highest First)</Radio>
                      <Radio value="tags">Common Tags (Most First)</Radio>
                    </RadioGroup>
                  </div>

                  {/* Filters Section */}
                  <div className="flex flex-col gap-4">
                    {/* Age Range */}
                    <div className="flex flex-col gap-2">
                      <Slider
                        label="Age Range"
                        minValue={18}
                        maxValue={100}
                        step={1}
                        value={ageRange}
                        onChange={(value) => {
                          setAgeRange(value as number[]);
                          setOffset(0);
                        }}
                        formatOptions={{style: "decimal"}}
                        className="max-w-md"
                      />
                      <p className="text-xs text-default-500">
                        {ageRange[0]} - {ageRange[1]} years
                      </p>
                    </div>

                    {/* Distance Range */}
                    <div className="flex flex-col gap-2">
                      <Slider
                        label="Distance Range (km)"
                        minValue={0}
                        maxValue={5000}
                        step={10}
                        value={distanceRange}
                        onChange={(value) => {
                          setDistanceRange(value as number[]);
                          setOffset(0);
                        }}
                        formatOptions={{style: "decimal", maximumFractionDigits: 0}}
                        className="max-w-md"
                      />
                      <p className="text-xs text-default-500">
                        {distanceRange[0]} - {distanceRange[1]} km
                      </p>
                    </div>

                    {/* Fame Rating Minimum */}
                    <div className="flex flex-col gap-2">
                      <Slider
                        label="Minimum Fame Level"
                        minValue={0}
                        maxValue={100}
                        step={1}
                        value={fameRatingMin}
                        onChange={(value) => {
                          setFameRatingMin(value as number);
                          setOffset(0);
                        }}
                        formatOptions={{style: "decimal", maximumFractionDigits: 0}}
                        className="max-w-md"
                      />
                      <p className="text-xs text-default-500">
                        Level {fameRatingMin} and above
                      </p>
                    </div>

                    {/* Only Common Tags Checkbox */}
                    <Checkbox
                      isSelected={onlyCommonTags}
                      onValueChange={(checked) => {
                        setOnlyCommonTags(checked);
                        setOffset(0);
                      }}
                    >
                      Only show profiles with common tags
                    </Checkbox>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={onClose}>
                  Apply
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </ProtectedRoute>
  );
}
