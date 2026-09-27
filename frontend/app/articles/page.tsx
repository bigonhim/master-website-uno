import type { Metadata } from "next";

import { ArchiveSearch } from "@/components/archive/ArchiveSearch";
import { Pagination } from "@/components/archive/Pagination";
import { ArticleRow } from "@/components/articles/ArticleRow";
import { TopicRail } from "@/components/articles/TopicRail";
import { ApiErrorState, NoResultsState } from "@/components/feedback/States";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import {
  ARTICLES_PER_PAGE,
  getArticleTopics,
  getArticles,
  getFeedImage,
} from "@/lib/api/articles";
import { ApiError } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Written teaching from the Ministry of Repentance and Holiness: Scripture examined passage by passage, with the questions readers ask answered plainly.",
};

const HEADER = { eyebrow: "Read", title: "Articles" };

const FILTER_KEYS = ["q", "topic", "offset"];

function readParams(raw: Record<string, string | string[] | undefined>) {
  const params: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const value = raw[key];
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed) params[key] = trimmed;
  }
  return params;
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readParams(await searchParams);
  const offset = Math.max(0, Number(params.offset ?? 0) || 0);

  let articles;
  let topics;
  try {
    [articles, topics] = await Promise.all([
      getArticles({
        q: params.q,
        category: params.topic,
        page: Math.floor(offset / ARTICLES_PER_PAGE) + 1,
      }),
      getArticleTopics(),
    ]);
  } catch (error) {
    // No fallback content, ever. A broken source must look broken.
    return (
      <>
        <PageHeader {...HEADER} />
        <Container className="pb-section-sm pt-8">
          <ApiErrorState status={error instanceof ApiError ? error.status : undefined} />
        </Container>
      </>
    );
  }

  const images = await Promise.all(
    articles.data.map((article) =>
      article.image ? getFeedImage(article.image.url) : undefined,
    ),
  );

  const total = topics.reduce((sum, topic) => sum + topic.articleCount, 0);

  return (
    <>
      <PageHeader
        {...HEADER}
        lede="Written teaching from the ministry, with Scripture examined passage by passage."
        aside={<ArchiveSearch basePath="/articles" params={params} label="articles" />}
      />

      <Container className="pb-section-sm pt-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {articles.data.length === 0 ? (
              <NoResultsState
                resetHref="/articles"
                hint={params.q ? "Try fewer or different words, or another topic." : undefined}
              />
            ) : (
              articles.data.map((article, index) => (
                <ArticleRow
                  key={article.slug}
                  article={article}
                  image={images[index]}
                  priority={index === 0}
                />
              ))
            )}

            <Pagination
              count={articles.pagination.total}
              limit={ARTICLES_PER_PAGE}
              offset={offset}
              basePath="/articles"
              params={params}
            />
          </div>

          <div className="lg:col-span-3 lg:col-start-10">
            <TopicRail topics={topics} total={total} active={params.topic} params={params} />
          </div>
        </div>
      </Container>
    </>
  );
}
