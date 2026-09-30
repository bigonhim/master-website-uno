"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEVICES, PREVIEW_READY, PREVIEW_UPDATE, type Device, type PreviewView } from "@/lib/studio/preview";

import { cx } from "./ui";

/**
 * The live preview: the site's own components, fed the fields as they are
 * being typed, at a real phone or desktop width and scaled to fit.
 *
 * It is a frame rather than a component in the page because the site's
 * layout answers to the width of the screen. Drawn inside a narrow editor
 * column it would show the phone layout at desktop size; inside a frame of
 * the real width, it is exactly what a visitor will see.
 */
export function DevicePreview({ view, title = "Live preview" }: { view: PreviewView; title?: string }) {
  // Until someone chooses, a narrow editor (a phone) previews the phone view:
  // a desktop page scaled into it would be too small to read.
  const [chosen, setDevice] = useState<Device | null>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(view);

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      { type: PREVIEW_UPDATE, payload: latest.current },
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === PREVIEW_READY) {
        setReady(true);
        send();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  // Every edit, a moment after typing pauses.
  useEffect(() => {
    latest.current = view;
    const timer = window.setTimeout(send, 120);
    return () => window.clearTimeout(timer);
  }, [view, send]);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const device: Device = chosen ?? (width && width < 640 ? "phone" : "desktop");
  const size = DEVICES[device];
  const scale = width ? Math.min(1, width / size.width) : 0;

  return (
    <section aria-label={title} className="rounded-lg bg-ink-0 shadow-xs ring-1 ring-ink-100">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
        <p className="flex items-center gap-2 text-meta font-bold text-primary-900">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          {title}
        </p>
        <div role="group" aria-label="Screen size" className="flex rounded-md bg-ink-50 p-0.5">
          {(Object.keys(DEVICES) as Device[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={device === key}
              onClick={() => setDevice(key)}
              className={cx(
                "rounded px-2.5 py-1 text-caption transition-colors",
                device === key ? "bg-ink-0 text-primary-800 shadow-xs" : "text-ink-600 hover:text-primary-700",
              )}
            >
              {DEVICES[key].label}
            </button>
          ))}
        </div>
      </div>
      <div ref={holder} className="bg-ink-50 p-3">
        <div
          className="relative mx-auto overflow-hidden rounded-md bg-ink-0 shadow-md ring-1 ring-ink-200"
          style={{ width: size.width * scale, height: size.height * scale }}
        >
          {scale ? (
            <iframe
              ref={frame}
              src="/studio/frame"
              title={`${title} (${size.label.toLowerCase()})`}
              className="absolute left-0 top-0 origin-top-left border-0"
              style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}
            />
          ) : null}
          {!ready ? (
            <div className="absolute inset-0 grid place-items-center bg-ink-0/70 text-meta text-ink-600">
              Loading preview…
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
