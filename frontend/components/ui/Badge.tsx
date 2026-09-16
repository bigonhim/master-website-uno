import type { ReactNode } from "react";

type Tone = "neutral" | "draft" | "published" | "fulfilled" | "pending" | "danger" | "live" | "offair";

/**
 * A small status marker.
 *
 * Semantic colour is kept separate from the brand accent, so "this needs
 * attention" never depends on the reader knowing the palette. Note `live` and
 * `offair`: off air is grey, never red — it is a normal state, not a fault.
 */
const tones: Record<Tone, string> = {
  neutral: "bg-ink-50 text-ink-600 ring-ink-200",
  draft: "bg-ink-50 text-ink-600 ring-ink-300",
  published: "bg-primary-50 text-primary-700 ring-primary-200",
  fulfilled: "bg-[rgb(230_246_240)] text-success ring-success/30",
  pending: "bg-[rgb(253_244_224)] text-gold-800 ring-gold-500/40",
  danger: "bg-[rgb(253_236_234)] text-danger ring-danger/30",
  live: "bg-live-600 text-ink-0 ring-live-600",
  offair: "bg-ink-100 text-ink-600 ring-ink-200",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
}: {
  tone?: Tone;
  /** Adds a leading dot; pulses only for `live`. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption " +
        `uppercase ring-1 ring-inset ${tones[tone]} ${className}`
      }
    >
      {dot ? (
        <span aria-hidden className="relative flex h-1.5 w-1.5">
          {tone === "live" ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75 motion-reduce:hidden" />
          ) : null}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}
