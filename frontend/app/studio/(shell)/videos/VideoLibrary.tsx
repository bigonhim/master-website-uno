"use client";

/* eslint-disable @next/next/no-img-element -- YouTube thumbnails, already sized. */

import Link from "next/link";
import { useEffect, useState } from "react";

import { Modal } from "@/components/studio/Modal";
import { useToast } from "@/components/studio/Toaster";
import { AddVideoForm } from "@/components/studio/videos/AddVideoForm";
import {
  AvailabilityBadge,
  Badge,
  Button,
  EmptyState,
  Field,
  Notice,
  Spinner,
  Toggle,
  cx,
  inputClass,
} from "@/components/studio/ui";
import { StudioError, qs, studio } from "@/lib/studio/client";
import { formatDate } from "@/lib/studio/format";
import type { Page, Video } from "@/lib/studio/types";

const PAGE = 40;

export function VideoLibrary({
  initialAvailability,
  initialOpen,
  canAdd,
  canChange,
  canDelete,
}: {
  initialAvailability: string;
  initialOpen: number | null;
  canAdd: boolean;
  canChange: boolean;
  canDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState(initialAvailability);
  const [unused, setUnused] = useState(false);
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<Page<Video> | null>(null);
  const [open, setOpen] = useState<number | null>(initialOpen);
  const [reload, setReload] = useState(0);

  const key = JSON.stringify({ q: query, availability, unused, offset, reload });
  // A new search starts from the first page.
  const [filterKey, setFilterKey] = useState(JSON.stringify({ query, availability, unused }));
  const currentFilters = JSON.stringify({ query, availability, unused });
  if (filterKey !== currentFilters) {
    setFilterKey(currentFilters);
    setOffset(0);
  }

  useEffect(() => {
    let live = true;
    const { q, availability: a, unused: u, offset: o } = JSON.parse(key);
    const timer = window.setTimeout(() => {
      studio<Page<Video>>(`videos${qs({ q, availability: a, unused: u, limit: PAGE, offset: o })}`)
        .then((p) => live && setPage(p))
        .catch(() => live && setPage({ count: 0, next: null, previous: null, results: [] }));
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [key]);

  const replace = (video: Video) =>
    setPage((p) => (p ? { ...p, results: p.results.map((v) => (v.id === video.id ? { ...v, ...video } : v)) } : p));

  return (
    <div className="space-y-5">
      {canAdd ? (
        <div className="rounded-lg bg-ink-0 p-5 shadow-xs ring-1 ring-ink-100">
          <AddVideoForm
            onAdded={(video) => {
              if (video.duplicate) setOpen(video.id);
              else setReload((n) => n + 1);
            }}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg bg-ink-0 p-4 shadow-xs ring-1 ring-ink-100 lg:flex-row lg:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or video id"
          aria-label="Search videos"
          className={cx(inputClass, "lg:max-w-sm")}
        />
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          aria-label="On YouTube"
          className={cx(inputClass, "lg:max-w-[14rem]")}
        >
          <option value="">Any status</option>
          <option value="available">On YouTube</option>
          <option value="unavailable">Deleted on YouTube</option>
          <option value="unknown">Not checked</option>
        </select>
        <div className="lg:ml-auto">
          <Toggle checked={unused} onChange={setUnused} label="Not attached to anything" />
        </div>
      </div>

      {page === null ? (
        <div className="grid place-items-center py-20 text-primary-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : page.results.length === 0 ? (
        <EmptyState title="No videos here">
          {query || availability || unused ? "Try a different search or filter." : "Paste a YouTube link above to add the first."}
        </EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-ink-100 overflow-hidden rounded-lg bg-ink-0 shadow-xs ring-1 ring-ink-100">
            {page.results.map((video) => (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => setOpen(video.id)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-primary-50/60"
                >
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-28 shrink-0 rounded bg-ink-100 object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm font-bold text-primary-900">
                      {video.title || video.youtube_id}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <AvailabilityBadge availability={video.availability} />
                      {video.usage_count ? (
                        <Badge tone="info">In {video.usage_count} item{video.usage_count === 1 ? "" : "s"}</Badge>
                      ) : (
                        <Badge>Not attached</Badge>
                      )}
                      <span className="text-caption text-ink-500">{video.youtube_id}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between text-meta text-ink-600">
            <span>
              {offset + 1}–{offset + page.results.length} of {page.count}
            </span>
            <span className="flex gap-2">
              <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                Previous
              </Button>
              <Button size="sm" disabled={!page.next} onClick={() => setOffset(offset + PAGE)}>
                Next
              </Button>
            </span>
          </div>
        </>
      )}

      <VideoEditor
        videoId={open}
        onClose={() => setOpen(null)}
        onSaved={replace}
        onDeleted={() => {
          setOpen(null);
          setReload((n) => n + 1);
        }}
        canChange={canChange}
        canDelete={canDelete}
      />
    </div>
  );
}

function VideoEditor({
  videoId,
  onClose,
  onSaved,
  onDeleted,
  canChange,
  canDelete,
}: {
  videoId: number | null;
  onClose: () => void;
  onSaved: (video: Video) => void;
  onDeleted: () => void;
  canChange: boolean;
  canDelete: boolean;
}) {
  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState("");
  const [allowEmbed, setAllowEmbed] = useState(true);
  const [busy, setBusy] = useState<"" | "save" | "check" | "delete">("");
  const [problem, setProblem] = useState("");
  const toast = useToast();

  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  if (loadedFor !== videoId) {
    setLoadedFor(videoId);
    setVideo(null);
    setProblem("");
  }

  useEffect(() => {
    if (videoId === null) return;
    let live = true;
    studio<Video>(`videos/${videoId}`)
      .then((v) => {
        if (!live) return;
        setVideo(v);
        setTitle(v.title);
        setAllowEmbed(v.allow_embed);
      })
      .catch((e) => live && setProblem(e.message));
    return () => {
      live = false;
    };
  }, [videoId]);

  const dirty = Boolean(video && (title !== video.title || allowEmbed !== video.allow_embed));

  async function run(kind: "save" | "check" | "delete") {
    if (!video) return;
    if (kind === "delete" && !window.confirm("Remove this video from the library?")) return;
    setBusy(kind);
    setProblem("");
    try {
      if (kind === "delete") {
        await studio(`videos/${video.id}`, { method: "DELETE" });
        toast("Video removed.");
        onDeleted();
        return;
      }
      const saved =
        kind === "save"
          ? await studio<Video>(`videos/${video.id}`, {
              method: "PATCH",
              body: { title, allow_embed: allowEmbed },
              version: video.version,
            })
          : await studio<Video>(`videos/${video.id}/check`, { method: "POST" });
      setVideo((v) => (v ? { ...v, ...saved } : v));
      setTitle(saved.title);
      setAllowEmbed(saved.allow_embed);
      onSaved(saved);
      toast(kind === "save" ? "Video saved." : "Checked with YouTube.");
    } catch (error) {
      setProblem(error instanceof StudioError ? error.message : "Something went wrong.");
    } finally {
      setBusy("");
    }
  }

  const inUse = (video?.usage?.length ?? 0) > 0;

  return (
    <Modal
      open={videoId !== null}
      onClose={onClose}
      title={video?.title || video?.youtube_id || "Video"}
      footer={
        video ? (
          <>
            {canDelete ? (
              <Button
                variant="danger"
                className="mr-auto"
                busy={busy === "delete"}
                disabled={inUse}
                title={inUse ? "Detach it from its archive items first." : undefined}
                onClick={() => run("delete")}
              >
                Remove
              </Button>
            ) : null}
            {canChange ? (
              <Button busy={busy === "check"} onClick={() => run("check")}>
                Check with YouTube
              </Button>
            ) : null}
            {canChange ? (
              <Button variant="primary" busy={busy === "save"} disabled={!dirty} onClick={() => run("save")}>
                Save
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {!video ? (
        problem ? (
          <Notice tone="danger">{problem}</Notice>
        ) : (
          <div className="grid place-items-center py-16 text-primary-600">
            <Spinner className="h-6 w-6" />
          </div>
        )
      ) : (
        <div className="space-y-5">
          {problem ? <Notice tone="danger">{problem}</Notice> : null}
          <div className="aspect-video overflow-hidden rounded-md bg-ink-900">
            {video.availability === "unavailable" ? (
              <div className="grid h-full place-items-center p-6 text-center text-body-sm text-ink-0/80">
                YouTube no longer has this video. Anything that plays it shows visitors an
                &ldquo;unavailable&rdquo; note instead.
              </div>
            ) : (
              <iframe
                src={video.embed_url}
                title={video.title || "Video"}
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-meta text-ink-600">
            <AvailabilityBadge availability={video.availability} />
            {video.last_checked_at ? <span>Checked {formatDate(video.last_checked_at, true)}</span> : null}
            <a href={video.watch_url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-700 underline underline-offset-2">
              Open on YouTube<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <Field label="Title" htmlFor="video-title" help="As staff see it here. The archive item carries the title visitors see.">
            <input
              id="video-title"
              value={title}
              disabled={!canChange}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Toggle
            checked={allowEmbed}
            disabled={!canChange}
            onChange={setAllowEmbed}
            label="Play it on the site"
            description="Turn off to link out to YouTube instead of embedding the player."
          />
          <div className="rounded-md bg-ink-25 p-4 ring-1 ring-inset ring-ink-100">
            <p className="text-meta font-bold text-ink-800">Attached to</p>
            {video.usage?.length ? (
              <ul className="mt-2 space-y-1">
                {video.usage.map((use) => (
                  <li key={use.id} className="text-meta">
                    <span className="text-ink-500">{use.type}: </span>
                    <Link href={`/studio/archive/${use.id}`} className="font-bold text-primary-700 hover:underline">
                      {use.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-meta text-ink-600">No archive item plays it yet.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
