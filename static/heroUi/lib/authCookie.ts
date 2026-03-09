/**
 * Auth cookie name used by middleware and client for route protection.
 * Middleware reads this to enforce 403 on protected routes when unauthenticated.
 */
export const AUTH_COOKIE_NAME = "auth_token";

const MAX_AGE_DAYS = 7;

/** Set auth cookie (client-side). Call on login. */
export function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(token);
  const maxAge = 60 * 60 * 24 * MAX_AGE_DAYS;
  document.cookie = `${AUTH_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Clear auth cookie (client-side). Call on logout. */
export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
}
