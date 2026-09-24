"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { PlaceTag } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";
import type { HeroSlide } from "@/lib/hero-slides";

/**
 * The home hero: photos of the ministry across the nations fill it, held back
 * under navy, and the call (children) sits over them.
 *
 * These are documentary pictures, crowded and loud, so the words are not left
 * to fight them. A wash of navy lies over the whole photo, deepening behind
 * the words on the left and under the caption at the foot; the photo reads as
 * the scene the words are spoken into rather than as a second headline. Every
 * photo used has its subject right of centre (see lib/hero-slides), clear of
 * the words. The photo is sharp everywhere: blur under text reads as a smear.
 *
 * Each photo sits in a .hero-box (globals.css), placed by the slide's `frame`,
 * so its subject stays in view from a phone to a wide screen. On phones the
 * photo is a band at the top that runs down into the navy, and the words sit
 * below it.
 *
 * Each photo carries its own caption, so the words fade with the picture. The
 * fade is short and the photo is never scaled: a long crossfade holds two
 * photos half-visible over each other, and any zoom resamples the image; both
 * read as blur.
 *
 * The timer is the progress bar under the active dot: a CSS animation whose
 * end advances the slide. Pausing is therefore one flag, animation-play-state,
 * and the bar always shows exactly how long is left. Under reduced motion the
 * bar is not rendered, so nothing moves unless the visitor asks it to.
 */
export function HeroSlider({ slides, children }: { slides: HeroSlide[]; children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  const count = slides.length;
  const paused = stopped || hovered || focused || hidden;
  const autoplay = !reduced && count > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const go = useCallback(
    (next: number) => {
      const target = (next + count) % count;
      if (target === index) return;
      setIndex(target);
    },
    [count, index],
  );

  const fade = (active: boolean) =>
    `transition-opacity duration-500 ease-out ${active ? "opacity-100" : "opacity-0"}`;

  return (
    <div
      className="relative isolate"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* The photos: a band on phones, the whole hero on wide screens. */}
      <div className="absolute inset-x-0 top-0 -z-10 aspect-square overflow-hidden [container-type:size] sm:aspect-[16/10] lg:inset-0 lg:aspect-auto">
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            aria-hidden={i !== index}
            className={`absolute inset-0 ${fade(i === index)}`}
          >
            <div
              className="hero-box"
              style={
                {
                  "--fx": slide.frame.x,
                  "--fy": slide.frame.y,
                  "--fx-lg": slide.frameLg.x,
                  "--fy-lg": slide.frameLg.y,
                } as CSSProperties
              }
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                quality={90}
                priority={i === 0}
                sizes="100vw"
                className="object-cover saturate-[.8]"
              />
            </div>
          </div>
        ))}

        {/* The overlay: navy over everything, then deeper behind the words
            (the foot of the band on phones, the left on wide screens) and
            under the controls. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-primary-950/45" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgb(var(--c-primary-950))_100%)] lg:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(var(--c-primary-950)/0.9)_0%,rgb(var(--c-primary-950)/0.7)_32%,rgb(var(--c-primary-950)/0.25)_58%,transparent_78%)] lg:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-56 bg-gradient-to-t from-primary-950/80 to-transparent lg:block"
        />
      </div>

      {children}

      {/* Caption and controls: under the words on phones, at the foot of the
          photo on wide screens. */}
      <section
        aria-roledescription="carousel"
        aria-label="The ministry across the nations"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        // Keyboard focus only: a mouse click on a dot also focuses it, and that
        // should not leave the slider paused.
        onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(index - 1);
          if (e.key === "ArrowRight") go(index + 1);
        }}
        className="pb-8 pt-10 lg:absolute lg:inset-x-0 lg:bottom-0 lg:pb-10 lg:pt-0"
      >
        <Container>
          <div className="lg:ml-auto lg:w-[42%]">
            <div className="grid">
              {slides.map((slide, i) => (
                <div
                  key={slide.src}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={i !== index}
                  className={`flex flex-col items-start gap-1.5 [grid-area:1/1] ${fade(i === index)}`}
                >
                  <PlaceTag name={slide.place} detail={slide.detail} />
                  <span className="bg-primary-950/85 px-2.5 py-1 text-caption font-black uppercase tracking-wide text-ink-0">
                    {slide.event}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex flex-1 items-center gap-1.5">
                {slides.map((slide, i) => {
                  const active = i === index;
                  return (
                    <button
                      key={slide.src}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`Show photo ${i + 1}: ${slide.place}, ${slide.event}`}
                      aria-current={active}
                      className="group flex h-6 flex-1 items-center"
                    >
                      <span className="relative block h-1 w-full overflow-hidden rounded-full bg-ink-0/25 transition-colors group-hover:bg-ink-0/50">
                        {active && autoplay ? (
                          <span
                            key={index}
                            onAnimationEnd={() => go(index + 1)}
                            style={{ animationPlayState: paused ? "paused" : "running" }}
                            className="absolute inset-0 origin-left animate-fill bg-sun"
                          />
                        ) : active ? (
                          <span className="absolute inset-0 bg-sun" />
                        ) : i < index ? (
                          <span className="absolute inset-0 bg-cyan-400/70" />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {autoplay ? (
                  <ControlButton
                    label={stopped ? "Play slideshow" : "Pause slideshow"}
                    onClick={() => setStopped((s) => !s)}
                  >
                    {stopped ? (
                      <path d="M8 5.5v13l11-6.5-11-6.5Z" className="fill-current" />
                    ) : (
                      <path d="M9 6v12M15 6v12" />
                    )}
                  </ControlButton>
                ) : null}
                <ControlButton label="Previous photo" onClick={() => go(index - 1)}>
                  <path d="m14.5 6-6 6 6 6" />
                </ControlButton>
                <ControlButton label="Next photo" onClick={() => go(index + 1)}>
                  <path d="m9.5 6 6 6-6 6" />
                </ControlButton>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-ink-0/30 bg-primary-950/40 text-ink-0 backdrop-blur-sm transition-colors hover:border-sun hover:bg-sun hover:text-primary-950"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4 fill-none stroke-current stroke-[2.5]"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
