"use client";

import { useCallback, useEffect, useState } from "react";

import {
  HeartIcon,
  HolyIcon,
  LampIcon,
  RadioIcon,
  RepentIcon,
  ScrollIcon,
} from "@/components/home/icons";

/**
 * The readiness steps as one card in motion, on the Prepare the Way page.
 *
 * Six cards in a grid would double the page; the deck holds them in a single
 * card's footprint, each fading into the next. The timer is the hero
 * slider's: a fill animation whose end advances the deck, so pausing the
 * animation pauses the deck and the bars always show how far along it is.
 * Hover, focus and a hidden tab all pause it; under reduced motion nothing
 * moves unless the visitor asks.
 *
 * The briefs are drawn from the ministry's vision — "The Messiah is coming" —
 * and its mission of preparing the way through repentance and holiness.
 */

const STEPS = [
  {
    title: "Hear the divine alarm",
    body: "The vision stands over everything the ministry does: THE LORD JESUS CHRIST is coming, and the hour is near.",
    reference: "Revelation 16:15",
    icon: ScrollIcon,
  },
  {
    title: "Turn in repentance",
    body: "The call to the nations begins with turning — away from sin, and back to the GOD who made us.",
    reference: "Acts 3:19",
    icon: RepentIcon,
  },
  {
    title: "Receive the Messiah",
    body: "Believe that He died in your place and rose again, and give Him your life. The Salvation Prayer below is the place to begin.",
    reference: "John 1:12",
    icon: HeartIcon,
  },
  {
    title: "Walk in holiness",
    body: "Readiness is a walk, not a moment: a daily life of repentance and holiness before THE LORD.",
    reference: "Hebrews 12:14",
    icon: HolyIcon,
  },
  {
    title: "Keep oil in your lamp",
    body: "Watch like the wise virgins — prayer, the word and fellowship keep the lamp burning for His return.",
    reference: "Matthew 25:4",
    icon: LampIcon,
  },
  {
    title: "Carry the message",
    body: "Through preaching, revivals and broadcasts the ministry calls the world to readiness; carry that call with it.",
    reference: "Matthew 24:14",
    icon: RadioIcon,
  },
];

export function PrepareDeck() {
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);

  const count = STEPS.length;
  const paused = stopped || hovered || focused || hidden;
  const autoplay = !reduced;

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
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label="How to prepare for the coming of the Messiah"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard focus only: a mouse click on a bar also focuses it, and that
      // should not leave the deck paused.
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      {/* All six cards share one cell, so the deck stands as tall as its
          tallest card and nothing below it shifts as they change. */}
      <div className="grid">
        {STEPS.map((step, i) => {
          const active = i === index;
          return (
            <article
              key={step.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`Step ${i + 1} of ${count}`}
              aria-hidden={!active}
              className={`relative flex flex-col overflow-hidden rounded-lg bg-ink-0 p-6 shadow-lg ring-1 ring-ink-100 transition-opacity duration-500 ease-out [grid-area:1/1] sm:p-7 ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-cyan-400" />
              <step.icon
                aria-hidden
                className={`pointer-events-none absolute -bottom-7 -right-7 h-36 w-36 text-primary-50 transition-transform duration-700 ease-emphasis ${
                  active ? "rotate-0 scale-100" : "-rotate-6 scale-90"
                }`}
              />

              <div className="relative flex items-center justify-between gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-grad-azure text-ink-0 shadow-md shadow-primary-700/25">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-h2 tabular-nums text-primary-100">
                  0{i + 1}
                </span>
              </div>

              <h3 className="relative mt-4 text-h4 text-primary-900">{step.title}</h3>
              <p className="relative mt-2 text-body-sm leading-relaxed text-ink-600">
                {step.body}
              </p>
              <p className="relative mt-auto pt-4 text-meta text-ink-500">
                {step.reference}
              </p>
            </article>
          );
        })}
      </div>

      {/* The hero slider's bars, on daylight. */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex flex-1 items-center gap-1.5">
          {STEPS.map((step, i) => {
            const active = i === index;
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show step ${i + 1}: ${step.title}`}
                aria-current={active}
                className="group flex h-6 flex-1 items-center"
              >
                <span className="relative block h-1 w-full overflow-hidden rounded-full bg-ink-100 transition-colors group-hover:bg-ink-200">
                  {active && autoplay ? (
                    <span
                      key={index}
                      onAnimationEnd={() => go(index + 1)}
                      style={{ animationPlayState: paused ? "paused" : "running" }}
                      className="absolute inset-0 origin-left animate-fill bg-primary-700"
                    />
                  ) : active ? (
                    <span className="absolute inset-0 bg-primary-700" />
                  ) : i < index ? (
                    <span className="absolute inset-0 bg-cyan-600/50" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {autoplay ? (
            <DeckButton
              label={stopped ? "Play the steps" : "Pause the steps"}
              onClick={() => setStopped((s) => !s)}
            >
              {stopped ? (
                <path d="M8 5.5v13l11-6.5-11-6.5Z" className="fill-current" />
              ) : (
                <path d="M9 6v12M15 6v12" />
              )}
            </DeckButton>
          ) : null}
          <DeckButton label="Previous step" onClick={() => go(index - 1)}>
            <path d="m14.5 6-6 6 6 6" />
          </DeckButton>
          <DeckButton label="Next step" onClick={() => go(index + 1)}>
            <path d="m9.5 6 6 6-6 6" />
          </DeckButton>
        </div>
      </div>
    </section>
  );
}

function DeckButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-ink-200 bg-ink-0 text-primary-800 transition-colors hover:border-primary-700 hover:bg-primary-700 hover:text-ink-0"
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
