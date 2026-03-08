import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Disabled routes: redirect to home
  if (pathname === "/matcha" || pathname === "/search") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect /match (typo) and /Matcha (wrong case) to home (matcha is disabled)
  if (pathname === "/match" || pathname === "/Matcha") {
    return NextResponse.redirect(new URL("/", request.url));
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

