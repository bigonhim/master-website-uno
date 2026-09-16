import Link from "next/link";

/**
 * Numbered, server-rendered, crawlable pagination.
 *
 * Not infinite scroll: that destroys the footer, breaks the back button, and
 * hides most of an archive from search engines — which for a library is the
 * whole asset.
 */
export function Pagination({
  count,
  limit,
  offset,
  basePath,
  params,
}: {
  count: number;
  limit: number;
  offset: number;
  basePath: string;
  params: Record<string, string>;
}) {
  const pages = Math.ceil(count / limit);
  if (pages <= 1) return null;

  const current = Math.floor(offset / limit) + 1;
  const hrefFor = (page: number) => {
    const next = new URLSearchParams(params);
    if (page <= 1) next.delete("offset");
    else next.set("offset", String((page - 1) * limit));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Window of pages around the current one, always including first and last.
  const window = new Set([1, pages, current, current - 1, current + 1]);
  const visible = [...window].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center gap-2">
      {current > 1 ? (
        <Link
          href={hrefFor(current - 1)}
          rel="prev"
          className="rounded-xs px-3 py-2 text-body-sm text-primary-700 hover:bg-primary-50"
        >
          ← Previous
        </Link>
      ) : null}

      {visible.map((page, index) => (
        <span key={page} className="flex items-center gap-2">
          {index > 0 && page - visible[index - 1] > 1 ? (
            <span className="px-1 text-ink-400">…</span>
          ) : null}
          <Link
            href={hrefFor(page)}
            aria-current={page === current ? "page" : undefined}
            className={`min-w-9 rounded-xs px-3 py-2 text-center text-body-sm tabular-nums transition-colors ${
              page === current
                ? "bg-primary-700 font-semibold text-ink-0"
                : "text-ink-700 hover:bg-ink-50"
            }`}
          >
            {page}
          </Link>
        </span>
      ))}

      {current < pages ? (
        <Link
          href={hrefFor(current + 1)}
          rel="next"
          className="rounded-xs px-3 py-2 text-body-sm text-primary-700 hover:bg-primary-50"
        >
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
