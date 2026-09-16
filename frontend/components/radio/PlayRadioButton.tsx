"use client";

import Link from "next/link";

import { useRadio } from "./RadioProvider";

/**
 * The island any server-rendered page drops in to start the stream.
 *
 * When the station is off air this becomes a route into the archive rather
 * than a dead control — which is the whole design response to a station that
 * has not broadcast since March 2023.
 */
export function PlayRadioButton({ label = "Listen live" }: { label?: string }) {
  const { isLive, player, toggle, station } = useRadio();

  if (!isLive) {
    return (
      <div className="flex flex-col gap-1">
        <Link
          href="/prophecies"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-ink-200 px-5 font-display text-body font-semibold text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 [.on-dark_&]:border-ink-0/25 [.on-dark_&]:text-ink-0 [.on-dark_&]:hover:bg-ink-0/10"
        >
          Browse the archive
        </Link>
        <span className="text-caption text-ink-500 [.on-dark_&]:text-ink-300">
          Radio is off air
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={player === "playing"}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gold-500 px-5 font-display text-body font-semibold text-primary-950 transition-colors hover:bg-gold-400"
    >
      {player === "playing" ? "Stop" : label}
      <span className="sr-only"> — {station.station_name}</span>
    </button>
  );
}
