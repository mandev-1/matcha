/**
 * API Client for making authenticated HTTP requests
 * Implements dependency inversion: components depend on this abstraction rather than fetch directly
 */

export interface ApiClient {
  get: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown, options?: RequestInit) => Promise<T>;
  put: <T = unknown>(path: string, body?: unknown, options?: RequestInit) => Promise<T>;
  delete: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
}

import { getApiUrl } from "./apiUrl";

/**
 * Creates an API client with authentication headers
 * Single responsibility: handles HTTP requests with auth token
 */
export function createApiClient(token: string | null): ApiClient {
  const baseHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    baseHeaders["Authorization"] = `Bearer ${token}`;
  }

  const request = async <T = unknown>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // If path already starts with http, use it as-is
    // Otherwise, use getApiUrl to construct the correct URL
    const url = path.startsWith("http") ? path : getApiUrl(path);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text() as unknown as T;
  };

  return {
    get: <T = unknown>(path: string, options?: RequestInit) =>
      request<T>(path, { ...options, method: "GET" }),
    post: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
      request<T>(path, {
        ...options,
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),
    put: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
      request<T>(path, {
        ...options,
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      }),
    delete: <T = unknown>(path: string, options?: RequestInit) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}
