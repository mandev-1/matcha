import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/authCookie";

/** Path prefixes that require authentication. Unauthenticated requests get 403. */
const PROTECTED_PREFIXES: string[] = [
  "/profile",
  "/discover",
  "/chats",
  "/chat",
  "/runway",
  "/ranking",
  "/search",
  "/bot-activity",
  "/tags-streamline",
  "/matcha",
];

/** Path prefixes that are valid app routes. Others get 401 (page does not exist). */
const KNOWN_PREFIXES: string[] = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/sign-up",
  "/trends",
  "/help",
  ...PROTECTED_PREFIXES,
];

function hasAuthCookie(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return !!token?.trim();
}

function pathNormalized(pathname: string): string {
  return pathname.toLowerCase().replace(/\/$/, "") || "/";
}

function isProtectedPath(pathname: string): boolean {
  const normalized = pathNormalized(pathname);
  if (normalized === "/") return false;
  return PROTECTED_PREFIXES.some((p) => normalized === p || normalized.startsWith(p + "/"));
}

function isKnownPath(pathname: string): boolean {
  const normalized = pathNormalized(pathname);
  if (normalized === "/") return true;
  return KNOWN_PREFIXES.some((p) => normalized === p || normalized.startsWith(p + "/"));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const normalized = pathNormalized(pathname);

  // Legacy routes: redirect to discover
  if (normalized === "/matcha" || normalized === "/search") {
    return NextResponse.redirect(new URL("/discover", request.url));
  }
  if (normalized === "/match") {
    return NextResponse.redirect(new URL("/discover", request.url));
  }

  // Protected routes: require auth cookie → 403 if missing
  if (isProtectedPath(pathname)) {
    if (!hasAuthCookie(request)) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", message: "Authentication required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return NextResponse.next();
  }

  // Unknown routes → 401 (page does not exist)
  if (!isKnownPath(pathname)) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized", message: "Page not found" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
