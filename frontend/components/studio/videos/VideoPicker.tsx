"use client";

/* eslint-disable @next/next/no-img-element -- YouTube thumbnails, already sized. */

import { useEffect, useState } from "react";

import { qs, studio } from "@/lib/studio/client";
import type { Page, Video } from "@/lib/studio/types";

import { Modal } from "../Modal";
import { AvailabilityBadge, Spinner, inputClass } from "../ui";
import { AddVideoForm } from "./AddVideoForm";

/** Choose a video from the library, or paste a new YouTube link. */
export function VideoPicker({
  open,
  onClose,
  onPick,
  exclude,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (video: Video) => void;
  exclude: number[];
}) {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<Video[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const timer = window.setTimeout(() => {
      studio<Page<Video>>(`videos${qs({ q: query, limit: 30 })}`)
        .then((page) => live && setVideos(page.results))
        .catch(() => live && setVideos([]));
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <Modal open={open} onClose={onClose} title="Attach a video">
      <div className="space-y-4">
        <div className="rounded-md bg-ink-25 p-4 ring-1 ring-inset ring-ink-100">
          <p className="mb-2 text-meta font-bold text-ink-800">A new video from YouTube</p>
          <AddVideoForm onAdded={onPick} />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Or search the videos already in the library"
          aria-label="Search videos"
          className={inputClass}
        />
        {videos === null ? (
          <div className="grid place-items-center py-10 text-primary-600">
            <Spinner />
          </div>
        ) : (
          <ul className="divide-y divide-ink-100 rounded-md ring-1 ring-ink-100">
            {videos.map((video) => {
              const attached = exclude.includes(video.id);
              return (
                <li key={video.id}>
                  <button
                    type="button"
                    disabled={attached}
                    onClick={() => onPick(video)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-primary-50/60 disabled:opacity-50"
                  >
                    <img src={video.thumbnail_url} alt="" loading="lazy" className="aspect-video w-24 shrink-0 rounded bg-ink-100 object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm font-bold text-primary-900">{video.title || video.youtube_id}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <AvailabilityBadge availability={video.availability} />
                        {attached ? <span className="text-caption text-ink-500">Already attached</span> : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {!videos.length ? <li className="px-3 py-6 text-center text-body-sm text-ink-600">No videos match.</li> : null}
          </ul>
        )}
      </div>
    </Modal>
  );
}
