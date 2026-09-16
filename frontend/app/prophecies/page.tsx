import type { Metadata } from "next";

import { FacetRail } from "@/components/archive/FacetRail";
import { Pagination } from "@/components/archive/Pagination";
import { ContentCard } from "@/components/content/ContentCard";
import {
  ApiErrorState,
  NoResultsState,
  NotYetPublishedState,
} from "@/components/feedback/States";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { Container } from "@/components/ui/Container";
import { ApiError } from "@/lib/api/client";
import { getArchive } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Prophecies",
  description:
    "The prophetic archive of the Ministry of Repentance and Holiness, browsable by theme and nation.",
};

const LIMIT = 24;
const BASE = "/prophecies";

/** Only the parameters the API understands; anything else is ignored. */
function readParams(raw: Record<string, string | string[] | undefined>) {
  const pick = (key: string) => {
    const value = raw[key];
    return typeof value === "string" ? value : undefined;
  };
  const params: Record<string, string> = {};
  for (const key of ["category", "region", "series", "year", "fulfilled", "offset"]) {
    const value = pick(key);
    if (value) params[key] = value;
  }
  return params;
}

export default async function PropheciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = readParams(raw);
  const offset = Number(params.offset ?? 0) || 0;

  let data;
  try {
    data = await getArchive("prophecies", { ...params, limit: LIMIT, offset });
  } catch (error) {
    // No fallback content. A broken backend must look broken.
    return (
      <>
        <PageMasthead eyebrow="The Archive" title="Prophecies" />
        <Container className="py-section-sm">
          <ApiErrorState status={error instanceof ApiError ? error.status : undefined} />
        </Container>
      </>
    );
  }

  const hasFilters = Object.keys(params).some((k) => k !== "offset");
  const from = data.count === 0 ? 0 : offset + 1;
  const to = Math.min(offset + LIMIT, data.count);

  return (
    <>
      <PageMasthead
        eyebrow="The Archive"
        title="Prophecies"
        lede="Prophetic words given through the Ministry of Repentance and Holiness, gathered from two decades of recordings."
        count={data.count}
        countLabel={data.count === 1 ? "entry" : "entries"}
      />

      <Container className="py-section-sm">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            {data.facets ? (
              <FacetRail facets={data.facets} basePath={BASE} params={params} />
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
                <NoResultsState resetHref={BASE} />
              ) : (
                <NotYetPublishedState kind="prophecies" />
              )
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.results.map((item, index) => (
                  <ContentCard
                    key={item.slug}
                    item={item}
                    href={`${BASE}/${item.slug}`}
                    priority={index < 3}
                  />
                ))}
              </div>
            )}

            <Pagination
              count={data.count}
              limit={LIMIT}
              offset={offset}
              basePath={BASE}
              params={params}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
