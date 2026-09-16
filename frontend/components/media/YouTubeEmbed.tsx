"use client";

import Image from "next/image";
import { useState } from "react";

import type { AttachedVideo } from "@/lib/api/types";

/**
 * The only iframe in the codebase.
 *
 * It is a facade: a poster image until the visitor presses play. The previous
 * attempt rendered a live iframe inside every card, so a 24-card archive page
 * loaded 24 YouTube players — tens of megabytes of JavaScript, and unusable on
 * a Kenyan 3G connection. Nothing here loads from YouTube until asked.
 */
export function YouTubeEmbed({
  video,
  title,
  priority = false,
}: {
  video: AttachedVideo;
  title: string;
  priority?: boolean;
}) {
  const [active, setActive] = useState(false);

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
      <div className="relative aspect-video overflow-hidden rounded-md bg-primary-950">
        <iframe
          src={`${video.embed_url}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-md bg-primary-950">
      <button
        type="button"
        onClick={() => setActive(true)}
        aria-label={`Play video: ${title}`}
        className="group absolute inset-0 h-full w-full"
      >
        <Image
          src={video.thumbnail_url}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.03]"
          priority={priority}
        />
        {/* Guarantees contrast for the play glyph whatever the frame holds. */}
        <span aria-hidden className="absolute inset-0 bg-grad-veil" />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sun/95 shadow-md transition-transform duration-300 ease-emphasis group-hover:scale-110"
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-primary-950">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
