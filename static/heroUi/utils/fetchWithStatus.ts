/**
 * Wrapper around fetch that automatically updates server status context
 * Use this instead of regular fetch to automatically handle server offline detection
 */

export async function fetchWithStatus(
  url: string,
  options?: RequestInit,
  setIsServerOffline?: (offline: boolean) => void
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // If server returns 5xx error, mark as offline
    if (response.status >= 500 && setIsServerOffline) {
      setIsServerOffline(true);
    } else if (response.ok && setIsServerOffline) {
      // If request succeeds, mark as online
      setIsServerOffline(false);
    }
    
    return response;
  } catch (error) {
    // Network error - server is likely offline
    if (setIsServerOffline) {
      setIsServerOffline(true);
    }
    throw error;
  }
}
