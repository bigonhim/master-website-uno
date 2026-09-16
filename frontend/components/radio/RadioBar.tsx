"use client";

import Link from "next/link";

import { useRadio } from "./RadioProvider";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

/**
 * Pinned to the top of every page.
 *
 * The station has been off air since March 2023, so off-air is the DEFAULT
 * state and has to look deliberate. Rather than a dead control, the bar
 * becomes a route into the archive — which turns the ministry's biggest
 * liability into a way in.
 */
export function RadioBar() {
  const { station, isLive, player, toggle } = useRadio();

  const label =
    player === "connecting"
      ? "Connecting…"
      : player === "error"
        ? "Couldn't connect"
        : isLive
          ? (station.now_playing ?? "Live broadcast")
          : station.offline_message;

  return (
    <div
      className="on-dark sticky z-50 bg-primary-900 shadow-player"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-radio w-full max-w-container items-center gap-3 px-5 sm:px-8 lg:px-12">
        <span className="flex items-center gap-2">
          <span aria-hidden className="relative flex h-2 w-2">
            {isLive ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-400 opacity-75 motion-reduce:hidden" />
            ) : null}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isLive ? "bg-live-400" : "bg-ink-400"
              }`}
            />
          </span>
          <span
            className={`text-caption uppercase tracking-[0.14em] ${
              isLive ? "text-sun" : "text-ink-300"
            }`}
          >
            {isLive ? "On air" : station.status === "unknown" ? "Status unavailable" : "Off air"}
          </span>
        </span>

        {isLive ? (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={player === "playing"}
            aria-label={player === "playing" ? "Stop the radio" : "Listen live"}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500 text-primary-950 transition-colors hover:bg-gold-400"
          >
            {player === "playing" ? <StopIcon /> : <PlayIcon />}
          </button>
        ) : null}

        <p
          className="min-w-0 flex-1 truncate text-body-sm text-ink-200"
          aria-live="polite"
        >
          <span className="sr-only">{station.station_name}: </span>
          {label}
        </p>

        {!isLive ? (
          <Link
            href="/teachings"
            className="shrink-0 text-body-sm font-semibold text-gold-400 underline-offset-4 hover:underline"
          >
            Browse the archive
            <span aria-hidden> →</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
