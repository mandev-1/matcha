"use client";

import React from "react";
import { Card, Button, Chip, Skeleton, Input, Slider, useOverlayState } from "@heroui/react";
import { ModalCompat, ModalHeader, ModalBody, ModalFooter } from "@/components/ModalCompat";
import { SelectCompat } from "@/components/SelectCompat";
import { SelectItem } from "@/components/SelectItem";
import { Image } from "@/components/Image";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/apiUrl";

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

interface PopularTag {
  tag: string;
  user_count: number;
}

export default function SearchPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [popularTags, setPopularTags] = React.useState<PopularTag[]>([]);
  const filterOverlay = useOverlayState({ defaultOpen: false });
  const { isOpen: isFilterOpen, open: onFilterOpen, setOpen: onFilterOpenChange } = filterOverlay;

  // Search form state
  const [tagsInput, setTagsInput] = React.useState("");
  const [locationInput, setLocationInput] = React.useState("");
  const [ageRange, setAgeRange] = React.useState<number[]>([18, 100]);
  const [distanceRange, setDistanceRange] = React.useState<number[]>([0, 5000]);
  const [fameRatingMin, setFameRatingMin] = React.useState(0);
  const [onlyCommonTags, setOnlyCommonTags] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("");

  const loadPopularTags = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl("/api/tags/popular"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.popular_tags) {
          setPopularTags(data.data.popular_tags);
        }
      }
    } catch {
      // ignore
    }
  }, [token]);

  React.useEffect(() => {
    loadPopularTags();
  }, [loadPopularTags]);

  const buildSearchParams = React.useCallback(
    (currentOffset: number) => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("offset", String(currentOffset));
      if (tagsInput.trim()) params.set("tags", tagsInput.trim());
      if (locationInput.trim()) params.set("location", locationInput.trim());
      if (ageRange[0] > 18) params.set("minAge", String(ageRange[0]));
      if (ageRange[1] < 100) params.set("maxAge", String(ageRange[1]));
      if (distanceRange[0] > 0) params.set("minDistance", String(distanceRange[0]));
      if (distanceRange[1] < 5000) params.set("maxDistance", String(distanceRange[1]));
      if (fameRatingMin > 0) params.set("fameRatingMin", String(fameRatingMin));
      if (onlyCommonTags) params.set("onlyCommonTags", "true");
      if (sortBy) params.set("sort", sortBy);
      return params.toString();
    },
    [tagsInput, locationInput, ageRange, distanceRange, fameRatingMin, onlyCommonTags, sortBy]
  );

  const runSearch = React.useCallback(
    async (currentOffset: number = 0) => {
      try {
        setIsLoading(true);
        const headers: HeadersInit = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const query = buildSearchParams(currentOffset);
        const response = await fetch(getApiUrl(`/api/search?${query}`), { headers });

        if (response.ok) {
          const data = await response.json();
          let profilesData: UserProfile[] | null = null;
          if (data.success && data.data) {
            profilesData = data.data.profiles ?? data.data;
          } else if (data.profiles) {
            profilesData = data.profiles;
          } else if (Array.isArray(data)) {
            profilesData = data;
          }

          if (profilesData && Array.isArray(profilesData)) {
            if (currentOffset === 0) {
              setProfiles(profilesData);
            } else {
              setProfiles((prev) => [...prev, ...profilesData!]);
            }
            setHasMore(profilesData.length === 20);
          } else {
            setProfiles([]);
          }
        } else {
          setProfiles([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setProfiles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [token, buildSearchParams]
  );

  const handleSearch = () => {
    setOffset(0);
    runSearch(0);
    onFilterOpenChange(false);
  };

  const loadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    runSearch(newOffset);
  };

  const formatLastSeen = (lastSeen: string): string => {
    if (!lastSeen) return "Never";
    const d = new Date(lastSeen);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const addTagToSearch = (tag: string) => {
    const t = tag.trim().replace(/^#/, "");
    if (!t) return;
    const current = tagsInput ? tagsInput.split(",").map((x) => x.trim()).filter(Boolean) : [];
    if (!current.includes(t)) {
      setTagsInput([...current, t].join(", "));
    }
  };

  return (
    <ProtectedRoute requireAuth={true} requireSetup={true}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-2 md:px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">Search</h1>
          <Button variant="secondary" onPress={onFilterOpen}>
            <Icon icon="solar:filter-linear" className="mr-1" />
            Filters
          </Button>
        </div>

        {/* Search form (inline) */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Tags (e.g. vegan, geek)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="text-sm"
          />
          <Input
            placeholder="Location (city, neighborhood)"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            className="text-sm"
          />
          <Button onPress={handleSearch} isPending={isLoading}>
            Search
          </Button>
        </div>

        {/* Popular tags as chips */}
        {popularTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-default-500">Add tag:</span>
            {popularTags.slice(0, 12).map((pt) => (
              <span
                key={pt.tag}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => addTagToSearch(pt.tag)}
                onKeyDown={(e) => e.key === "Enter" && addTagToSearch(pt.tag)}
              >
                <Chip size="sm" variant="secondary">
                  {pt.tag}
                </Chip>
              </span>
            ))}
          </div>
        )}

        {/* Filter modal */}
        <ModalCompat isOpen={isFilterOpen} onOpenChange={onFilterOpenChange} size="lg">
            <ModalHeader>Advanced filters</ModalHeader>
            <ModalBody className="gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Age range</label>
                <Slider
                  step={1}
                  minValue={18}
                  maxValue={100}
                  value={ageRange}
                  onChange={(v) => setAgeRange(v as number[])}
                  className="max-w-full"
                />
                <p className="text-xs text-default-500 mt-1">
                  {ageRange[0]} – {ageRange[1]} years
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Distance (km)</label>
                <Slider
                  step={50}
                  minValue={0}
                  maxValue={5000}
                  value={distanceRange}
                  onChange={(v) => setDistanceRange(v as number[])}
                  className="max-w-full"
                />
                <p className="text-xs text-default-500 mt-1">
                  {distanceRange[0]} – {distanceRange[1]} km
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Min fame rating</label>
                <Slider
                  step={0.5}
                  minValue={0}
                  maxValue={50}
                  value={fameRatingMin}
                  onChange={(v) => setFameRatingMin(v as number)}
                  className="max-w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <SelectCompat
                  placeholder="Default"
                  selectedKeys={sortBy ? [sortBy] : []}
                  onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string || "")}
                >
                  <SelectItem key="">Default</SelectItem>
                  <SelectItem key="age_asc">Age (ascending)</SelectItem>
                  <SelectItem key="age_desc">Age (descending)</SelectItem>
                  <SelectItem key="location">Distance</SelectItem>
                  <SelectItem key="fame">Fame rating</SelectItem>
                  <SelectItem key="tags">Common tags</SelectItem>
                </SelectCompat>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onlyCommonTags"
                  checked={onlyCommonTags}
                  onChange={(e) => setOnlyCommonTags(e.target.checked)}
                />
                <label htmlFor="onlyCommonTags" className="text-sm">
                  Only show profiles with common tags
                </label>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onPress={() => onFilterOpenChange(false)}>
                Cancel
              </Button>
              <Button onPress={handleSearch} isPending={isLoading}>
                Apply & Search
              </Button>
            </ModalFooter>
        </ModalCompat>

        {/* Results */}
        {isLoading && profiles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="w-full">
                <Skeleton className="rounded-lg h-48 w-full" />
                <Card.Content className="gap-2">
                  <Skeleton className="w-3/5 h-4 rounded-lg" />
                  <Skeleton className="w-4/5 h-3 rounded-lg" />
                </Card.Content>
              </Card>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Icon icon="solar:magnifer-linear" className="text-6xl text-default-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No results</h2>
            <p className="text-default-500 text-center max-w-md">
              Try different tags, location, or filters. Use the Filters button to adjust age, distance, and more.
            </p>
            <Button className="mt-4" onPress={onFilterOpen}>
              Open filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => router.push(`/discover/${profile.id}`)}
                  className="w-full text-left"
                >
                <Card className="w-full">
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
                  </div>
                  <Card.Content className="p-4">
                    <h3 className="font-semibold truncate">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-default-500 flex-wrap">
                      {profile.age > 0 && <span>{profile.age} years</span>}
                      {profile.location && (
                        <span className="flex items-center gap-1 truncate">
                          <Icon icon="solar:map-point-linear" className="text-xs shrink-0" />
                          {profile.location}
                        </span>
                      )}
                      {profile.distance_km !== undefined && profile.distance_km >= 0 && (
                        <span>{profile.distance_km.toFixed(1)} km</span>
                      )}
                    </div>
                    {profile.last_seen && (
                      <p className="text-xs text-default-400">{formatLastSeen(profile.last_seen)}</p>
                    )}
                    {profile.tags && profile.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.tags.slice(0, 3).map((tag) => (
                          <Chip key={tag} size="sm" variant="secondary">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </Card.Content>
                  <Card.Footer className="pt-0">
                    <Button
                      size="sm"
                     
                      variant="secondary"
                      className="w-full"
                      onPress={() => router.push(`/discover/${profile.id}`)}
                    >
                      View profile
                    </Button>
                  </Card.Footer>
                </Card>
                </button>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button variant="secondary" onPress={loadMore} isPending={isLoading}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
