import Link from "next/link";

import type { ArticleTopic } from "@/lib/api/articles";

/**
 * The publication's topics, with their counts. Server-rendered links like the
 * archive's facets, so a topic can be bookmarked and works without JavaScript.
 */
export function TopicRail({
  topics,
  total,
  active,
  params,
}: {
  topics: ArticleTopic[];
  /** Every published article, for the "All articles" row. */
  total: number;
  active?: string;
  params: Record<string, string>;
}) {
  const hrefFor = (slug: string | null) => {
    const next = new URLSearchParams(params);
    if (slug === null) next.delete("topic");
    else next.set("topic", slug);
    next.delete("offset"); // a new topic starts from the first page
    const qs = next.toString();
    return qs ? `/articles?${qs}` : "/articles";
  };

  const rows = [
    { slug: null as string | null, name: "All articles", count: total },
    ...topics.map((topic) => ({
      slug: topic.slug as string | null,
      name: topic.name,
      count: topic.articleCount,
    })),
  ];

  return (
    <aside aria-label="Topics" className="lg:sticky lg:top-40">
      <h2 className="text-eyebrow uppercase text-ink-500">Topics</h2>
      <ul className="mt-3 space-y-1">
        {rows.map((row) => {
          const selected = row.slug === (active ?? null);
          return (
            <li key={row.slug ?? "all"}>
              <Link
                href={hrefFor(row.slug)}
                aria-current={selected ? "true" : undefined}
                className={`flex items-baseline justify-between gap-3 rounded-xs px-2 py-1.5 text-body-sm transition-colors ${
                  selected
                    ? "bg-primary-50 font-semibold text-primary-700"
                    : "text-ink-700 hover:bg-ink-50"
                }`}
              >
                <span>{row.name}</span>
                <span className="text-caption tabular-nums text-ink-500">{row.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
