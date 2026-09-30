/**
 * The Studio's sign-in cookie.
 *
 * It holds the editor's token and is httpOnly, so no script on any page can
 * read it; SameSite=Lax, so another site cannot make the browser send it with
 * a form post. The browser never sends the token to Django itself: every
 * Studio request goes through this site's server (app/api/studio), which reads
 * the cookie and passes the token on.
 */
export const SESSION_COOKIE = "studio_session";

export const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

/** The shape of a token Django issues (secrets.token_urlsafe(32)). Anything
 *  else in the cookie is refused before a request is even read. */
export const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/;

/** Photos are refused above 25 MB; this leaves room for the form around one. */
export const MAX_UPLOAD_BODY = 26 * 1024 * 1024;
/** Every other Studio request is a form of text. */
export const MAX_BODY = 1024 * 1024;

/**
 * The request's body, read up to `limit` bytes; null if it is larger. The
 * declared length is checked first, and the stream is cut off at the limit
 * whatever was declared, so an oversized body is never held in memory.
 */
export async function readBody(request: Request, limit: number): Promise<ArrayBuffer | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(declared) || declared > limit) return null;
  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

export function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

/** The site's cache tags a Studio save may refresh (see lib/api/*). */
export const REVALIDATE_TAGS = new Set(["site", "teachings", "prophecies", "healings", "writings"]);

/**
 * True when a request that changes something came from this site's own pages.
 *
 * The browser's Origin is compared with the host the request was addressed
 * to (X-Forwarded-Host behind a proxy), as Next.js does for server actions.
 * The URL the server sees for itself is no use here: behind a proxy it is the
 * internal address, not the one the browser used.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
