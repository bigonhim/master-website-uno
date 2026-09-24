import Link from "next/link";

import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { Badge } from "@/components/ui/Badge";
import { Bar, LeadIn, LowerThird, PlaceTag } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";
import { Prose } from "@/components/ui/Prose";
import { ApiError } from "@/lib/api/client";
import { getArchiveItem, type ArchiveKind } from "@/lib/api/content";
import type { ContentDetail } from "@/lib/api/types";

export async function loadDetail(
  kind: ArchiveKind,
  slug: string,
): Promise<ContentDetail | null> {
  try {
    return await getArchiveItem(kind, slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** True when the visitor got here by pressing play on an archive card. */
export async function readAutoplay(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<boolean> {
  return (await searchParams).play === "1";
}

/** One detail layout, shared by all three content types. */
export function DetailScreen({
  item,
  backHref,
  backLabel,
  autoplay = false,
}: {
  item: ContentDetail;
  backHref: string;
  backLabel: string;
  /** Start the first recording as the page opens. */
  autoplay?: boolean;
}) {
  const playable = item.videos.filter((v) => v.availability !== "unavailable");

  return (
    <>
      <div className="border-b border-ink-100 bg-gradient-to-b from-primary-50/70 to-ink-0">
        <Container className="py-6 lg:py-8">
          <nav aria-label="Breadcrumb">
            <Link
              href={backHref}
              className="text-eyebrow uppercase text-primary-600 underline-offset-4 hover:underline"
            >
              ← {backLabel}
            </Link>
          </nav>

          {/* Set as the ministry's own title cards: lead-in, then the title in
              stacked navy bars, then the lower third. */}
          {item.kicker ? <LeadIn className="mt-5">{item.kicker}</LeadIn> : null}
          <h1
            className={`text-display-lg max-w-[40ch] uppercase leading-[1.32] ${
              item.kicker ? "mt-3" : "mt-5"
            }`}
          >
            <Bar>{item.title}</Bar>
          </h1>

          <LowerThird
            className="mt-5"
            kind={item.kind}
            date={
              item.is_dated && item.prophecy_date
                ? formatDate(item.prophecy_date)
                : "Date not recorded"
            }
          />

          {item.regions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.regions.map((region) => (
                <PlaceTag key={region.slug} name={region.name} detail={region.continent || undefined} />
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 empty:hidden">
            {item.category ? <Badge tone="published">{item.category.name}</Badge> : null}
            {item.is_fulfilled ? <Badge tone="fulfilled">Fulfilled</Badge> : null}
            {item.condition ? <Badge tone="neutral">{item.condition}</Badge> : null}
          </div>

          {item.speaker ? <p className="mt-4 text-meta text-ink-600">{item.speaker}</p> : null}
        </Container>
      </div>

      <Container className="pb-section-sm pt-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {item.videos.length > 0 ? (
              <div className="space-y-6">
                {item.videos.map((video, index) => (
                  <figure key={video.youtube_id}>
                    <YouTubeEmbed
                      video={video}
                      title={item.title}
                      priority={index === 0}
                      eager
                      autoplay={autoplay && index === 0}
                    />
                    <figcaption className="mt-2 flex items-center justify-between gap-4 text-meta text-ink-500">
                      <span>
                        {video.label ||
                          (item.videos.length > 1 ? `Part ${index + 1}` : "")}
                      </span>
                      {video.availability !== "unavailable" ? (
                        <a
                          href={video.watch_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-700 underline underline-offset-4"
                        >
                          Watch on YouTube
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}

            {item.body ? (
              <Prose size="lg" className="mt-10 whitespace-pre-line">
                {item.body}
              </Prose>
            ) : (
              <p className="mt-10 max-w-prose text-body-sm text-ink-500">
                No transcript has been recorded for this entry yet.
              </p>
            )}

            {item.fulfillment_summary ? (
              <section className="mt-10 rounded-sm bg-ink-50 p-6 ring-1 ring-inset ring-ink-100">
                <h2 className="text-eyebrow uppercase text-[rgb(11_122_87)]">
                  Fulfilment
                </h2>
                <p className="mt-3 text-body-sm text-ink-700">
                  {item.fulfillment_summary}
                </p>
              </section>
            ) : null}
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-sm bg-ink-0 p-6 ring-1 ring-inset ring-ink-100">
              <h2 className="text-eyebrow uppercase text-ink-500">This entry</h2>
              <dl className="mt-4 space-y-3 text-body-sm">
                <div>
                  <dt className="text-ink-500">Recordings</dt>
                  <dd className="text-ink-800">
                    {playable.length} of {item.videos.length} available
                  </dd>
                </div>
                {item.series ? (
                  <div>
                    <dt className="text-ink-500">Series</dt>
                    <dd className="text-ink-800">{item.series.title}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-ink-500">Dating</dt>
                  <dd className="text-ink-800">
                    {item.is_dated
                      ? item.date_precision
                      : "Not recorded in the source"}
                  </dd>
                </div>
              </dl>
              <Link
                href={backHref}
                className="mt-6 inline-block text-body-sm font-semibold text-primary-700 underline underline-offset-4"
              >
                ← Back to {backLabel.toLowerCase()}
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
