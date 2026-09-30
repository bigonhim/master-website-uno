import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailScreen } from "@/components/content/DetailScreen";
import { Container } from "@/components/ui/Container";
import { KIND_LABELS } from "@/lib/studio/format";
import { StudioApiError, studioGet } from "@/lib/studio/server";
import type { ContentDetail } from "@/lib/api/types";
import type { Item, Taxonomy } from "@/lib/studio/types";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

/**
 * An archive item as the public page will show it, before it is published:
 * the saved version, drawn by the same component inside the site's own frame.
 * Only a signed-in editor can open it (proxy.ts, and the Studio API itself).
 */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  let item: Item;
  try {
    item = await studioGet<Item>(`items/${id}/`);
  } catch (error) {
    if (error instanceof StudioApiError && error.status === 404) notFound();
    throw error;
  }
  const taxonomy = await studioGet<Taxonomy>("taxonomy/");
  const kind = KIND_LABELS[item.kind];

  return (
    <>
      <div className="sticky top-[calc(var(--radio-h)+var(--nav-h))] z-30 bg-gold-500 text-primary-950">
        <Container className="flex flex-wrap items-center justify-between gap-2 py-2 text-body-sm font-bold">
          <span>
            Preview · {item.state === "published" ? "published" : item.state === "scheduled" ? "scheduled" : "draft, not on the site"}
          </span>
          <Link href={`/studio/archive/${item.id}`} className="underline underline-offset-2">
            Back to the Studio
          </Link>
        </Container>
      </div>
      <DetailScreen item={asDetail(item, taxonomy)} backHref={`/${kind.path}`} backLabel={kind.many} />
    </>
  );
}

/** The Studio's view of an item, in the shape the public page draws. */
function asDetail(item: Item, taxonomy: Taxonomy): ContentDetail {
  const category = taxonomy.categories.find((c) => c.id === item.category);
  const series = taxonomy.series.find((s) => s.id === item.series);
  return {
    slug: item.slug,
    kind: item.kind,
    kicker: item.kicker,
    title: item.title,
    speaker: item.speaker,
    summary: item.summary,
    category: category ? { name: category.name, slug: "", description: "" } : null,
    published_at: item.published_at,
    prophecy_date: item.prophecy_date,
    date_source: item.date_source as ContentDetail["date_source"],
    date_precision: item.date_precision,
    is_dated: item.date_source !== "unknown",
    is_fulfilled: item.is_fulfilled,
    fulfillment_summary: item.fulfillment_summary,
    condition: item.condition,
    videos: item.videos.map((v, order) => ({
      youtube_id: v.youtube_id,
      label: v.label,
      order,
      is_primary: v.is_primary,
      availability: v.availability,
      allow_embed: true,
      thumbnail_url: v.thumbnail_url,
      embed_url: `https://www.youtube-nocookie.com/embed/${v.youtube_id}`,
      watch_url: `https://www.youtube.com/watch?v=${v.youtube_id}`,
      duration_seconds: null,
    })),
    body: item.body,
    regions: taxonomy.regions
      .filter((r) => item.regions.includes(r.id))
      .map((r) => ({ name: r.name, slug: "", iso2: "", continent: "" })),
    series: series
      ? { title: series.title, slug: "", description: "", starts_on: null, ends_on: null, location: "" }
      : null,
    position_in_series: item.position_in_series,
    is_anonymous: item.is_anonymous,
    language: "en",
    updated_at: item.updated_at,
  };
}
