/**
 * Utility to get the correct API base URL
 * In Docker/production: uses NEXT_PUBLIC_API_URL (http://localhost:8080)
 * In development: returns empty string (relative paths, Next.js rewrites handle proxying)
 */
export function getApiBaseUrl(): string {
  // Check for explicit API URL environment variable (set in Docker)
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // In development, use relative paths (Next.js rewrites proxy to backend)
  return "";
}

/**
 * Constructs a full API URL from a path
 * @param path - API path (e.g., "/api/browse" or "api/browse")
 * @returns Full URL or relative path depending on environment
 */
export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

/**
 * Constructs a full URL for uploads/images
 * @param path - Upload path (e.g., "/uploads/123/image.jpg" or "uploads/123/image.jpg")
 * @returns Full URL or relative path depending on environment
 */
export function getUploadUrl(path: string): string {
  // If path is empty, invalid, or already a full URL, return as-is
  if (!path || path === "-" || path.startsWith("http")) {
    return path;
  }
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
