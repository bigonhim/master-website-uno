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

function RadioWaves() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

/**
 * Pinned to the top of every page.
 *
 * When the station is not broadcasting the bar carries the station's name and
 * a route into the archive, never an "off air" notice. It still never claims
 * to be live: the play control and "Live" marker appear only when radio.co
 * reports the station on air, and then the bar becomes the player on its own.
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
          : station.schedule_note || "Preparing the way for the LORD";

  return (
    <div
      className="on-dark sticky z-50 bg-primary-900 shadow-player"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-radio w-full max-w-container items-center gap-3 px-5 sm:px-8 lg:px-12">
        {isLive ? (
          <span className="flex items-center gap-2">
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-live-400" />
            </span>
            <span className="text-caption uppercase tracking-[0.14em] text-sun">Live</span>
          </span>
        ) : null}

        <span className="flex shrink-0 items-center gap-2 text-gold-400">
          <RadioWaves />
          <span className="text-caption uppercase tracking-[0.14em]">
            {station.station_name || "Jesus is LORD Radio"}
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

        <p className="min-w-0 flex-1 truncate text-body-sm text-ink-200" aria-live="polite">
          {/* On phones the station name is enough while not broadcasting;
              once live, what is playing matters more than the tagline. */}
          <span aria-hidden className="mr-2 hidden text-ink-400 sm:inline">
            ·
          </span>
          <span className={isLive ? "" : "hidden sm:inline"}>{label}</span>
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
