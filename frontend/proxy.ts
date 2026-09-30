import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/studio/session";

/**
 * Sends anyone without a Studio session to the sign-in page.
 *
 * Only a first gate, checking that a session cookie exists at all: whether it
 * is still valid is decided by Django on every request, and a Studio page
 * whose session has ended redirects here itself (lib/studio/server.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/studio/login" || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const login = new URL("/studio/login", request.url);
  if (pathname !== "/studio") login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/studio", "/studio/:path*", "/preview/:path*"],
};
