"use client";

import { useState } from "react";

import { VideoPoster } from "@/components/media/VideoPoster";
import type { AttachedVideo } from "@/lib/api/types";

/**
 * The only iframe in the codebase.
 *
 * By default it is a facade: a poster image that turns into the player, already
 * playing, in place, on one press. Archive cards do not use it at all — their
 * poster links to the entry's own page — so a 24-card page loads no players.
 *
 * `eager` skips the facade and renders the player straight away. That is for
 * detail pages, where the video is the page and one player is affordable.
 * `autoplay` starts that player, for visitors who arrived by pressing play on
 * a card.
 */
export function YouTubeEmbed({
  video,
  title,
  priority = false,
  eager = false,
  autoplay = false,
}: {
  video: AttachedVideo;
  title: string;
  priority?: boolean;
  eager?: boolean;
  autoplay?: boolean;
}) {
  const [active, setActive] = useState(eager);
  const frame = "relative aspect-video overflow-hidden rounded-md bg-primary-950";

  if (video.availability === "unavailable") {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md bg-ink-50 px-6 text-center ring-1 ring-inset ring-ink-200">
        <p className="text-body-sm text-ink-600">
          This recording is no longer available on YouTube.
          <br />
          <span className="text-caption text-ink-500">
            The entry is kept as part of the archive record.
          </span>
        </p>
      </div>
    );
  }

  if (active && video.allow_embed) {
    return (
      <div className={frame}>
        <iframe
          // Autoplay only when the visitor pressed play, here or on a card; an
          // eager player otherwise waits.
          src={`${video.embed_url}?rel=0&playsinline=1${eager && !autoplay ? "" : "&autoplay=1"}`}
          title={title}
          // `fullscreen` in `allow` replaces the legacy allowFullScreen
          // attribute; setting both makes the browser warn about the overlap.
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
          loading={eager && !autoplay ? "lazy" : undefined}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className={frame}>
      {video.allow_embed ? (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          <VideoPoster video={video} priority={priority} />
        </button>
      ) : (
        // The uploader has disabled embedding, so the only place it plays is
        // YouTube itself. A button that did nothing here was a dead end.
        <a
          href={video.watch_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch on YouTube: ${title} (opens in a new tab)`}
          className="group absolute inset-0 h-full w-full"
        >
          <VideoPoster video={video} priority={priority} />
        </a>
      )}
    </div>
  );
}
