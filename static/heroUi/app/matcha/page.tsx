"use client";

import React from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Tooltip } from "@heroui/tooltip";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import clsx from "clsx";

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
}

const MATCH_POOL_SIZE = 67;
const MATCH_ROUNDS = 5;

export default function MatchaPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  // Match session state (5 rounds, pool of 67)
  const [matchActive, setMatchActive] = React.useState(false);
  const [matchComplete, setMatchComplete] = React.useState(false);
  const [pool, setPool] = React.useState<UserProfile[]>([]);
  const [excludedIds, setExcludedIds] = React.useState<Set<number>>(new Set());
  const [keptProfile, setKeptProfile] = React.useState<UserProfile | null>(null);
  const [currentFive, setCurrentFive] = React.useState<UserProfile[]>([]);
  const [round, setRound] = React.useState(1);
  const { isOpen: isSnoozeOpen, onOpen: onSnoozeOpen, onOpenChange: onSnoozeOpenChange } = useDisclosure();
  const { isOpen: isFinalPickOpen, onOpen: onFinalPickOpen, onOpenChange: onFinalPickOpenChange } = useDisclosure();
  const poolRef = React.useRef<UserProfile[]>([]);
  poolRef.current = pool;
  // Browse state (when not in a match)
  const [profiles, setProfiles] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [finalPickSending, setFinalPickSending] = React.useState<number | null>(null);

  const loadProfiles = React.useCallback(async (currentOffset: number = 0) => {
    try {
      setIsLoading(true);
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`/api/browse?limit=5&offset=${currentOffset}`, {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        let profilesData = null;
        if (data.success && data.data) {
          profilesData = data.data.profiles || data.data;
        } else if (data.profiles) {
          profilesData = data.profiles;
        } else if (Array.isArray(data)) {
          profilesData = data;
        }
        if (profilesData && Array.isArray(profilesData)) {
          const newProfiles = profilesData;
          if (currentOffset === 0) {
            setProfiles(newProfiles);
          } else {
            setProfiles((prev) => [...prev, ...newProfiles]);
          }
          setHasMore(newProfiles.length === 5);
        } else {
          setProfiles([]);
        }
      } else {
        setProfiles([]);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (!matchActive) loadProfiles(0);
  }, [loadProfiles, matchActive]);

  const loadMore = () => {
    setOffset((o) => o + 5);
    loadProfiles(offset + 5);
  };

  const startMatch = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/browse?limit=${MATCH_POOL_SIZE}&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      let profilesData: UserProfile[] | null = null;
      if (data.success && data.data) {
        profilesData = data.data.profiles ?? data.data;
      }
      if (!profilesData && data.profiles) {
        profilesData = data.profiles;
      }
      if (!profilesData && Array.isArray(data)) {
        profilesData = data;
      }
      if (profilesData && Array.isArray(profilesData)) {
        const list = profilesData.slice(0, MATCH_POOL_SIZE);
        setPool(list);
        setExcludedIds(new Set());
        setKeptProfile(null);
        setCurrentFive(list.slice(0, 5));
        setRound(1);
        setMatchComplete(false);
        setMatchActive(true);
      }
    } catch (e) {
      console.error("Error starting match:", e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const keepProfileInMatch = React.useCallback(
    (clicked: UserProfile) => {
      // Once you keep someone, they stay for all subsequent rounds; only the other 4 slots rotate
      const stays = keptProfile ?? clicked;
      const otherFour = currentFive.filter((p) => p.id !== stays.id);
      const newExcluded = new Set(excludedIds);
      otherFour.forEach((p) => newExcluded.add(p.id));
      setExcludedIds(newExcluded);
      setKeptProfile(stays);

      if (round >= MATCH_ROUNDS) {
        setMatchComplete(true);
        setCurrentFive([stays]);
        return;
      }

      const poolNow = poolRef.current;
      const nextFour = poolNow.filter(
        (p) => p.id !== stays.id && !newExcluded.has(p.id)
      ).slice(0, 4);
      const nextFive: UserProfile[] = [stays, ...nextFour];
      setCurrentFive(() => nextFive);
      setRound((r) => r + 1);

      // When advancing to round 5, open the final pick dialog
      if (round === MATCH_ROUNDS - 1) {
        setTimeout(() => onFinalPickOpen(), 0);
      }
    },
    [currentFive, round, excludedIds, keptProfile, onFinalPickOpen]
  );

  // Open final pick dialog when we land on round 5
  React.useEffect(() => {
    if (round === MATCH_ROUNDS && matchActive && currentFive.length > 0 && !matchComplete) {
      onFinalPickOpen();
    }
  }, [round, matchActive, currentFive.length, matchComplete, onFinalPickOpen]);

  const stillTop = React.useCallback(() => {
    if (!keptProfile || round >= MATCH_ROUNDS) return;
    keepProfileInMatch(keptProfile);
  }, [keptProfile, round, keepProfileInMatch]);

  const endMatch = () => {
    setMatchActive(false);
    setMatchComplete(false);
    setPool([]);
    setExcludedIds(new Set());
    setKeptProfile(null);
    setCurrentFive([]);
    setRound(1);
    setFinalPickSending(null);
    if (isFinalPickOpen) onFinalPickOpenChange();
    loadProfiles(0);
  };

  const handleFinalPick = React.useCallback(
    async (profile: UserProfile) => {
      if (!token) return;
      setFinalPickSending(profile.id);
      try {
        const res = await fetch(`/api/like/${profile.id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setKeptProfile(profile);
          setMatchComplete(true);
          onFinalPickOpenChange();
        }
      } catch {
        // ignore
      } finally {
        setFinalPickSending(null);
      }
    },
    [token, onFinalPickOpenChange]
  );

  const keptProfileId = keptProfile?.id ?? null;
  const inMatchMode = matchActive && currentFive.length > 0;
  // In match mode: never show profiles that are ineligible (excluded / not kept)
  const displayProfiles = inMatchMode
    ? currentFive.filter((p) => !excludedIds.has(p.id))
    : profiles.slice(0, 5);

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
      <div className="flex flex-col gap-6 w-full px-2 md:px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Welcome to Matcha</h1>
            <p className="text-lg text-default-500 mt-2">
              {matchActive
                ? `${MATCH_POOL_SIZE} contenders drafted · top 5 shown · click one to keep (others discarded)`
                : "Start a match to draft 67 contenders and see the top 5. Click to keep one, discard the rest."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {matchActive && !matchComplete && (
              <span className="text-sm font-medium text-default-500">
                Round {round}/{MATCH_ROUNDS}
              </span>
            )}
            {matchActive && !matchComplete && (
              <Button variant="flat" size="sm" onPress={endMatch}>
                End match
              </Button>
            )}
            {user && (
              <p className="text-sm text-default-400">
                Logged in as: <span className="font-semibold">{user.username}</span>
              </p>
            )}
          </div>
        </div>

        <Modal isOpen={isSnoozeOpen} onOpenChange={onSnoozeOpenChange} placement="center">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 text-center">
              Ok, lets snooze these!
            </ModalHeader>
            <ModalBody className="text-center pb-2">
              <p className="text-default-600">Wanna play again (1 try left)</p>
            </ModalBody>
            <ModalFooter className="flex justify-center gap-2">
              <Button color="primary" onPress={() => { onSnoozeOpenChange(); endMatch(); }}>
                Play again
              </Button>
              <Button variant="flat" onPress={onSnoozeOpenChange}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Round 5: final pick — click one to send a like */}
        <Modal
          isOpen={isFinalPickOpen}
          onOpenChange={onFinalPickOpenChange}
          placement="center"
          size="3xl"
          scrollBehavior="inside"
          isDismissable={false}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 text-center">
              <span className="text-xl font-bold">Final pick!</span>
              <span className="text-sm font-normal text-default-500">
                Click one user to match with. This will instantly send them a like.
              </span>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentFive.map((profile) => (
                  <Card
                    key={profile.id}
                    isPressable
                    className="w-full transition-all hover:scale-[1.02] hover:border-primary"
                    onPress={() => handleFinalPick(profile)}
                    isDisabled={finalPickSending !== null}
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        alt={profile.first_name}
                        className="object-cover w-full h-full"
                        src={profile.profile_picture || "https://heroui.com/images/hero-card.jpeg"}
                      />
                      {finalPickSending === profile.id && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">Sending like…</span>
                        </div>
                      )}
                    </div>
                    <CardBody className="p-3">
                      <h3 className="font-semibold truncate">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      {profile.age > 0 && (
                        <p className="text-sm text-default-500">{profile.age} years old</p>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>

        {matchComplete && keptProfile && (
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Your match!</h2>
            <p className="text-default-600 mb-4">
              You kept {keptProfile.first_name} {keptProfile.last_name} after {MATCH_ROUNDS} rounds.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                color="primary"
                onPress={() => router.push(`/discover/${keptProfile.id}`)}
              >
                View profile
              </Button>
              <Button variant="flat" onPress={endMatch}>
                Start a new match
              </Button>
            </div>
          </div>
        )}

        {isLoading && !matchActive && profiles.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 w-full">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="w-full">
                <Skeleton className="rounded-lg">
                  <div className="h-64 w-full rounded-lg bg-default-300" />
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
        ) : !matchActive && profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Icon icon="solar:users-group-rounded-linear" className="text-6xl text-default-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No profiles found</h2>
            <p className="text-default-500 text-center">
              There are no users to discover yet. Check back later!
            </p>
          </div>
        ) : (inMatchMode || profiles.length > 0) && !matchComplete ? (
          <>
            {round < MATCH_ROUNDS && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 w-full">
              {displayProfiles.map((profile) => {
                const isKept = profile.id === keptProfileId;
                const handlePictureClick = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (inMatchMode && !matchComplete) {
                    if (isKept) {
                      router.push(`/discover/${profile.id}`);
                    } else {
                      console.log(`Matcha - round ${round}, keeping profile ${profile.id}`);
                      keepProfileInMatch(profile);
                    }
                  } else {
                    router.push(`/discover/${profile.id}`);
                  }
                };
                const handleCardClick = () => {
                  router.push(`/discover/${profile.id}`);
                };
                return (
                <Card
                  key={inMatchMode ? `${round}-${profile.id}` : profile.id}
                  className={clsx(
                    "w-full transition-all cursor-pointer",
                    isKept
                      ? "border border-default-200"
                      : inMatchMode
                        ? "group border-2 border-transparent hover:border-dashed hover:border-default-400 hover:scale-105"
                        : "border-2 border-transparent"
                  )}
                  onClick={handleCardClick}
                >
                  <div
                    className="relative h-64 w-full overflow-hidden cursor-pointer"
                    onClick={handlePictureClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        (e.target as HTMLElement).click();
                      }
                    }}
                    aria-label={isKept ? "View profile" : inMatchMode ? "Keep this profile" : "View profile"}
                  >
                    <Image
                      alt={profile.first_name}
                      className="object-cover w-full h-full"
                      src={profile.profile_picture || "https://heroui.com/images/hero-card.jpeg"}
                    />
                    {inMatchMode && !isKept && (
                      <div
                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        aria-hidden
                      >
                        <span
                          className="text-gray-300 font-bold text-4xl md:text-5xl select-none drop-shadow-lg"
                          style={{ transform: "rotate(-50deg)" }}
                        >
                          KEEP
                        </span>
                      </div>
                    )}
                    {profile.is_online && (
                      <div className="absolute top-2 right-2 z-20">
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                    )}
                  </div>
                  <CardBody className="p-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-semibold truncate">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-default-500 flex-wrap">
                        {profile.age > 0 && <span>{profile.age} years old</span>}
                        {profile.location && (
                          <>
                            <span className="flex items-center gap-1 truncate">
                              <Icon icon="solar:map-point-linear" className="text-xs shrink-0" />
                              <span className="truncate">{profile.location}</span>
                            </span>
                          </>
                        )}
                        {profile.distance_km !== undefined && profile.distance_km >= 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Icon icon="solar:routing-3-linear" className="text-xs shrink-0" />
                              <span>{profile.distance_km.toFixed(1)} km</span>
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
                        {profile.tags.slice(0, 2).map((tag) => (
                          <Chip key={tag} size="sm" variant="flat" color="primary">
                            {tag}
                          </Chip>
                        ))}
                        {profile.tags.length > 2 && (
                          <Chip size="sm" variant="flat" color="default">
                            +{profile.tags.length - 2}
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
                        router.push(`/discover/${profile.id}`);
                      }}
                    >
                      View Profile
                    </div>
                  </CardFooter>
                </Card>
              );
              })}
              {inMatchMode && round >= 2 && round < MATCH_ROUNDS && !matchComplete && (
                <div className="w-full min-h-[320px] rounded-lg border-2 border-default-200 dark:border-default-100 overflow-hidden flex flex-col">
                  <Button
                    color="primary"
                    className="flex-1 min-h-[160px] rounded-none text-base font-semibold"
                    onPress={stillTop}
                    endContent={<Icon icon="solar:arrow-right-linear" />}
                  >
                    Still Top →
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    className="flex-1 min-h-[160px] rounded-none text-base font-semibold"
                    onPress={onSnoozeOpen}
                  >
                    Snooze All
                  </Button>
                </div>
              )}
              {!inMatchMode && (
                <>
                  {/* 6th slot: Go to Discover CTA card */}
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full min-h-[320px] rounded-lg border-2 border-dashed border-default-300 dark:border-default-600 flex items-center justify-center cursor-pointer transition-[border-color] hover:border-default-500 dark:hover:border-default-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-default-400"
                    onClick={() => router.push("/discover")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push("/discover");
                      }
                    }}
                  >
                    <span className="text-default-400 dark:text-default-500 text-sm font-medium">
                      Go to Discover instead
                    </span>
                  </div>
                </>
              )}
            </div>
            )}
            {!inMatchMode && (
              <div className="flex justify-center mt-6">
                <Tooltip
                  showArrow
                  content="Try a matching game! Hack it and select the best match."
                  placement="top"
                >
                  <Button
                    size="lg"
                    variant="flat"
                    className="bg-sky-200 text-sky-800 hover:bg-sky-300 dark:bg-sky-500/30 dark:text-sky-200 dark:hover:bg-sky-500/50"
                    onPress={startMatch}
                    isLoading={isLoading && pool.length === 0}
                    startContent={<Icon icon="solar:heart-bold" />}
                  >
                    Matcha Matcha, Matcha!
                  </Button>
                </Tooltip>
              </div>
            )}
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}

