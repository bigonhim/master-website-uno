import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { ArrowIcon } from "@/components/home/icons";
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
 * The channel's newest uploads. Each is a poster until it is pressed, so the
 * home page loads no players; pressed, it plays where it is.
 *
 * Titles are the ministry's own, in its own capitals.
 */
export function LatestVideos({ videos }: { videos: ChannelVideo[] }) {
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
          {videos.map((video) => (
            <li key={video.id}>
              <YouTubeEmbed video={asAttachedVideo(video)} title={video.title} />
              <h3
                title={video.title}
                className="mt-3 line-clamp-2 text-body font-semibold leading-snug text-primary-900"
              >
                {video.title}
              </h3>
              <p className="mt-1.5 text-meta text-ink-500">
                <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
