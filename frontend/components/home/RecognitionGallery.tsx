"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { RecognitionPhoto } from "@/lib/recognition";

/**
 * The recognition photos as a viewer, sized to sit within one screen: one
 * photo large, a strip of all of them beneath to pick from, and the section's
 * heading (`children`) beside it with the chosen photo's caption at its foot.
 * On phones the caption drops below the strip, so it follows the photo it
 * describes. Pressing the large photo opens the whole of it, uncropped, in a
 * native <dialog> (Escape and the backdrop close it, the arrow keys step
 * through); the viewer keeps whichever photo the lightbox was left on.
 *
 * Words sit beside or beneath the pictures, never over them, and nothing is
 * scaled on hover: any zoom resamples the image and reads as blur. Quality 90
 * is the setting the hero uses for photos this large on screen.
 */
export function RecognitionGallery({
  photos,
  children,
}: {
  photos: RecognitionPhoto[];
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const count = photos.length;
  const current = photos[active];

  const step = useCallback(
    (by: number) => setActive((i) => (i + by + count) % count),
    [count],
  );

  const show = useCallback(() => {
    setOpen(true);
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <div className="lg:col-span-5">{children}</div>

        {/* The viewer */}
        <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <button
            type="button"
            onClick={show}
            aria-label={`View full photo: ${current.title}`}
            className="group relative block aspect-video w-full overflow-hidden rounded-lg lg:aspect-[16/10] bg-primary-900 shadow-xl shadow-primary-950/40 ring-1 ring-ink-0/15"
          >
            {/* All of them stacked, so changing photo is a crossfade rather
                than a blank frame while the next one loads. */}
            {photos.map((photo, i) => (
              <Image
                key={photo.src}
                src={photo.src}
                alt={i === active ? photo.alt : ""}
                aria-hidden={i !== active}
                fill
                quality={90}
                sizes="(min-width: 1248px) 640px, (min-width: 1024px) 55vw, 100vw"
                style={photo.focus ? { objectPosition: photo.focus } : undefined}
                className={`object-cover transition-opacity duration-500 ease-emphasis ${
                  i === active ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <span
              aria-hidden
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-primary-950/70 text-ink-0 transition-colors duration-300 group-hover:bg-sun group-hover:text-primary-950"
            >
              <ExpandIcon className="h-4 w-4" />
            </span>
          </button>

          <ul className="mt-2.5 grid grid-cols-5 gap-2 sm:mt-3 sm:gap-3">
            {photos.map((photo, i) => (
              <li key={photo.src}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show photo ${i + 1}: ${photo.title}`}
                  aria-pressed={i === active}
                  className={`relative block aspect-[3/2] w-full overflow-hidden rounded-md bg-primary-900 ring-2 ring-offset-2 ring-offset-primary-600 transition duration-300 ${
                    i === active
                      ? "ring-sun"
                      : "opacity-60 ring-transparent hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 1248px) 120px, (min-width: 1024px) 10vw, 20vw"
                    style={photo.focus ? { objectPosition: photo.focus } : undefined}
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* The chosen photo's caption, level with the foot of the strip. */}
        <div className="border-t border-ink-0/15 pt-5 lg:col-span-5 lg:row-start-2 lg:self-end">
          <div className="flex items-center justify-between gap-4">
            <p className="font-display text-meta font-extrabold tabular-nums text-cyan-400">
              {pad(active + 1)} <span className="text-ink-0/50">/ {pad(count)}</span>
            </p>
            <div className="flex gap-2">
              <StepButton label="Previous photo" onClick={() => step(-1)} flip />
              <StepButton label="Next photo" onClick={() => step(1)} />
            </div>
          </div>
          <div aria-live="polite" className="mt-3 min-h-[7.5rem] lg:min-h-[6rem]">
            <p className="text-h4 font-extrabold text-ink-0">{current.title}</p>
            <p className="mt-1 max-w-[46ch] text-body-sm text-ink-0/80">{current.caption}</p>
          </div>
        </div>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A click on the backdrop lands on the dialog element itself.
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
        aria-label={current.title}
        className="on-dark m-auto h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0 text-ink-0 backdrop:bg-primary-950"
      >
        {open ? (
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
                {active + 1} / {count}
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

const pad = (n: number) => String(n).padStart(2, "0");

function StepButton({
  label,
  onClick,
  flip = false,
}: {
  label: string;
  onClick: () => void;
  flip?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full text-ink-0 ring-1 ring-inset ring-ink-0/30 transition-colors hover:bg-sun hover:text-primary-950 hover:ring-sun"
    >
      <ChevronIcon className={`h-4 w-4 ${flip ? "rotate-180" : ""}`} />
    </button>
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
