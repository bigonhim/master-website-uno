"use client";

import { useRef, useState, type DragEvent } from "react";

import { StudioError, studio } from "@/lib/studio/client";
import type { Asset } from "@/lib/studio/types";

import { useToast } from "../Toaster";
import { Spinner, cx } from "../ui";

type Upload = { name: string; state: "waiting" | "uploading" | "done" | "failed"; message?: string };

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Drop photos here, or choose them. They go up one at a time (a phone on a
 * slow connection sending ten at once would stall all ten) and each is
 * optimised on the server as it arrives.
 */
export function Uploader({
  onUploaded,
  collection = "",
  compact = false,
}: {
  onUploaded: (asset: Asset) => void;
  collection?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const toast = useToast();
  const busy = uploads.some((u) => u.state === "uploading" || u.state === "waiting");

  async function send(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(f.name));
    if (!images.length) return;
    setUploads(images.map((f) => ({ name: f.name, state: "waiting" })));
    let added = 0;
    for (const [index, file] of images.entries()) {
      const mark = (patch: Partial<Upload>) =>
        setUploads((all) => all.map((u, i) => (i === index ? { ...u, ...patch } : u)));
      mark({ state: "uploading" });
      const form = new FormData();
      form.append("file", file);
      if (collection) form.append("collection", collection);
      try {
        const asset = await studio<Asset>("media", { body: form });
        mark({ state: "done", message: asset.duplicate ? "Already in the library" : undefined });
        onUploaded(asset);
        added += 1;
      } catch (error) {
        const message =
          error instanceof StudioError
            ? (error.fieldErrors.file ?? error.message)
            : "Upload failed.";
        mark({ state: "failed", message });
      }
    }
    if (added) toast(`${added} photo${added === 1 ? "" : "s"} added to the library.`);
    window.setTimeout(() => setUploads((all) => all.filter((u) => u.state === "failed")), 3000);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (!busy) void send(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cx(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors",
          compact ? "px-4 py-5" : "px-6 py-10",
          over ? "border-primary-400 bg-primary-50" : "border-ink-200 bg-ink-0",
        )}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-primary-400 stroke-[1.6]" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />
        </svg>
        <p className="text-body-sm font-bold text-primary-900">
          Drop photos here or{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="text-primary-600 underline underline-offset-2 hover:text-primary-800"
          >
            choose from your device
          </button>
        </p>
        <p className="text-meta text-ink-600">
          JPEG, PNG or WebP, up to 25 MB. Resized to 2560px and stripped of location data.
        </p>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            void send(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length ? (
        <ul className="mt-3 space-y-1.5" aria-live="polite">
          {uploads.map((u, i) => (
            <li key={`${i}-${u.name}`} className="flex items-center gap-2 text-meta">
              {u.state === "uploading" ? (
                <Spinner className="h-3.5 w-3.5 text-primary-600" />
              ) : (
                <span
                  aria-hidden
                  className={cx(
                    "h-2 w-2 rounded-full",
                    u.state === "done" && "bg-success",
                    u.state === "failed" && "bg-danger",
                    u.state === "waiting" && "bg-ink-300",
                  )}
                />
              )}
              <span className="truncate font-semibold text-ink-800">{u.name}</span>
              <span className={u.state === "failed" ? "text-danger" : "text-ink-500"}>
                {u.message ??
                  { waiting: "Waiting", uploading: "Uploading…", done: "Added", failed: "Failed" }[u.state]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
