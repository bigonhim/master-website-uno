import Image from "next/image";
import Link from "next/link";

import type { ArticleSummary } from "@/lib/api/articles";

export function formatArticleDate(value: string, month: "short" | "long" = "short") {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * One entry in the articles feed, laid out as the publication lays it out: the
 * picture across the top, then the headline, two lines of summary, and the
 * date and reading time. A feed rather than a grid of cards, because these are
 * read by their headlines, not recognised by their thumbnails.
 */
export function ArticleRow({
  article,
  image,
  priority = false,
}: {
  article: ArticleSummary;
  /** The picture for the feed; see getFeedImage. */
  image?: string;
  priority?: boolean;
}) {
  const href = `/articles/${article.slug}`;

  return (
    <article className="group relative border-b border-ink-100 py-8 first:pt-0 last:border-b-0">
      {image ? (
        <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-md bg-ink-50">
          <Image
            src={image}
            alt=""
            fill
            priority={priority}
            // Served as the publication serves it, already WebP at feed size.
            // Going through the optimiser would have this server fetch from
            // another host on every miss, to save little.
            unoptimized
            sizes="(min-width: 1024px) 44rem, 100vw"
            className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      {article.category ? (
        <p className="mb-2 text-eyebrow uppercase text-cyan-700">{article.category.name}</p>
      ) : null}

      <h3 className="text-pretty text-h3 text-primary-900">
        {/* The link covers the whole entry, picture included. */}
        <Link
          href={href}
          className="underline-offset-4 outline-none transition-colors after:absolute after:inset-0 group-hover:text-primary-600 focus-visible:underline"
        >
          {article.title}
        </Link>
      </h3>

      {article.summary ? (
        <p className="mt-2.5 line-clamp-2 text-body text-ink-700">{article.summary}</p>
      ) : null}

      <p className="mt-3 text-meta uppercase tabular-nums text-ink-500">
        <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
        <span aria-hidden className="mx-1.5">
          ·
        </span>
        {article.readingTimeMinutes} min read
      </p>
    </article>
  );
}
