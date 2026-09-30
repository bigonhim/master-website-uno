import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { readAutoplay } from "@/components/content/DetailScreen";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import {
  YOUTUBE_CHANNEL_URL,
  asAttachedVideo,
  getChannelVideo,
  getLiveVideoId,
} from "@/lib/api/youtube";
import { isVideoId } from "@/lib/youtube/feed";

/**
 * A channel video's own watch page.
 *
 * The home page's video cards land here, the same way archive cards land on
 * their entry's page: nothing plays inside a grid. Unlike archive entries,
 * these videos exist only on YouTube — there is no transcript or record to
 * show — so the page is just the player, its title, and where it came from.
 */

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (!isVideoId(id)) return { title: "Not found" };
  const video = await getChannelVideo(id);
  if (!video) return { title: "Not found" };
  return {
    title: video.title,
    alternates: { canonical: `/videos/${video.id}` },
    openGraph: {
      title: video.title,
      images: [`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`],
    },
  };
}

export default async function VideoWatchPage({ params, searchParams }: Params) {
  const { id } = await params;
  if (!isVideoId(id)) notFound();

  const [video, liveId] = await Promise.all([getChannelVideo(id), getLiveVideoId()]);
  if (!video) notFound();
  const live = video.id === liveId;

  return (
    <Container className="pb-section-sm pt-5 lg:pt-6">
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="text-eyebrow uppercase text-primary-600 underline-offset-4 hover:underline"
        >
          ← Home
        </Link>
      </nav>

      <div className="mx-auto mt-4 max-w-4xl">
        <YouTubeEmbed
          video={asAttachedVideo(video)}
          title={video.title}
          priority
          eager
          autoplay={await readAutoplay(searchParams)}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3 empty:hidden">
          {live ? (
            <Badge tone="live" dot>
              Live now
            </Badge>
          ) : null}
          {video.publishedAt ? (
            <p className="text-meta text-ink-500">
              <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
            </p>
          ) : null}
        </div>

        <h1 className="mt-2 text-h3 font-bold text-primary-900">{video.title}</h1>

        <p className="mt-4 text-body-sm text-ink-600">
          From the ministry&apos;s channel on YouTube —{" "}
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 underline underline-offset-4"
          >
            watch it there
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          or{" "}
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 underline underline-offset-4"
          >
            see the channel
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
