"use client";

import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Link } from "@heroui/link";
import { Chip } from "@heroui/chip";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

      const response = await fetch(`/api/ranking?page=${pageNum}&limit=50`, {
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
      <Table
        aria-label="User ranking table"
        bottomContent={
          data && data.data.pages > 0 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={data.data.pages}
                onChange={(page) => setPage(page)}
              />
            </div>
          ) : null
        }
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          ))}
        </TableHeader>
        <TableBody
          items={data?.data.users ?? []}
          loadingContent={<Spinner />}
          loadingState={loadingState}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => {
                if (columnKey === "rank") {
                  return (
                    <TableCell>
                      <span className="font-semibold">#{item.rank}</span>
                    </TableCell>
                  );
                }
                if (columnKey === "name") {
                  return (
                    <TableCell>
                      <Link
                        href={`/discover/${item.id}`}
                        className="text-primary hover:underline"
                      >
                        {item.first_name} {item.last_name}
                      </Link>
                      {item.is_bot && (
                        <Chip size="sm" variant="flat" color="secondary" className="ml-2">
                          Bot
                        </Chip>
                      )}
                    </TableCell>
                  );
                }
                if (columnKey === "level") {
                  return (
                    <TableCell>
                      <Chip size="sm" variant="flat" color="primary">
                        Level {item.level}
                      </Chip>
                    </TableCell>
                  );
                }
                if (columnKey === "fame_rating") {
                  return (
                    <TableCell>
                      <span className="font-mono">{item.fame_rating.toFixed(2)}</span>
                    </TableCell>
                  );
                }
                if (columnKey === "type") {
                  return (
                    <TableCell>
                      {item.is_bot ? (
                        <Chip size="sm" variant="flat" color="secondary">
                          Test User
                        </Chip>
                      ) : (
                        <Chip size="sm" variant="flat" color="default">
                          User
                        </Chip>
                      )}
                    </TableCell>
                  );
                }
                return <TableCell>{getKeyValue(item, String(columnKey))}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {data && (
        <div className="mt-4 text-sm text-default-500">
          Showing {((page - 1) * data.data.limit) + 1} to {Math.min(page * data.data.limit, data.data.total)} of {data.data.total} users
        </div>
      )}
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
