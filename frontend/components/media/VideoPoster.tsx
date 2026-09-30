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
        {/* The YouTube mark, since that is where the recording plays from;
            its own triangle keeps the button reading as "play". */}
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-primary-950">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </span>
    </>
  );
}
