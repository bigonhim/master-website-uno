import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  API_URL,
  SESSION_COOKIE,
  TOKEN_SHAPE,
  cookieOptions,
  isSameOrigin,
  readBody,
} from "@/lib/studio/session";

/**
 * Signing in and out of the Studio.
 *
 * POST passes the account name and password to Django once and keeps the
 * token it returns in the httpOnly cookie; the token is never sent to the
 * browser's scripts. DELETE ends the session in Django and clears the cookie.
 */

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ detail: "Refused: not from the Studio." }, { status: 403 });
  }

  let credentials: { username?: unknown; password?: unknown };
  try {
    const body = await readBody(request, 16 * 1024);
    if (body === null) throw new Error("too large");
    credentials = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return NextResponse.json({ detail: "Invalid request." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/studio/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // So the list of signed-in sessions can tell one device from another.
        "User-Agent": (request.headers.get("user-agent") ?? "").slice(0, 200),
      },
      body: JSON.stringify({
        username: String(credentials.username ?? ""),
        password: String(credentials.password ?? ""),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json(
      { detail: "The Studio's server could not be reached. Try again in a moment." },
      { status: 502 },
    );
  }

  const body = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const detail =
      upstream.status === 429
        ? "Too many attempts for this account. Wait a while, then try again."
        : (body.detail ?? "Those details didn't work.");
    return NextResponse.json({ detail }, { status: upstream.status });
  }

  const response = NextResponse.json({ user: body.user });
  response.cookies.set(SESSION_COOKIE, body.token, cookieOptions(new Date(body.expires_at)));
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ detail: "Refused: not from the Studio." }, { status: 403 });
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token && TOKEN_SHAPE.test(token)) {
    await fetch(`${API_URL}/studio/auth/logout/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  }
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
