import { Prose } from "@/components/ui/Prose";
import { prepareArticleHtml, type HeadingAnchor } from "@/lib/articles/html";

/**
 * The body of an article.
 *
 * The HTML is written elsewhere, so it is cleaned against an allowlist before
 * it is rendered (lib/articles/html.ts); nothing here trusts it. The classes
 * below dress what the articles actually contain: scripture as a quotation
 * with its reference beneath, captioned photographs, definitions and a table.
 */
export function ArticleBody({
  html,
  headings,
  published,
}: {
  html: string;
  headings: HeadingAnchor[];
  /** Slugs that exist, so links to articles that do not are left as text. */
  published?: ReadonlySet<string>;
}) {
  return (
    <Prose
      size="lg"
      className={[
        // Headings stop clear of the sticky radio bar and navigation.
        "prose-h2:scroll-mt-40 prose-h2:text-h3 prose-h2:text-primary-900",
        // Scripture: the words, then the reference, with no invented quote marks.
        "prose-blockquote:font-medium [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none",
        "[&_cite]:mt-2 [&_cite]:block [&_cite]:text-caption [&_cite]:uppercase [&_cite]:not-italic [&_cite]:tracking-wider [&_cite]:text-cyan-700",
        "prose-figure:my-9 prose-img:my-0 prose-img:w-full prose-img:rounded-md",
        "prose-figcaption:text-body-sm prose-figcaption:text-ink-600",
        "[&_dt]:mt-5 [&_dt]:font-extrabold [&_dt]:text-primary-900 [&_dd]:mt-1 [&_dd]:text-ink-800",
        "prose-table:text-body-sm prose-th:text-primary-900 [&_table]:block [&_table]:overflow-x-auto",
      ].join(" ")}
    >
      <div dangerouslySetInnerHTML={{ __html: prepareArticleHtml(html, headings, published) }} />
    </Prose>
  );
}
