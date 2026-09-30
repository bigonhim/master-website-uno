import type { HeadingAnchor } from "@/lib/articles/html";

function Chapters({ headings }: { headings: HeadingAnchor[] }) {
  return (
    <ol>
      {headings.map((heading, index) => (
        <li key={heading.id} className="border-b border-ink-100 last:border-b-0">
          <a
            href={`#${heading.id}`}
            className="group flex items-baseline gap-3 py-2.5 text-body-sm text-ink-700 transition-colors hover:text-primary-700"
          >
            <span className="text-caption tabular-nums text-cyan-700">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="underline-offset-4 group-hover:underline">{heading.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * The chapters of an article, numbered as the publication numbers them. Beside
 * the text on wide screens; folded away above it on narrow ones, where a list
 * of twelve headings would otherwise stand between the reader and the article.
 */
export function ArticleContents({ headings }: { headings: HeadingAnchor[] }) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label="In this article">
      <details className="rounded-md border border-ink-200 bg-ink-0 px-4 lg:hidden">
        <summary className="cursor-pointer py-3 text-eyebrow uppercase text-ink-600">
          In this article · {headings.length}
        </summary>
        <Chapters headings={headings} />
      </details>

      <div className="hidden lg:block">
        <h2 className="text-eyebrow uppercase text-ink-500">In this article</h2>
        <div className="mt-3">
          <Chapters headings={headings} />
        </div>
      </div>
    </nav>
  );
}
