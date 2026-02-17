"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { addToast } from "@heroui/toast";
import { getApiUrl } from "@/lib/apiUrl";

export default function TagsStreamlinePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [tags, setTags] = React.useState<string[]>([]);
  const [popularTags, setPopularTags] = React.useState<Array<{ tag: string; user_count: number }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRemoving, setIsRemoving] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load user's tags
        const profileResponse = await fetch(getApiUrl("/api/profile"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.data && profileData.data.tags) {
            setTags(profileData.data.tags || []);
          }
        }

        // Load popular tags
        const popularResponse = await fetch(getApiUrl("/api/tags/popular"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (popularResponse.ok) {
          const popularData = await popularResponse.json();
          if (popularData.success && popularData.data) {
            setPopularTags(popularData.data.popular_tags || []);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleRemoveTag = async (tag: string) => {
    if (!token) return;

    setIsRemoving(tag);
    try {
      const response = await fetch(getApiUrl("/api/tags/remove"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTags(tags.filter(t => t !== tag));
          addToast({
            title: "Tag Removed",
            description: `Removed ${tag} from your profile`,
            color: "success",
          });
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
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!token) return;

    if (tags.length >= 5) {
      addToast({
        title: "Maximum tags reached",
        description: "You can only have up to 5 tags. Remove a tag first.",
        color: "warning",
      });
      return;
    }

    setIsAdding(tag);
    try {
      const response = await fetch(getApiUrl("/api/tags/add"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTags([...tags, tag]);
          addToast({
            title: "Tag Added",
            description: `Added ${tag} to your profile`,
            color: "success",
          });
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
      setIsAdding(null);
    }
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

  return (
    <ProtectedRoute requireAuth={true} requireSetup={true}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 md:px-4 py-8">
        <div className="flex items-center justify-between">
          <Button
            variant="flat"
            size="sm"
            onPress={() => router.back()}
            startContent={<Icon icon="solar:arrow-left-linear" />}
          >
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">Streamline Your Tags</h1>
          </CardHeader>
          <CardBody className="flex flex-col gap-6">
            {/* Current Tags */}
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Your Current Tags ({tags.length}/5)</h2>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      onClose={() => handleRemoveTag(tag)}
                      variant="flat"
                      color="primary"
                      isCloseable={!isRemoving}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : (
                <p className="text-default-500">You don't have any tags yet.</p>
              )}
            </div>

            {/* Popular Tags */}
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Popular Tags</h2>
              {popularTags.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {popularTags.map((popularTag) => {
                    // Normalize tags for comparison (remove # and compare case-insensitive)
                    const normalizeTag = (tag: string) => tag.replace(/^#/, "").toLowerCase().trim();
                    const isUserTag = tags.some(t => normalizeTag(t) === normalizeTag(popularTag.tag));
                    const canAdd = tags.length < 5 && !isUserTag;

                    return (
                      <div
                        key={popularTag.tag}
                        className="flex items-center justify-between p-3 rounded-lg border border-default-200 hover:bg-default-50 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{popularTag.tag}</span>
                          <span className="text-xs text-default-500">
                            {popularTag.user_count} {popularTag.user_count === 1 ? "person" : "people"} have this tag
                          </span>
                        </div>
                        {isUserTag ? (
                          <Chip size="sm" variant="flat" color="success">
                            Added
                          </Chip>
                        ) : (
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => handleAddTag(popularTag.tag)}
                            isDisabled={!canAdd || isAdding === popularTag.tag}
                            isLoading={isAdding === popularTag.tag}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-default-500">No popular tags available.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
