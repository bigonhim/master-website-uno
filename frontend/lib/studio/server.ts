import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { API_URL, SESSION_COOKIE } from "./session";
import type { StudioUser } from "./types";

export class StudioApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`Studio API ${status} ${path}`);
    this.name = "StudioApiError";
  }
}

/**
 * Reads from the Studio API while rendering a Studio page.
 *
 * Never cached: an editor must always see what is saved now. A session that
 * has ended sends the editor to sign in again rather than to an error page.
 */
export async function studioGet<T>(path: string): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/studio/login");

  const response = await fetch(`${API_URL}/studio/${path.replace(/^\//, "")}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401) redirect("/studio/login?expired=1");
  if (!response.ok) throw new StudioApiError(response.status, path);
  return (await response.json()) as T;
}

/** The signed-in editor, once per request. */
export const getEditor = cache(() => studioGet<StudioUser>("auth/me/"));
