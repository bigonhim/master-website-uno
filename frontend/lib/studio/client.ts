/**
 * How the Studio's pages talk to the API from the browser: always through
 * this site's /api/studio relay, which holds the session (see
 * app/api/studio/[...path]/route.ts).
 */

export class StudioError extends Error {
  constructor(
    readonly status: number,
    readonly data: Record<string, unknown>,
  ) {
    super(describe(status, data));
    this.name = "StudioError";
  }

  /** Field errors as { field: "message" }, for showing beside each input. */
  get fieldErrors(): Record<string, string> {
    const source = (this.data.errors as Record<string, unknown>) ?? this.data;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(source)) {
      if (key === "detail" || key === "current") continue;
      const message = Array.isArray(value) ? value[0] : value;
      if (typeof message === "string") out[key] = message;
    }
    return out;
  }
}

function describe(status: number, data: Record<string, unknown>): string {
  if (typeof data.detail === "string") return data.detail;
  if (status === 400) return "Some fields need attention.";
  if (status === 403) return "Your account isn't allowed to do that.";
  if (status === 404) return "It isn't there any more.";
  if (status >= 500) return "Something went wrong on the server. Try again in a moment.";
  return `Something went wrong (${status}).`;
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** The version being edited; a newer save on the server makes this a 409. */
  version?: string;
};

export async function studio<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const { method = options.body !== undefined ? "POST" : "GET", body, version } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (version) headers["If-Match"] = version;

  const response = await fetch(`/api/studio/${path.replace(/^\/|\/$/g, "")}`, {
    method,
    headers,
    body: payload,
    cache: "no-store",
  });

  if (response.status === 401) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(new URL(`/studio/login?expired=1&next=${next}`, window.location.origin));
    throw new StudioError(401, { detail: "Your session has ended. Sign in again." });
  }
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new StudioError(response.status, data);
  return data as T;
}

/** Query string from an object, dropping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      search.set(key, value === true ? "1" : String(value));
    }
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

export function can(user: { is_superuser: boolean; permissions: string[] }, perm: string) {
  return user.is_superuser || user.permissions.includes(perm);
}
