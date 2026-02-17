"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Skeleton } from "@heroui/skeleton";
import { Icon } from "@iconify/react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getApiUrl } from "@/lib/apiUrl";

interface PopularTag {
  tag: string;
  user_count: number;
}

interface PersonalityType {
  type: string;
  count: number;
}

interface GenderCount {
  gender: string;
  count: number;
}

interface OrientationCount {
  orientation: string;
  count: number;
}

interface TrendsData {
  popular_tags: PopularTag[];
  personality_types: PersonalityType[];
  gender_counts: GenderCount[];
  orientation_counts: OrientationCount[];
}

function labelOrientation(value: string): string {
  const v = (value || "").toLowerCase();
  if (v === "male" || v === "men") return "Straight (interested in women)";
  if (v === "female" || v === "women") return "Straight (interested in men)";
  if (v === "both") return "Bisexual / Both";
  if (v === "gay" || v === "same") return "Gay / Same gender";
  return value || "Other";
}

function labelGender(value: string): string {
  const v = (value || "").toLowerCase();
  if (v === "male") return "Male";
  if (v === "female") return "Female";
  return value || "Other";
}

function TrendsContent() {
  const [data, setData] = React.useState<TrendsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(getApiUrl("/api/trends"))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load trends");
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json?.success || !json?.data) return;
        setData({
          popular_tags: json.data.popular_tags ?? [],
          personality_types: json.data.personality_types ?? [],
          gender_counts: json.data.gender_counts ?? [],
          orientation_counts: json.data.orientation_counts ?? [],
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load trends");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-32 rounded" />
            </CardHeader>
            <CardBody className="gap-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-3/5 rounded" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-danger/50 bg-danger/5">
        <CardBody>
          <p className="text-danger">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-default-900 dark:text-default-100 flex items-center gap-2">
          <Icon icon="solar:compass-bold" className="text-primary" />
          Trends
        </h1>
        <p className="text-default-500 mt-1">
          What’s popular: tags, personality types, gender and orientation across the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most popular tags */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center gap-2">
            <Icon icon="solar:tag-bold" className="text-primary text-xl" />
            <span className="font-semibold text-lg">Most popular tags</span>
          </CardHeader>
          <CardBody className="pt-0">
            {data.popular_tags.length === 0 ? (
              <p className="text-default-400 text-sm">No tag data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.popular_tags.map((t, i) => (
                  <li
                    key={`${t.tag}-${i}`}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="font-medium text-foreground">{t.tag}</span>
                    <span className="text-default-500">{t.user_count} people</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Personality types (MBTI) */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center gap-2">
            <Icon icon="solar:users-group-two-rounded-bold" className="text-primary text-xl" />
            <span className="font-semibold text-lg">Personality types (MBTI)</span>
          </CardHeader>
          <CardBody className="pt-0">
            {data.personality_types.length === 0 ? (
              <p className="text-default-400 text-sm">No personality data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.personality_types.map((p, i) => (
                  <li
                    key={`${p.type}-${i}`}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="font-medium text-foreground">{p.type}</span>
                    <span className="text-default-500">{p.count} people</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Gender */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center gap-2">
            <Icon icon="solar:user-bold" className="text-primary text-xl" />
            <span className="font-semibold text-lg">Gender</span>
          </CardHeader>
          <CardBody className="pt-0">
            {data.gender_counts.length === 0 ? (
              <p className="text-default-400 text-sm">No gender data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.gender_counts.map((g, i) => (
                  <li
                    key={`${g.gender}-${i}`}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {labelGender(g.gender)}
                    </span>
                    <span className="text-default-500">{g.count} people</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Orientation (straight, gay, both) */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center gap-2">
            <Icon icon="solar:heart-bold" className="text-primary text-xl" />
            <span className="font-semibold text-lg">Orientation</span>
          </CardHeader>
          <CardBody className="pt-0">
            {data.orientation_counts.length === 0 ? (
              <p className="text-default-400 text-sm">No orientation data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.orientation_counts.map((o, i) => (
                  <li
                    key={`${o.orientation}-${i}`}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {labelOrientation(o.orientation)}
                    </span>
                    <span className="text-default-500">{o.count} people</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <TrendsContent />
      </div>
    </ProtectedRoute>
  );
}
