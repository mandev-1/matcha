"use client";

import React from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Link } from "@heroui/react";
import { PaginationCompat } from "@/components/PaginationCompat";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getApiUrl } from "@/lib/apiUrl";
import NextLink from "next/link";

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
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/api/bot-activity?page=${pageNum}&limit=20`), {
        headers,
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(response.status === 401 ? "Please log in to view the activity log." : errBody || "Failed to fetch bot activity");
      }

      const result: BotActivityResponse = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Invalid response from server");
      }
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load activity log";
      setError(message);
      console.error("Error fetching bot activity:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

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
      "unlike_profile": "Unlike",
      "unlike_failed": "Unlike (Failed)",
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
      <p className="text-default-500 dark:text-default-400 mb-6">
        Activity from simulated test users (bots). To see entries here, generate test users and run the bot simulator.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-danger/10 text-danger flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchData(page)}
            className="px-3 py-1.5 rounded-medium bg-danger/20 hover:bg-danger/30 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && !error && data && data.data.total === 0 && (
        <div className="rounded-lg border border-default-200 bg-default-50 dark:bg-default-100/5 p-8 text-center">
          <p className="text-default-600 dark:text-default-400 mb-4">
            No test user activity yet.
          </p>
          <p className="text-sm text-default-500 dark:text-default-400 max-w-md mx-auto mb-6">
            Generate test users with <code className="px-1.5 py-0.5 rounded bg-default-200 dark:bg-default-100/20 font-mono text-sm">make 500</code>, then run the bot simulator with <code className="px-1.5 py-0.5 rounded bg-default-200 dark:bg-default-100/20 font-mono text-sm">make bot-simulator</code>. Activity will appear here as bots browse, like, and message.
          </p>
          <NextLink
            href="/help/golang-simulation"
            className="text-primary hover:underline text-sm font-medium"
          >
            View setup guide →
          </NextLink>
        </div>
      )}

      {!isLoading && !error && data && data.data.total > 0 && (
        <div>
          <Table aria-label="Bot activity log table">
            <Table.Content>
              <TableHeader>
                {columns.map((column, index) => (
                  <TableColumn key={column.key} isRowHeader={index === 0}>
                    {column.label}
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody items={data.data.activities}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/discover/${item.bot_id}`}
                        className="text-primary hover:underline"
                      >
                        {item.bot_display_name || item.bot_username}
                      </Link>
                    </TableCell>
                    <TableCell>{formatActionType(item.action_type)}</TableCell>
                    <TableCell>
                      {item.target_user_id && (item.target_display_name || item.target_username) ? (
                        <Link
                          href={`/discover/${item.target_user_id}`}
                          className="text-primary hover:underline"
                        >
                          {item.target_display_name || item.target_username}
                        </Link>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{item.details ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(item.created_at)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table.Content>
          </Table>
          {data.data.pages > 0 && (
            <div className="flex w-full justify-center mt-4">
              <PaginationCompat
                page={page}
                total={data.data.pages}
                onChange={(p) => setPage(p)}
              />
            </div>
          )}
          <div className="mt-4 text-sm text-default-500">
            Showing {((page - 1) * data.data.limit) + 1} to {Math.min(page * data.data.limit, data.data.total)} of {data.data.total} activities
          </div>
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
