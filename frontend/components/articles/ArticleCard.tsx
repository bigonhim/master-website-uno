import Image from "next/image";
import Link from "next/link";

import { formatArticleDate } from "@/components/articles/ArticleRow";
import { LowerThird } from "@/components/ui/Broadcast";
import type { ArticleSummary } from "@/lib/api/articles";

/**
 * An article in the shape of an archive card, for where the two sit side by
 * side. The articles page itself uses ArticleRow.
 */
export function ArticleCard({ article, image }: { article: ArticleSummary; image?: string }) {
  const href = `/articles/${article.slug}`;

  return (
    <article className="group relative flex flex-1 flex-col overflow-hidden rounded-md border border-ink-200 bg-ink-0 shadow-sm transition-shadow duration-300 ease-emphasis hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-ink-50">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            // Served as the publication serves it; see ArticleRow.
            unoptimized
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.03]"
          />
        ) : null}
      </div>

      <LowerThird
        kind="writing"
        tag={article.category?.name ?? "Article"}
        date={formatArticleDate(article.publishedAt)}
      />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-body font-semibold leading-snug text-primary-900">
          <Link
            href={href}
            title={article.title}
            className="underline-offset-4 outline-none transition-colors after:absolute after:inset-0 group-hover:text-primary-600 focus-visible:underline"
          >
            {article.title}
          </Link>
        </h3>
        {article.summary ? (
          <p className="mt-1.5 line-clamp-2 text-body-sm text-ink-600">{article.summary}</p>
        ) : null}
        <p className="mt-auto pt-3 text-meta text-ink-500">
          {article.readingTimeMinutes} min read
        </p>
      </div>
    </article>
  );
}
