"use client";

/* eslint-disable @next/next/no-img-element -- the picker needs the photo's
   natural layout to map a click to a point; next/image's wrappers get in the
   way and there is nothing to optimise in the editor. */

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

export type Point = { x: number; y: number };

const clamp = (v: number) => Math.min(1, Math.max(0, Math.round(v * 1000) / 1000));

/**
 * Pick the point of a photo that must stay in view however it is cropped.
 * Click or drag on the photo; arrow keys nudge it (Shift for bigger steps).
 */
export function FocalPicker({
  src,
  alt,
  value,
  onChange,
  label = "Focal point",
}: {
  src: string;
  alt: string;
  value: Point;
  onChange: (point: Point) => void;
  label?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    onChange({
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    });
  };

  const nudge = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: value.x - step, y: value.y },
      ArrowRight: { x: value.x + step, y: value.y },
      ArrowUp: { x: value.x, y: value.y - step },
      ArrowDown: { x: value.x, y: value.y + step },
    };
    const next = moves[e.key];
    if (!next) return;
    e.preventDefault();
    onChange({ x: clamp(next.x), y: clamp(next.y) });
  };

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={label}
      // A point has two values; the across one is given as the slider's
      // value, and the text says both.
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value.x * 100)}
      aria-valuetext={`${Math.round(value.x * 100)}% across, ${Math.round(value.y * 100)}% down`}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e);
      }}
      onPointerMove={(e) => dragging.current && pick(e)}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onKeyDown={nudge}
      className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-md bg-ink-900 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <img src={src} alt={alt} draggable={false} className="block h-auto w-full" />
      {/* Rule-of-thirds guides through the chosen point. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px bg-ink-0/60"
        style={{ left: `${value.x * 100}%` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-px bg-ink-0/60"
        style={{ top: `${value.y * 100}%` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-sun bg-primary-950/30 shadow-[0_0_0_2px_rgb(4_8_31/0.6)]"
        style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
      />
    </div>
  );
}

/** How the photo crops at a given shape around a point. */
export function CropPreview({
  src,
  point,
  aspect,
  label,
}: {
  src: string;
  point: Point;
  aspect: string;
  label: string;
}) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-md bg-ink-900 ring-1 ring-ink-200" style={{ aspectRatio: aspect }}>
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: `${point.x * 100}% ${point.y * 100}%` }}
        />
      </div>
      <figcaption className="mt-1 text-caption text-ink-600">{label}</figcaption>
    </figure>
  );
}
