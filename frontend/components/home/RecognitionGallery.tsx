"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { RecognitionPhoto } from "@/lib/recognition";

/**
 * The recognition photos as a gallery: the first photo leads at double size,
 * the rest sit beside it in a two-by-two. Tiles crop to 16:9 so the grid stays
 * even; pressing one opens the whole photo, uncropped, in a native <dialog>
 * (Escape and the backdrop close it, the arrow keys step through).
 *
 * Words sit beneath the pictures, never over them, and nothing is scaled on
 * hover: any zoom resamples the image and reads as blur. Quality 90 is the
 * setting the hero uses for photos this large on screen.
 */
export function RecognitionGallery({ photos }: { photos: RecognitionPhoto[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const count = photos.length;

  const show = useCallback((i: number) => {
    setOpen(i);
    dialog.current?.showModal();
  }, []);

  const step = useCallback(
    (by: number) => setOpen((i) => (i === null ? i : (i + by + count) % count)),
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        {photos.map((photo, i) => {
          const lead = i === 0;
          return (
            <li key={photo.src} className={lead ? "md:col-span-2 lg:row-span-2" : undefined}>
              <figure className="flex h-full flex-col">
                <button
                  type="button"
                  onClick={() => show(i)}
                  aria-label={`View full photo: ${photo.title}`}
                  className={`group relative block w-full overflow-hidden rounded-lg bg-primary-900 shadow-lg ring-1 ring-ink-0/10 transition-shadow duration-300 hover:shadow-xl hover:ring-sun/60 ${
                    lead ? "aspect-video lg:aspect-auto lg:flex-1" : "aspect-video"
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    quality={90}
                    // The lead tile spans two rows, so on wide screens it is taller
                    // than 16:9 and the cover crop is wider than the tile.
                    sizes={
                      lead
                        ? "(min-width: 1248px) 780px, (min-width: 1024px) 64vw, 100vw"
                        : "(min-width: 1248px) 288px, (min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    }
                    style={photo.focus ? { objectPosition: photo.focus } : undefined}
                    className="object-cover"
                  />
                  <span
                    aria-hidden
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-primary-950/70 text-ink-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    <ExpandIcon className="h-4 w-4" />
                  </span>
                </button>
                <figcaption className="mt-3">
                  <p
                    className={`font-extrabold text-ink-0 ${lead ? "text-h4" : "text-body"}`}
                  >
                    {photo.title}
                  </p>
                  <p className="mt-1 text-body-sm text-ink-0/70">{photo.caption}</p>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        aria-label={current ? current.title : "Photo"}
        className="on-dark m-auto h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 text-ink-0 backdrop:bg-primary-950"
      >
        {current ? (
          <div
            className="flex h-full flex-col items-center justify-center gap-4 px-4 py-6 sm:px-16"
            onClick={(e) => {
              if (e.target === e.currentTarget) dialog.current?.close();
            }}
          >
            <div
              className="relative w-full max-w-[min(100%,calc((100dvh-10rem)*var(--ar)))]"
              style={{ aspectRatio: `${current.width} / ${current.height}`, ["--ar" as string]: current.width / current.height }}
            >
              <Image
                key={current.src}
                src={current.src}
                alt={current.alt}
                fill
                quality={90}
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="max-w-2xl text-center">
              <p className="text-h4 font-extrabold">{current.title}</p>
              <p className="mt-1 text-body-sm text-ink-0/75">{current.caption}</p>
              <p className="mt-2 text-meta tabular-nums text-ink-0/60">
                {open! + 1} / {count}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-ink-0/10 transition-colors hover:bg-ink-0/20"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink-0/10 transition-colors hover:bg-ink-0/20 sm:left-4"
                >
                  <ChevronIcon className="h-5 w-5 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink-0/10 transition-colors hover:bg-ink-0/20 sm:right-4"
                >
                  <ChevronIcon className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}

type IconProps = { className?: string };

function ExpandIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function CloseIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
