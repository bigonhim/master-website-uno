import "server-only";

import { apiFetch, query } from "./client";
import type { ContentDetail, ContentItem, Paginated } from "./types";

export type ArchiveQuery = {
  q?: string;
  category?: string;
  region?: string;
  series?: string;
  year?: string;
  fulfilled?: string;
  watchable?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
};

const KINDS = {
  prophecies: "prophecies",
  teachings: "teachings",
  healings: "healings",
  writings: "writings",
} as const;

export type ArchiveKind = keyof typeof KINDS;

export function getArchive(
  kind: ArchiveKind,
  params: ArchiveQuery = {},
): Promise<Paginated<ContentItem>> {
  return apiFetch<Paginated<ContentItem>>(
    `/${KINDS[kind]}/${query({ ...params, limit: params.limit ?? 24 })}`,
    { revalidate: 300, tags: [kind] },
  );
}

export function getArchiveItem(
  kind: ArchiveKind,
  slug: string,
): Promise<ContentDetail> {
  return apiFetch<ContentDetail>(`/${KINDS[kind]}/${slug}/`, {
    revalidate: 3600,
    tags: [kind, `${kind}:${slug}`],
  });
}
