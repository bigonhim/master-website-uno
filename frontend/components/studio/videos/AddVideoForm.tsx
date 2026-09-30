"use client";

import { useState, type FormEvent } from "react";

import { StudioError, studio } from "@/lib/studio/client";
import type { Video } from "@/lib/studio/types";

import { useToast } from "../Toaster";
import { Button, inputClass } from "../ui";

/** Paste a YouTube link; the title is fetched from YouTube. */
export function AddVideoForm({ onAdded, autoFocus = false }: { onAdded: (video: Video) => void; autoFocus?: boolean }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError("");
    try {
      const video = await studio<Video>("videos", { body: { url } });
      toast(video.duplicate ? "That video is already in the library." : `Added “${video.title || video.youtube_id}”.`, video.duplicate ? "info" : "success");
      setUrl("");
      onAdded(video);
    } catch (err) {
      setError(err instanceof StudioError ? (err.fieldErrors.url ?? err.message) : "Couldn't add the video.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="video-url" className="sr-only">
          YouTube link
        </label>
        <input
          id="video-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube link, e.g. https://youtu.be/…"
          autoFocus={autoFocus}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "video-url-error" : undefined}
          className={inputClass}
        />
        {error ? (
          <p id="video-url-error" role="alert" className="mt-1.5 text-meta font-semibold text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="primary" busy={busy}>
        Add video
      </Button>
    </form>
  );
}
