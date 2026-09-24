import { ArchiveSearch } from "@/components/archive/ArchiveSearch";
import { FacetRail } from "@/components/archive/FacetRail";
import { Pagination } from "@/components/archive/Pagination";
import { ContentCard } from "@/components/content/ContentCard";
import {
  ApiErrorState,
  NoResultsState,
  NotYetPublishedState,
} from "@/components/feedback/States";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { ApiError } from "@/lib/api/client";
import { getArchive, type ArchiveKind } from "@/lib/api/content";

export const ARCHIVE_LIMIT = 24;

const FILTER_KEYS = ["q", "category", "region", "series", "year", "fulfilled", "offset"];

/** Only parameters the API understands; anything else is ignored rather than
 *  forwarded, so a junk query string cannot produce a confusing result set. */
export function readArchiveParams(
  raw: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const value = raw[key];
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed) params[key] = trimmed;
  }
  return params;
}

/**
 * One archive implementation for prophecies, teachings and healings.
 *
 * The three differ only in wording and endpoint, so they share this instead of
 * each growing a copy that drifts — which is exactly how the previous attempt
 * ended up with the same search box and video embed pasted across pages.
 */
export async function ArchiveScreen({
  kind,
  basePath,
  eyebrow,
  title,
  lede,
  emptyLabel,
  params,
}: {
  kind: ArchiveKind;
  basePath: string;
  eyebrow: string;
  title: string;
  lede: string;
  emptyLabel: string;
  params: Record<string, string>;
}) {
  const offset = Number(params.offset ?? 0) || 0;

  let data;
  try {
    data = await getArchive(kind, { ...params, limit: ARCHIVE_LIMIT, offset });
  } catch (error) {
    // No fallback content, ever. A broken backend must look broken.
    return (
      <>
        <PageHeader eyebrow={eyebrow} title={title} />
        <Container className="pb-section-sm pt-8">
          <ApiErrorState status={error instanceof ApiError ? error.status : undefined} />
        </Container>
      </>
    );
  }

  const hasFilters = Object.keys(params).some((key) => key !== "offset");
  const from = data.count === 0 ? 0 : offset + 1;
  const to = Math.min(offset + ARCHIVE_LIMIT, data.count);

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        lede={lede}
        aside={<ArchiveSearch basePath={basePath} params={params} label={emptyLabel} />}
      />

      <Container className="pb-section-sm pt-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            {data.facets ? (
              <FacetRail facets={data.facets} basePath={basePath} params={params} />
            ) : null}
          </div>

          <div className="lg:col-span-9">
            {data.count > 0 ? (
              <p className="mb-5 text-body-sm tabular-nums text-ink-600">
                Showing {from}–{to} of {data.count}
              </p>
            ) : null}

            {data.results.length === 0 ? (
              hasFilters ? (
                <NoResultsState
                  resetHref={basePath}
                  hint={
                    params.q
                      ? "Try fewer or different words, or remove a filter."
                      : undefined
                  }
                />
              ) : (
                <NotYetPublishedState kind={emptyLabel} />
              )
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.results.map((item, index) => (
                  <ContentCard
                    key={item.slug}
                    item={item}
                    href={`${basePath}/${item.slug}`}
                    priority={index < 3}
                  />
                ))}
              </div>
            )}

            <Pagination
              count={data.count}
              limit={ARCHIVE_LIMIT}
              offset={offset}
              basePath={basePath}
              params={params}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
