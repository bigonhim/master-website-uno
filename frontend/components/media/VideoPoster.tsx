import Image from "next/image";

import type { AttachedVideo } from "@/lib/api/types";

/**
 * A recording's thumbnail with the yellow play glyph, filling its parent.
 *
 * The parent must be positioned and carry `group`, so hovering it zooms the
 * frame and the glyph. Cards wrap it in a link to the entry's own page; the
 * embed wraps it in the button that starts the player.
 */
export function VideoPoster({
  video,
  priority = false,
}: {
  video: AttachedVideo;
  priority?: boolean;
}) {
  return (
    <>
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
    </>
  );
}
