import Link from "next/link";

import { ArrowIcon } from "@/components/home/icons";
import { VideoPoster } from "@/components/media/VideoPoster";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { YOUTUBE_CHANNEL_URL, asAttachedVideo } from "@/lib/api/youtube";
import type { ChannelVideo } from "@/lib/youtube/feed";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The channel's newest uploads. Each card is a poster, as in the archive:
 * pressing it opens the video's own watch page with the player already
 * running, so the home page loads no players at all. The one being streamed
 * right now carries a Live tag on its poster.
 *
 * Titles are the ministry's own, in its own capitals.
 */
export function LatestVideos({
  videos,
  liveId = null,
}: {
  videos: ChannelVideo[];
  /** The id of the broadcast streaming right now, if any. */
  liveId?: string | null;
}) {
  if (videos.length === 0) return null;

  return (
    <section aria-labelledby="latest-videos-heading" className="border-t border-ink-100 bg-ink-0">
      <Container className="py-section-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow uppercase text-cyan-700">From the channel</p>
            <h2 id="latest-videos-heading" className="text-h2 mt-3 text-primary-900">
              Latest videos
            </h2>
          </div>
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary-700 hover:text-primary-900"
          >
            See the channel on YouTube
            <span className="sr-only"> (opens in a new tab)</span>
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <ul className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const live = video.id === liveId;
            return (
              <li key={video.id}>
                {/* Pressing play opens the watch page with the player already
                    running; the title opens it without starting the video. */}
                <Link
                  href={`/videos/${video.id}?play=1`}
                  aria-label={`Play video: ${video.title}`}
                  className="group relative block aspect-video overflow-hidden rounded-md bg-primary-950"
                >
                  <VideoPoster video={asAttachedVideo(video)} />
                  {live ? (
                    <Badge tone="live" dot className="absolute left-3 top-3 shadow-md">
                      Live
                    </Badge>
                  ) : null}
                </Link>
                <h3
                  title={video.title}
                  className="mt-3 line-clamp-2 text-body font-semibold leading-snug text-primary-900"
                >
                  <Link
                    href={`/videos/${video.id}`}
                    className="underline-offset-4 transition-colors hover:text-primary-600 focus-visible:underline"
                  >
                    {video.title}
                  </Link>
                </h3>
                <p className="mt-1.5 text-meta text-ink-500">
                  {live ? (
                    "Streaming now"
                  ) : (
                    <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
