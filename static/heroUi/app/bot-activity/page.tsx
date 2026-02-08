"use client";

import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { Link } from "@heroui/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Helper function to get value from object by key
function getKeyValue<T extends Record<string, any>>(item: T, key: string): any {
  return item[key];
}

interface BotActivity {
  id: number;
  bot_id: number;
  bot_username: string;
  bot_display_name?: string;
  action_type: string;
  target_user_id?: number;
  target_username?: string;
  target_display_name?: string;
  details?: string;
  created_at: string;
}

interface BotActivityResponse {
  success: boolean;
  data: {
    activities: BotActivity[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

function BotActivityPageContent() {
  const { token } = useAuth();
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<BotActivityResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/bot-activity?page=${pageNum}&limit=20`, {
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bot activity");
      }

      const result: BotActivityResponse = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching bot activity:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const loadingState = isLoading || !data ? "loading" : "idle";

  const formatActionType = (actionType: string) => {
    // Map action types to readable names
    const actionMap: Record<string, string> = {
      "view_profile": "View",
      "like_profile": "Like",
      "browse_profiles": "Browse",
      "add_tag": "Add Tag",
      "remove_tag": "Remove Tag",
      "send_message": "Message",
      "stay_online": "Stay Online",
      "visit_profile": "Visit",
      "like_profile_failed": "Like (Failed)",
      "view_profile_failed": "View (Failed)",
      "add_tag_failed": "Add Tag (Failed)",
      "send_message_failed": "Message (Failed)",
      "change_tags_failed": "Change Tags (Failed)",
    };
    
    return actionMap[actionType] || actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDateTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleString();
    } catch {
      return dateTime;
    }
  };

  const columns = [
    { key: "bot_display_name", label: "Test User" },
    { key: "action_type", label: "Action" },
    { key: "target_display_name", label: "Target" },
    { key: "details", label: "Details" },
    { key: "created_at", label: "Time" },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-default-900 dark:text-default-100">
        Test User Activity Log
      </h1>
      <Table
        aria-label="Bot activity log table"
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
          items={data?.data.activities ?? []}
          loadingContent={<Spinner />}
          loadingState={loadingState}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => {
                const value = getKeyValue(item, columnKey);
                if (columnKey === "bot_display_name") {
                  const displayName = item.bot_display_name || item.bot_username;
                  return (
                    <TableCell>
                      <Link
                        href={`/discover/${item.bot_id}`}
                        className="text-primary hover:underline"
                      >
                        {displayName}
                      </Link>
                    </TableCell>
                  );
                }
                if (columnKey === "action_type") {
                  return <TableCell>{formatActionType(value as string)}</TableCell>;
                }
                if (columnKey === "target_display_name") {
                  const targetDisplayName = item.target_display_name || item.target_username;
                  if (item.target_user_id && targetDisplayName) {
                    return (
                      <TableCell>
                        <Link
                          href={`/discover/${item.target_user_id}`}
                          className="text-primary hover:underline"
                        >
                          {targetDisplayName}
                        </Link>
                      </TableCell>
                    );
                  }
                  return <TableCell>-</TableCell>;
                }
                if (columnKey === "created_at") {
                  return <TableCell>{formatDateTime(value as string)}</TableCell>;
                }
                if (columnKey === "details") {
                  return <TableCell>{value || "-"}</TableCell>;
                }
                return <TableCell>{value}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {data && (
        <div className="mt-4 text-sm text-default-500">
          Showing {((page - 1) * data.data.limit) + 1} to {Math.min(page * data.data.limit, data.data.total)} of {data.data.total} activities
        </div>
      )}
    </div>
  );
}

export default function BotActivityPage() {
  return (
    <ProtectedRoute>
      <BotActivityPageContent />
    </ProtectedRoute>
  );
}
