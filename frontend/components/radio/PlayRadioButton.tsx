"use client";

import Link from "next/link";

import { useRadio } from "./RadioProvider";

/**
 * The island any server-rendered page drops in to start the stream.
 *
 * When the station is not broadcasting this becomes a route into the teaching
 * archive rather than a dead control. It turns into the play button on its
 * own once radio.co reports the station live.
 */
export function PlayRadioButton({ label = "Listen live" }: { label?: string }) {
  const { isLive, player, toggle, station } = useRadio();

  if (!isLive) {
    return (
      <Link
        href="/teachings"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-ink-200 px-5 font-display text-body font-semibold text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 [.on-dark_&]:border-ink-0/25 [.on-dark_&]:text-ink-0 [.on-dark_&]:hover:bg-ink-0/10"
      >
        Listen to the teachings
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={player === "playing"}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-alert-600 px-5 font-display text-body-sm font-black uppercase tracking-wide text-sun transition-colors hover:bg-danger"
    >
      {player === "playing" ? "Stop" : label}
      <span className="sr-only"> — {station.station_name}</span>
    </button>
  );
}
