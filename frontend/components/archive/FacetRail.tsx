import Link from "next/link";

import type { Facet } from "@/lib/api/types";

/**
 * Facets as server-rendered links: crawlable, shareable, and working without
 * JavaScript. Counts are always visible, and a zero-count option renders
 * disabled rather than vanishing — options that disappear mid-refinement
 * disorient people far more than a greyed-out one.
 */
function FacetGroup({
  title,
  param,
  facets,
  active,
  basePath,
  params,
}: {
  title: string;
  param: string;
  facets: Facet[];
  active?: string;
  basePath: string;
  params: Record<string, string>;
}) {
  if (facets.length === 0) return null;

  const hrefFor = (value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === active) next.delete(param);
    else next.set(param, value);
    next.delete("offset"); // any filter change resets paging
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="border-t border-ink-100 py-5 first:border-t-0 first:pt-0">
      <h3 className="text-eyebrow uppercase text-ink-500">{title}</h3>
      <ul className="mt-3 space-y-1">
        {facets.map((facet) => {
          const selected = facet.value === active;
          return (
            <li key={facet.value}>
              <Link
                href={hrefFor(facet.value)}
                aria-current={selected ? "true" : undefined}
                className={`flex items-baseline justify-between gap-3 rounded-xs px-2 py-1.5 text-body-sm transition-colors ${
                  selected
                    ? "bg-primary-50 font-semibold text-primary-700"
                    : "text-ink-700 hover:bg-ink-50"
                }`}
              >
                <span>{facet.label}</span>
                <span className="tabular-nums text-caption text-ink-500">{facet.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FacetRail({
  facets,
  basePath,
  params,
}: {
  facets: Record<string, Facet[]>;
  basePath: string;
  params: Record<string, string>;
}) {
  const groups: { title: string; param: string; key: string }[] = [
    { title: "Theme", param: "category", key: "category" },
    { title: "Nation", param: "region", key: "region" },
    { title: "Series", param: "series", key: "series" },
  ];

  // The rail stays in place even before anything is catalogued, so every
  // archive has the same shape; it says why it is empty rather than vanishing.
  const hasAny = groups.some((g) => (facets[g.key] ?? []).length > 0);
  if (!hasAny) {
    return (
      <aside aria-label="Filter the archive" className="lg:sticky lg:top-40">
        <h2 className="text-h4 text-ink-900">Filter</h2>
        <div className="mt-4 space-y-4">
          {groups.slice(0, 2).map((group) => (
            <div
              key={group.key}
              className="border-t border-ink-100 pt-4 first:border-t-0 first:pt-0"
            >
              <h3 className="text-eyebrow uppercase text-ink-500">{group.title}</h3>
            </div>
          ))}
          <p className="text-body-sm text-ink-500">
            Themes and nations appear here as entries are catalogued.
          </p>
        </div>
      </aside>
    );
  }

  const activeCount = groups.filter((g) => params[g.param]).length;

  return (
    <aside aria-label="Filter the archive" className="lg:sticky lg:top-40">
      <div className="flex items-baseline justify-between">
        <h2 className="text-h4 text-ink-900">Filter</h2>
        {activeCount > 0 ? (
          <Link
            href={basePath}
            className="text-body-sm text-primary-700 underline underline-offset-4"
          >
            Clear
          </Link>
        ) : null}
      </div>
      <div className="mt-4">
        {groups.map((group) => (
          <FacetGroup
            key={group.key}
            title={group.title}
            param={group.param}
            facets={facets[group.key] ?? []}
            active={params[group.param]}
            basePath={basePath}
            params={params}
          />
        ))}
      </div>
    </aside>
  );
}
