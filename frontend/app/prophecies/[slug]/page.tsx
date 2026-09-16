import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Prose } from "@/components/ui/Prose";
import { ApiError } from "@/lib/api/client";
import { getArchiveItem } from "@/lib/api/content";
import type { ContentDetail } from "@/lib/api/types";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string): Promise<ContentDetail | null> {
  try {
    return await getArchiveItem("prophecies", slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = await load(slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.title,
    description: item.summary || undefined,
    alternates: { canonical: `/prophecies/${item.slug}` },
    openGraph: {
      title: item.title,
      description: item.summary || undefined,
      images: item.videos[0]?.thumbnail_url ? [item.videos[0].thumbnail_url] : undefined,
    },
  };
}

export default async function ProphecyDetailPage({ params }: Params) {
  const { slug } = await params;
  const item = await load(slug);
  if (!item) notFound();

  const playable = item.videos.filter((v) => v.availability !== "unavailable");

  return (
    <>
      <div className="on-dark grad-dither bg-grad-royal">
        <Container className="py-section-sm">
          <Eyebrow rule>
            <Link href="/prophecies" className="underline-offset-4 hover:underline">
              Prophecies
            </Link>
          </Eyebrow>
          <h1 className="text-display-lg mt-6 max-w-[24ch]">{item.title}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {item.category ? <Badge tone="published">{item.category.name}</Badge> : null}
            {item.is_fulfilled ? <Badge tone="fulfilled">Fulfilled</Badge> : null}
            {item.regions.map((region) => (
              <Badge key={region.slug} tone="neutral">
                {region.name}
              </Badge>
            ))}
          </div>

          <p className="mt-5 text-meta text-ink-300">
            {item.speaker ? <span>{item.speaker} · </span> : null}
            <span className="tabular-nums">
              {item.is_dated && item.prophecy_date
                ? new Date(item.prophecy_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Date not recorded"}
            </span>
          </p>
        </Container>
      </div>

      <Container className="py-section-sm">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {item.videos.length > 0 ? (
              <div className="space-y-6">
                {item.videos.map((video, index) => (
                  <figure key={video.youtube_id}>
                    <YouTubeEmbed video={video} title={item.title} priority={index === 0} />
                    <figcaption className="mt-2 flex items-center justify-between gap-4 text-meta text-ink-500">
                      <span>{video.label || (item.videos.length > 1 ? `Part ${index + 1}` : "")}</span>
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
              <Prose size="lg" className="mt-10">
                {item.body}
              </Prose>
            ) : (
              <p className="mt-10 max-w-prose text-body-sm text-ink-500">
                No transcript has been recorded for this entry yet.
              </p>
            )}

            {item.fulfillment_summary ? (
              <section className="mt-10 rounded-sm bg-ink-50 p-6 ring-1 ring-inset ring-ink-100">
                <h2 className="text-eyebrow uppercase text-[rgb(11_122_87)]">Fulfilment</h2>
                <p className="mt-3 text-body-sm text-ink-700">{item.fulfillment_summary}</p>
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
                    {item.is_dated ? item.date_precision : "Not recorded in the source"}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
