import "server-only";

import { ApiError, query } from "./client";

/**
 * The ministry's written articles, read from the public API of its
 * publication, read.repentanceonline.com.
 *
 * They are fetched rather than copied into Django: the publication is where
 * articles are written and corrected, so a copy here would go stale the first
 * time an editor fixed a typo there. Pages revalidate instead, and a new
 * article appears here without anyone importing it.
 *
 * Shapes verified against the live endpoints and /api/openapi.json.
 */

const ARTICLES_API_URL =
  process.env.ARTICLES_API_URL ?? "https://read.repentanceonline.com/api/v1";

export interface ArticleCategoryRef {
  name: string;
  slug: string;
  url: string;
}

export interface ArticleAuthor {
  name: string;
  id: string;
  url: string;
  role?: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  author: ArticleAuthor | null;
  category: ArticleCategoryRef | null;
  tags: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  canonicalUrl: string;
  image: { url: string; alt: string } | null;
}

export interface ArticleDetail extends ArticleSummary {
  content: { format: string; source: string; text: string; html: string };
  wordCount: number;
  headings: { id: string; text: string; url: string }[];
  scriptureRefs: string[];
  faqs: { q: string; a: string }[];
  related: { id: string; title: string; canonicalUrl: string }[];
}

export interface ArticleTopic {
  name: string;
  slug: string;
  description: string;
  articleCount: number;
}

export interface ArticlePage {
  data: ArticleSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ArticleQuery = {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export const ARTICLES_PER_PAGE = 12;

/** Throws on failure, like apiFetch: an outage must look like an outage. */
async function articlesFetch<T>(path: string, revalidate: number, tags: string[]): Promise<T> {
  const url = `${ARTICLES_API_URL}${path}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
    next: { revalidate, tags },
  });

  if (!response.ok) {
    throw new ApiError(response.status, url, await response.text().catch(() => undefined));
  }

  return (await response.json()) as T;
}

export function getArticles(params: ArticleQuery = {}): Promise<ArticlePage> {
  return articlesFetch<ArticlePage>(
    `/articles${query({ ...params, limit: params.limit ?? ARTICLES_PER_PAGE })}`,
    300,
    ["articles"],
  );
}

export async function getArticle(slug: string): Promise<ArticleDetail> {
  const payload = await articlesFetch<{ data: ArticleDetail }>(
    `/articles/${encodeURIComponent(slug)}`,
    300,
    ["articles", `articles:${slug}`],
  );
  return payload.data;
}

/**
 * The picture to show in the feed.
 *
 * The API gives each article one picture, in whatever shape it was made:
 * some are portrait, and a feed frame cuts the heads and titles off those. The
 * publication keeps a landscape cut of most of them beside the original, as
 * `<name>-wide.webp`, and uses it in its own feed. That naming is its habit
 * and not part of its API, so the cut is asked for, never assumed; when it is
 * not there, or cannot be checked, the picture the API gave is used.
 */
export async function getFeedImage(image: string): Promise<string> {
  if (!image.endsWith(".webp")) return image;
  const wide = image.replace(/\.webp$/, "-wide.webp");
  try {
    const response = await fetch(wide, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 86400, tags: ["articles"] },
    });
    const type = response.headers.get("content-type") ?? "";
    return response.ok && type.startsWith("image/") ? wide : image;
  } catch {
    return image;
  }
}

/** The slug of every published article. The API caps `limit` at 100. */
export async function getArticleSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const data = await getArticles({ limit: 100, page });
    slugs.push(...data.data.map((article) => article.slug));
    if (page >= data.pagination.totalPages) break;
  }
  return slugs;
}

export async function getArticleTopics(): Promise<ArticleTopic[]> {
  const payload = await articlesFetch<{ data: ArticleTopic[] }>("/categories", 300, [
    "articles",
  ]);
  return payload.data;
}
