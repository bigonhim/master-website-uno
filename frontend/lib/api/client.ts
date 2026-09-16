import "server-only";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body?: string,
  ) {
    super(`API ${status} ${url}`);
    this.name = "ApiError";
  }
}

type FetchOptions = {
  revalidate?: number | false;
  tags?: string[];
  cache?: RequestCache;
};

/**
 * The single way this app talks to Django.
 *
 * It throws. There is deliberately no fallback to placeholder content: the
 * previous attempt at this project shipped hardcoded demo arrays on every data
 * page, so a dead backend rendered a healthy-looking site and the outage went
 * unnoticed. An outage here surfaces as an error state the visitor can see.
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
    ...(options.cache
      ? { cache: options.cache }
      : { next: { revalidate: options.revalidate ?? 300, tags: options.tags } }),
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      url,
      await response.text().catch(() => undefined),
    );
  }

  return (await response.json()) as T;
}

/** Builds a query string, dropping empty values so URLs stay clean. */
export function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}
