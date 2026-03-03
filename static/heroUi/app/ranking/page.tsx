"use client";

import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Link, Chip } from "@heroui/react";
import { PaginationCompat } from "@/components/PaginationCompat";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getApiUrl } from "@/lib/apiUrl";

// Helper function to get value from object by key
function getKeyValue<T extends Record<string, any>>(item: T, key: string): any {
  return item[key];
}

interface RankingUser {
  rank: number;
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  fame_rating: number;
  level: number;
  is_bot: boolean;
}

interface RankingResponse {
  success: boolean;
  data: {
    users: RankingUser[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

function RankingPageContent() {
  const { token } = useAuth();
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<RankingResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/api/ranking?page=${pageNum}&limit=50`), {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ranking");
      }

      const result: RankingResponse = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const loadingState = isLoading || !data ? "loading" : "idle";

  const columns = [
    { key: "rank", label: "Rank" },
    { key: "name", label: "Name" },
    { key: "level", label: "Level" },
    { key: "fame_rating", label: "Fame Rating" },
    { key: "type", label: "Type" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-default-900 dark:text-default-100">
        User Ranking
      </h1>
      <p className="text-default-600 dark:text-default-400 mb-6">
        Users ranked by their fame rating. Higher fame rating means more active and engaged users.
      </p>
      <div>
      <Table aria-label="User ranking table">
        <Table.Content>
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          ))}
        </TableHeader>
        <TableBody items={data?.data.users ?? []}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <span className="font-semibold">#{item.rank}</span>
              </TableCell>
              <TableCell>
                <Link href={`/discover/${item.id}`} className="text-primary hover:underline">
                  {item.first_name} {item.last_name}
                </Link>
                {item.is_bot && (
                  <Chip size="sm" variant="secondary" color="default" className="ml-2">
                    Bot
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="secondary">
                  Level {item.level}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="font-mono">{item.fame_rating.toFixed(2)}</span>
              </TableCell>
              <TableCell>
                {item.is_bot ? (
                  <Chip size="sm" variant="secondary" color="default">
                    Test User
                  </Chip>
                ) : (
                  <Chip size="sm" variant="secondary">
                    User
                  </Chip>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table.Content>
      </Table>
      {data && data.data.pages > 0 && (
        <div className="flex w-full justify-center mt-4">
          <PaginationCompat
            page={page}
            total={data.data.pages}
            onChange={(p) => setPage(p)}
          />
        </div>
      )}
      {data && (
        <div className="mt-4 text-sm text-default-500">
          Showing {((page - 1) * data.data.limit) + 1} to {Math.min(page * data.data.limit, data.data.total)} of {data.data.total} users
        </div>
      )}
      </div>
    </div>
  );
}

export default function RankingPage() {
  return (
    <ProtectedRoute>
      <RankingPageContent />
    </ProtectedRoute>
  );
}
