import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Legacy routes: redirect to discover (default logged-in page)
  if (pathname === "/matcha" || pathname === "/search") {
    return NextResponse.redirect(new URL("/discover", request.url));
  }

  // Redirect /match (typo) and /Matcha (wrong case) to discover
  if (pathname === "/match" || pathname === "/Matcha") {
    return NextResponse.redirect(new URL("/discover", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

