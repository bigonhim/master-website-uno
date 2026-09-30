import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/articles/ArticleBody";
import { ArticleContents } from "@/components/articles/ArticleContents";
import { formatArticleDate } from "@/components/articles/ArticleRow";
import { LeadIn } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";
import { getArticle, getArticleSlugs, type ArticleDetail } from "@/lib/api/articles";
import { ApiError } from "@/lib/api/client";

type Params = { params: Promise<{ slug: string }> };

async function loadArticle(slug: string): Promise<ArticleDetail | null> {
  try {
    return await getArticle(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) return { title: "Not found" };
  return {
    title: article.title,
    description: article.summary || undefined,
    // The publication is where the article was published; search engines are
    // pointed there rather than at this copy of it.
    alternates: { canonical: article.canonicalUrl },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary || undefined,
      publishedTime: article.publishedAt,
      images: article.image ? [article.image.url] : undefined,
    },
  };
}

/** "/articles/<slug>" from the publication's own URL for a related article. */
function localHref(canonicalUrl: string, id: string): string {
  try {
    const { pathname } = new URL(canonicalUrl);
    if (pathname.startsWith("/articles/")) return pathname;
  } catch {
    // Fall through to the id, which is the slug.
  }
  return `/articles/${id}`;
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) notFound();

  // If the list cannot be had, every link is kept: a link that may be dead is
  // a smaller fault than an article that will not open.
  const published = await getArticleSlugs().then(
    (slugs) => new Set(slugs),
    () => undefined,
  );

  return (
    <article>
      {/* The plate: the publication opens every article on a dark panel with
          the topic, the question, and a one-paragraph answer to it. */}
      <header className="on-dark grad-dither bg-grad-sapphire text-ink-0">
        <Container className="py-10 lg:py-14">
          <nav aria-label="Breadcrumb">
            <Link
              href="/articles"
              className="text-eyebrow uppercase text-ink-200 underline-offset-4 hover:text-ink-0 hover:underline"
            >
              ← All articles
            </Link>
          </nav>

          <div className="mt-6 max-w-[52rem]">
            {article.category ? <LeadIn>{article.category.name}</LeadIn> : null}
            <h1 className="mt-3 text-balance text-display-lg text-ink-0">{article.title}</h1>
            {article.summary ? (
              <p className="mt-4 text-pretty text-prose-lg text-ink-100">{article.summary}</p>
            ) : null}

            <div aria-hidden className="mt-7 h-1 w-16 bg-grad-rule" />

            <p className="mt-5 text-meta text-ink-200">
              {article.author ? (
                <>
                  <span className="text-ink-0">{article.author.name}</span>
                  <span aria-hidden className="mx-2">
                    ·
                  </span>
                </>
              ) : null}
              <time dateTime={article.publishedAt}>
                {formatArticleDate(article.publishedAt, "long")}
              </time>
              <span aria-hidden className="mx-2">
                ·
              </span>
              <span className="tabular-nums">{article.readingTimeMinutes} min read</span>
            </p>
          </div>
        </Container>
      </header>

      <Container className="pb-section-sm pt-8 lg:pt-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:order-2 lg:col-span-4 lg:col-start-9">
            <div className="lg:sticky lg:top-40 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
              <ArticleContents headings={article.headings} />
            </div>
          </div>

          <div className="min-w-0 lg:order-1 lg:col-span-8">
            <ArticleBody
              html={article.content.html}
              headings={article.headings}
              published={published}
            />

            {article.faqs.length > 0 ? (
              <section className="mt-14 max-w-prose border-t border-ink-100 pt-10">
                <h2 className="text-h3 text-primary-900">Questions readers ask</h2>
                <div className="mt-5">
                  {article.faqs.map((faq) => (
                    <details key={faq.q} className="group border-b border-ink-100">
                      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 text-body font-semibold text-primary-900 [&::-webkit-details-marker]:hidden">
                        {faq.q}
                        <span
                          aria-hidden
                          className="text-h4 leading-none text-cyan-700 transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="pb-5 text-body text-ink-700">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {article.scriptureRefs.length > 0 ? (
              <section className="mt-12 max-w-prose">
                <h2 className="text-eyebrow uppercase text-ink-500">Scripture in this article</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {article.scriptureRefs.map((ref) => (
                    <li
                      key={ref}
                      className="rounded-full bg-primary-50 px-3 py-1 text-caption text-primary-700 ring-1 ring-inset ring-primary-200"
                    >
                      {ref}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {article.related.length > 0 ? (
              <section className="mt-12 max-w-prose rounded-md border border-ink-200 bg-ink-0 p-6 shadow-sm">
                <h2 className="text-eyebrow uppercase text-ink-500">Keep reading</h2>
                <ul className="mt-2">
                  {article.related.map((related) => (
                    <li key={related.id} className="border-b border-ink-100 last:border-b-0">
                      <Link
                        href={localHref(related.canonicalUrl, related.id)}
                        className="block py-3 text-body font-semibold text-primary-900 underline-offset-4 transition-colors hover:text-primary-600 hover:underline"
                      >
                        {related.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="mt-10 max-w-prose text-body-sm text-ink-600">
              First published in{" "}
              <a
                href={article.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary-700 underline underline-offset-4"
              >
                Repent and Prepare the Way
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              .
            </p>
          </div>
        </div>
      </Container>
    </article>
  );
}
