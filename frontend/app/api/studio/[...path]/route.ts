import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import {
  API_URL,
  MAX_BODY,
  MAX_UPLOAD_BODY,
  REVALIDATE_TAGS,
  SESSION_COOKIE,
  TOKEN_SHAPE,
  isSameOrigin,
  readBody,
} from "@/lib/studio/session";

/**
 * Every request the Studio's pages make to the API passes through here.
 *
 * - The editor's token stays in its httpOnly cookie; it is added here, on the
 *   server, and the browser never holds it.
 * - Only the Studio's own API can be reached: each path segment must be a
 *   plain word, so "..", encoded slashes and the like cannot step outside it.
 *   Signing in and out go through ./session instead; auth/ is not relayed, so
 *   a token is never handed to a page.
 * - A body is read only after the session cookie has the shape of a real
 *   token, and never beyond a size limit (a photo's, for uploads), so no one
 *   can make this server hold an unbounded request in memory.
 * - A request that changes anything must come from this site's own pages
 *   (its Origin is checked), on top of the cookie's SameSite protection.
 * - When Django reports which of the site's cache tags a change touched, they
 *   are expired here, so the public page shows the edit on its next view.
 */

type Context = { params: Promise<{ path: string[] }> };

const SEGMENT = /^[A-Za-z0-9_-]+$/;
const FORWARDED_HEADERS = ["content-type", "if-match", "accept"];

async function relay(request: NextRequest, { params }: Context) {
  const { path } = await params;
  if (!path.length || path[0] === "auth" || !path.every((segment) => SEGMENT.test(segment))) {
    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  }

  const method = request.method;
  if (method !== "GET" && method !== "HEAD" && !isSameOrigin(request)) {
    return NextResponse.json({ detail: "Refused: not from the Studio." }, { status: 403 });
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !TOKEN_SHAPE.test(token)) {
    return NextResponse.json({ detail: "Sign in to the Studio." }, { status: 401 });
  }

  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const isUpload = method === "POST" && path.length === 1 && path[0] === "media";
    const read = await readBody(request, isUpload ? MAX_UPLOAD_BODY : MAX_BODY);
    if (read === null) {
      return NextResponse.json(
        { detail: isUpload ? "That file is larger than 25 MB." : "That request is too large." },
        { status: 413 },
      );
    }
    body = read;
  }

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/studio/${path.join("/")}/${request.nextUrl.search}`, {
      method,
      headers,
      body,
      cache: "no-store",
      // Generous: a large photo is re-encoded before Django answers.
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return NextResponse.json(
      { detail: "The Studio's server could not be reached. Try again in a moment." },
      { status: 502 },
    );
  }

  const tags = upstream.headers.get("x-studio-revalidate");
  if (upstream.ok && tags) {
    for (const tag of tags.split(",")) {
      // The editor wants to see the change now, not after a stale view.
      if (REVALIDATE_TAGS.has(tag)) revalidateTag(tag, { expire: 0 });
    }
  }

  const answer = upstream.status === 204 ? null : await upstream.arrayBuffer();
  const response = new NextResponse(answer, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
  if (upstream.status === 401) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export {
  relay as GET,
  relay as POST,
  relay as PUT,
  relay as PATCH,
  relay as DELETE,
};
