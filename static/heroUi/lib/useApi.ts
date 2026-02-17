/**
 * React hook that provides an API client using the current auth token
 * Dependency inversion: components use this hook instead of directly accessing auth context
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createApiClient, type ApiClient } from "./apiClient";

export function useApi(): ApiClient {
  const { token } = useAuth();
  return useMemo(() => createApiClient(token), [token]);
}
