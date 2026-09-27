import Link from "next/link";

import { Button } from "@/components/ui/Button";

/**
 * A plain GET form, like the facet links: it works without JavaScript and the
 * query lands in the URL, so a search can be bookmarked or shared. Active
 * filters ride along as hidden inputs; paging does not, because a new search
 * must start from the first page.
 */
export function ArchiveSearch({
  basePath,
  params,
  label,
}: {
  basePath: string;
  params: Record<string, string>;
  label: string;
}) {
  const query = params.q ?? "";
  const kept = Object.entries(params).filter(([key]) => key !== "q" && key !== "offset");

  const clearParams = new URLSearchParams(kept);
  const clearHref = clearParams.size ? `${basePath}?${clearParams}` : basePath;

  return (
    <form action={basePath} method="get" role="search">
      <label htmlFor="archive-search" className="sr-only">
        Search {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-ink-500 stroke-2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            id="archive-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder={`Search ${label}`}
            maxLength={200}
            className="h-11 w-full rounded-sm border border-ink-200 bg-ink-0 pl-10 pr-3 text-body text-ink-900 placeholder:text-ink-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        {kept.map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <Button type="submit">Search</Button>
      </div>
      {query ? (
        <p className="mt-3 text-body-sm text-ink-600">
          Results for <span className="font-semibold text-ink-900">“{query}”</span>
          {" · "}
          <Link href={clearHref} className="text-primary-700 underline underline-offset-4">
            Clear search
          </Link>
        </p>
      ) : null}
    </form>
  );
}
