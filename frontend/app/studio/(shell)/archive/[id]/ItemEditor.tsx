"use client";

/* eslint-disable @next/next/no-img-element -- YouTube thumbnails, already sized. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { HistoryPanel } from "@/components/studio/HistoryPanel";
import { useSaveShortcut, useUnsavedChanges } from "@/components/studio/hooks";
import { SortableList } from "@/components/studio/SortableList";
import { useToast } from "@/components/studio/Toaster";
import { VideoPicker } from "@/components/studio/videos/VideoPicker";
import {
  AvailabilityBadge,
  Button,
  Field,
  Notice,
  Panel,
  StateBadge,
  Toggle,
  buttonClass,
  cx,
  inputClass,
} from "@/components/studio/ui";
import { StudioError, studio } from "@/lib/studio/client";
import { KIND_LABELS, formatDate, fromLocalInput, toLocalInput } from "@/lib/studio/format";
import type { AttachedVideo, Item, ItemFields, Taxonomy } from "@/lib/studio/types";

const FIELDS: (keyof ItemFields)[] = [
  "kind", "title", "slug", "kicker", "speaker", "summary", "body", "category", "regions", "series",
  "position_in_series", "published_at", "prophecy_date", "date_source", "date_precision", "is_fulfilled",
  "fulfillment_summary", "condition", "is_anonymous", "is_featured", "needs_review", "videos",
];

function pick(source: ItemFields): ItemFields {
  return Object.fromEntries(FIELDS.map((k) => [k, source[k]])) as unknown as ItemFields;
}

function payload(form: ItemFields) {
  return {
    ...pick(form),
    videos: form.videos.map((v) => ({ video: v.video, label: v.label, is_primary: v.is_primary })),
  };
}

const same = (a: ItemFields, b: ItemFields) => JSON.stringify(payload(a)) === JSON.stringify(payload(b));

export function ItemEditor({
  item: initialItem,
  initial,
  taxonomy,
  canChange,
  canDelete,
}: {
  item: Item | null;
  initial: ItemFields;
  taxonomy: Taxonomy;
  canChange: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [item, setItem] = useState<Item | null>(initialItem);
  const [form, setForm] = useState<ItemFields>(pick(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [conflict, setConflict] = useState<Item | null>(null);
  const [busy, setBusy] = useState<"" | "save" | "publish" | "unpublish" | "delete">("");
  const [picking, setPicking] = useState(false);
  const [regionFilter, setRegionFilter] = useState("");
  const [historyKey, setHistoryKey] = useState(0);

  const dirty = !same(form, item ? pick(item) : pick(initial)) || !item;
  useUnsavedChanges(Boolean(item) && dirty);

  const set = <K extends keyof ItemFields>(key: K, value: ItemFields[K]) => setForm((f) => ({ ...f, [key]: value }));
  const deadVideos = form.videos.filter((v) => v.availability === "unavailable");
  const label = KIND_LABELS[form.kind];
  const state = item?.state ?? "draft";
  const scheduledFor = form.published_at && new Date(form.published_at) > new Date() ? form.published_at : null;

  const fail = useCallback((error: unknown) => {
    if (error instanceof StudioError) {
      if (error.status === 409 && error.data.current) setConflict(error.data.current as Item);
      setErrors(error.fieldErrors);
      setProblem(error.message);
    } else {
      setProblem("Something went wrong. Try again.");
    }
  }, []);

  /** Saves the form; returns the saved item, or null if it didn't save. */
  const save = useCallback(async (): Promise<Item | null> => {
    if (!canChange || busy) return null;
    setErrors({});
    setProblem("");
    try {
      const saved = item
        ? await studio<Item>(`items/${item.id}`, { method: "PUT", body: payload(form), version: item.version })
        : await studio<Item>("items", { body: payload(form) });
      setItem(saved);
      setForm(pick(saved));
      setConflict(null);
      setHistoryKey((n) => n + 1);
      if (!item) router.replace(`/studio/archive/${saved.id}`);
      return saved;
    } catch (error) {
      fail(error);
      return null;
    }
  }, [canChange, busy, item, form, router, fail]);

  const saveClicked = useCallback(async () => {
    if (!dirty) return;
    setBusy("save");
    const saved = await save();
    setBusy("");
    if (saved) {
      toast(
        saved.state === "published"
          ? "Saved. The live page is updated."
          : saved.state === "scheduled"
            ? `Saved. It goes live ${formatDate(saved.published_at, true)}.`
            : "Draft saved. It isn't on the site until it's published.",
      );
    }
  }, [dirty, save, toast]);

  useSaveShortcut(saveClicked, dirty && canChange);

  async function publish(mode: "now" | "schedule") {
    setBusy("publish");
    const saved = dirty ? await save() : item;
    if (!saved) {
      setBusy("");
      return;
    }
    try {
      const body =
        mode === "schedule"
          ? { published_at: form.published_at }
          : { published_at: saved.published_at && new Date(saved.published_at) > new Date() ? new Date().toISOString() : null };
      const result = await studio<Item>(`items/${saved.id}/publish`, { body });
      setItem(result);
      setForm(pick(result));
      setHistoryKey((n) => n + 1);
      toast(result.state === "scheduled" ? `Scheduled for ${formatDate(result.published_at, true)}.` : "Published. It's on the site now.");
    } catch (error) {
      fail(error);
    } finally {
      setBusy("");
    }
  }

  async function unpublish() {
    if (!item || !window.confirm("Take this off the site? It stays here as a draft.")) return;
    setBusy("unpublish");
    try {
      const result = await studio<Item>(`items/${item.id}/unpublish`, { method: "POST" });
      setItem(result);
      setForm(pick(result));
      setHistoryKey((n) => n + 1);
      toast("Returned to draft. It's off the site.");
    } catch (error) {
      fail(error);
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!item || !window.confirm(`Delete “${item.title}” for good? This can't be undone.`)) return;
    setBusy("delete");
    try {
      await studio(`items/${item.id}`, { method: "DELETE" });
      toast("Deleted.");
      router.push(`/studio/archive?kind=${item.kind}`);
    } catch (error) {
      fail(error);
      setBusy("");
    }
  }

  const setVideos = (videos: AttachedVideo[]) => set("videos", videos);
  const regions = useMemo(
    () => taxonomy.regions.filter((r) => r.name.toLowerCase().includes(regionFilter.toLowerCase())),
    [taxonomy.regions, regionFilter],
  );

  return (
    <div className="space-y-6">
      {/* Status and actions, always in reach. */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-3 rounded-lg bg-ink-0/95 px-4 py-3 shadow-sm ring-1 ring-ink-100 backdrop-blur lg:top-2">
        <StateBadge state={state} />
        {state === "scheduled" ? <span className="text-meta text-ink-600">Goes live {formatDate(item?.published_at, true)}</span> : null}
        {item && dirty ? <span className="text-meta font-semibold text-gold-800">Unsaved changes</span> : null}
        <div className="ml-auto flex flex-wrap gap-2">
          {item ? (
            <Link href={`/preview/${item.id}`} target="_blank" className={buttonClass("ghost")}
              title={dirty ? "Shows the last saved version" : undefined}>
              Preview<span className="sr-only"> (opens in a new tab)</span>
            </Link>
          ) : null}
          {item?.state === "published" && item.public_path ? (
            <Link href={item.public_path} target="_blank" className={buttonClass("ghost")}>
              View live<span className="sr-only"> (opens in a new tab)</span>
            </Link>
          ) : null}
          {canChange ? (
            <Button busy={busy === "save"} disabled={Boolean(item) && !dirty} onClick={saveClicked}>
              {!item ? "Save draft" : state === "published" ? "Update live page" : "Save"}
            </Button>
          ) : null}
          {canChange && item && state !== "draft" ? (
            <Button variant="danger" busy={busy === "unpublish"} onClick={unpublish}>
              Unpublish
            </Button>
          ) : null}
          {canChange && state !== "published" ? (
            scheduledFor && state === "draft" ? (
              <Button variant="success" busy={busy === "publish"} disabled={deadVideos.length > 0} onClick={() => publish("schedule")}>
                Schedule for {formatDate(scheduledFor, true)}
              </Button>
            ) : (
              <Button variant="success" busy={busy === "publish"} disabled={deadVideos.length > 0} onClick={() => publish("now")}>
                {state === "scheduled" ? "Publish now instead" : "Publish now"}
              </Button>
            )
          ) : null}
        </div>
      </div>

      {conflict ? (
        <Notice tone="warning">
          Someone else saved this while you were editing.{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => {
            setItem(conflict);
            setForm(pick(conflict));
            setConflict(null);
            setProblem("");
          }}>
            Load their version
          </button>{" "}
          (replaces your edits), or copy what you need first.
        </Notice>
      ) : problem ? (
        <Notice tone="danger">{problem}</Notice>
      ) : null}
      {deadVideos.length ? (
        <Notice tone="danger">
          {deadVideos.length === 1 ? "A video here has" : `${deadVideos.length} videos here have`} been deleted on YouTube.
          Remove or replace {deadVideos.length === 1 ? "it" : "them"} before publishing.
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Panel title={label.one}>
            <div className="space-y-4">
              <Field label="Title" htmlFor="title" error={errors.title} count={[form.title.length, 500]}>
                <textarea id="title" rows={2} className={cx(inputClass, "text-body font-bold")} value={form.title}
                  onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Lead-in" htmlFor="kicker" error={errors.kicker} help='The small line above the title, e.g. "Prophecy of"'>
                  <input id="kicker" className={inputClass} value={form.kicker} maxLength={80} onChange={(e) => set("kicker", e.target.value)} />
                </Field>
                <Field label="Speaker" htmlFor="speaker" error={errors.speaker}>
                  <input id="speaker" className={inputClass} value={form.speaker} maxLength={200} onChange={(e) => set("speaker", e.target.value)} />
                </Field>
              </div>
              <Field label="Summary" htmlFor="summary" error={errors.summary} help="Shown on the archive's cards. Two or three sentences.">
                <textarea id="summary" rows={3} className={inputClass} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
              </Field>
              <Field label="Full text" htmlFor="body" error={errors.body} help="The transcript or written text. Line breaks are kept as typed.">
                <textarea id="body" rows={14} className={cx(inputClass, "leading-relaxed")} value={form.body} onChange={(e) => set("body", e.target.value)} />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Videos"
            description="The recordings, in the order they play. The primary one is used on cards."
            actions={canChange ? <Button size="sm" variant="primary" onClick={() => setPicking(true)}>Attach a video</Button> : null}
          >
            {errors.videos ? <Notice tone="danger" className="mb-3">{errors.videos}</Notice> : null}
            {form.videos.length ? (
              <SortableList
                items={form.videos}
                getKey={(v) => v.video}
                label={(v, i) => `video ${i + 1}`}
                onReorder={setVideos}
                renderItem={(v, index) => (
                  <div className="flex flex-wrap items-center gap-3 p-2.5">
                    <img src={v.thumbnail_url} alt="" className={cx("aspect-video w-28 shrink-0 rounded bg-ink-100 object-cover", v.availability === "unavailable" && "opacity-40 grayscale")} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-body-sm font-bold text-primary-900">{v.title || v.youtube_id}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <AvailabilityBadge availability={v.availability} />
                        <label className="flex items-center gap-1.5 text-meta font-semibold text-ink-700">
                          <input type="radio" name="primary-video" checked={v.is_primary}
                            onChange={() => setVideos(form.videos.map((x, i) => ({ ...x, is_primary: i === index })))}
                            className="accent-primary-600" />
                          Primary
                        </label>
                      </div>
                      <input aria-label={`Label for video ${index + 1}`} placeholder={`Label, e.g. Part ${index + 1}`} className={cx(inputClass, "max-w-xs py-1.5")}
                        value={v.label} maxLength={40}
                        onChange={(e) => setVideos(form.videos.map((x, i) => (i === index ? { ...x, label: e.target.value } : x)))} />
                    </div>
                    <button type="button" onClick={() => setVideos(form.videos.filter((_, i) => i !== index))}
                      className="rounded p-1.5 text-ink-500 hover:bg-[rgb(253_236_234)] hover:text-danger">
                      <span className="sr-only">Detach video {index + 1}</span>
                      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                )}
              />
            ) : (
              <p className="text-body-sm text-ink-600">No video attached. Items without one show their text only.</p>
            )}
          </Panel>

          {form.kind === "prophecy" ? (
            <Panel title="Fulfilment">
              <div className="space-y-4">
                <Toggle checked={form.is_fulfilled} onChange={(v) => set("is_fulfilled", v)} label="This prophecy has been fulfilled"
                  description="It then appears on the Prophecies & their fulfilment page." />
                {form.is_fulfilled ? (
                  <Field label="How it came to pass" htmlFor="fulfillment_summary" error={errors.fulfillment_summary}>
                    <textarea id="fulfillment_summary" rows={4} className={inputClass} value={form.fulfillment_summary}
                      onChange={(e) => set("fulfillment_summary", e.target.value)} />
                  </Field>
                ) : null}
              </div>
            </Panel>
          ) : null}

          {form.kind === "healing" ? (
            <Panel title="The testimony">
              <div className="space-y-4">
                <Field label="Condition reported" htmlFor="condition" error={errors.condition}>
                  <input id="condition" className={inputClass} value={form.condition} maxLength={200} onChange={(e) => set("condition", e.target.value)} />
                </Field>
                <Toggle checked={form.is_anonymous} onChange={(v) => set("is_anonymous", v)} label="Keep the person unnamed"
                  description="Only turn this off with their consent on file." />
              </div>
            </Panel>
          ) : null}

          {item ? <HistoryPanel key={historyKey} model="content.contentitem" objectId={item.id} /> : null}
        </div>

        <div className="space-y-6">
          <Panel title="Publishing">
            <div className="space-y-4">
              <Field label="Date shown on the site" htmlFor="published_at" error={errors.published_at}
                help={state === "draft" ? "Leave empty to use the moment it's published. A future date schedules it." : "A future date takes it off the site until then."}>
                <input id="published_at" type="datetime-local" className={inputClass} value={toLocalInput(form.published_at)}
                  onChange={(e) => set("published_at", fromLocalInput(e.target.value))} />
              </Field>
              <Toggle checked={form.needs_review} onChange={(v) => set("needs_review", v)} label="Needs review" description="Keeps it in the review queue." />
              <Toggle checked={form.is_featured} onChange={(v) => set("is_featured", v)} label="Featured" />
            </div>
          </Panel>

          <Panel title="Where it belongs">
            <div className="space-y-4">
              <Field label="Kind" htmlFor="kind" error={errors.kind}>
                <select id="kind" className={inputClass} value={form.kind} onChange={(e) => set("kind", e.target.value as ItemFields["kind"])}>
                  {taxonomy.kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </Field>
              <Field label="Category" htmlFor="category" error={errors.category}>
                <select id="category" className={inputClass} value={form.category ?? ""} onChange={(e) => set("category", e.target.value ? Number(e.target.value) : null)}>
                  <option value="">None</option>
                  {taxonomy.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-[1fr_5.5rem] gap-3">
                <Field label="Series" htmlFor="series" error={errors.series}>
                  <select id="series" className={inputClass} value={form.series ?? ""} onChange={(e) => set("series", e.target.value ? Number(e.target.value) : null)}>
                    <option value="">None</option>
                    {taxonomy.series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </Field>
                <Field label="Part" htmlFor="position" error={errors.position_in_series}>
                  <input id="position" type="number" min={1} className={inputClass} value={form.position_in_series ?? ""}
                    onChange={(e) => set("position_in_series", e.target.value ? Number(e.target.value) : null)} />
                </Field>
              </div>
              <fieldset>
                <legend className="mb-1.5 text-meta font-bold text-ink-800">
                  Nations it concerns{form.regions.length ? ` (${form.regions.length})` : ""}
                </legend>
                <input type="search" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} placeholder="Find a nation"
                  aria-label="Find a nation" className={cx(inputClass, "mb-2 py-1.5")} />
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md p-1 ring-1 ring-inset ring-ink-100">
                  {regions.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 rounded px-2 py-1 text-body-sm hover:bg-ink-25">
                      <input type="checkbox" className="accent-primary-600" checked={form.regions.includes(r.id)}
                        onChange={(e) => set("regions", e.target.checked ? [...form.regions, r.id] : form.regions.filter((x) => x !== r.id))} />
                      {r.name}
                    </label>
                  ))}
                  {!regions.length ? <p className="px-2 py-1 text-meta text-ink-500">None match.</p> : null}
                </div>
              </fieldset>
            </div>
          </Panel>

          <Panel title="Dating" description="Most imported items carry no date. Say where a date came from.">
            <div className="space-y-4">
              <Field label={form.kind === "prophecy" ? "Date of the prophecy" : "Date"} htmlFor="prophecy_date" error={errors.prophecy_date}>
                <input id="prophecy_date" type="date" className={inputClass} value={form.prophecy_date ?? ""}
                  onChange={(e) => set("prophecy_date", e.target.value || null)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Source" htmlFor="date_source">
                  <select id="date_source" className={inputClass} value={form.date_source} onChange={(e) => set("date_source", e.target.value)}>
                    {taxonomy.date_sources.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </Field>
                <Field label="Precision" htmlFor="date_precision">
                  <select id="date_precision" className={inputClass} value={form.date_precision} onChange={(e) => set("date_precision", e.target.value)}>
                    {taxonomy.date_precisions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Web address">
            <Field label="Address" htmlFor="slug" error={errors.slug}
              help={item?.state === "published" ? "Changing it breaks links people have already shared." : "Leave empty to make one from the title."}>
              <div className="flex items-center rounded-md ring-1 ring-ink-200 focus-within:ring-2 focus-within:ring-primary-200">
                <span className="shrink-0 pl-3 text-meta text-ink-500">/{label.path}/</span>
                <input id="slug" className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-2 text-body-sm font-medium outline-none"
                  value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              </div>
            </Field>
          </Panel>

          {item && (item.title_yt || item.title_source) ? (
            <Panel title="Imported from">
              <dl className="space-y-2 text-meta">
                {item.title_yt ? (<div><dt className="font-bold text-ink-700">YouTube title</dt><dd className="text-ink-600">{item.title_yt}</dd></div>) : null}
                {item.title_source ? (<div><dt className="font-bold text-ink-700">Original site</dt><dd className="text-ink-600">{item.title_source}</dd></div>) : null}
                <div><dt className="font-bold text-ink-700">Import confidence</dt><dd className="text-ink-600">{Math.round(item.confidence * 100)}%</dd></div>
              </dl>
            </Panel>
          ) : null}

          {item && canDelete ? (
            <Panel title="Delete">
              <p className="mb-3 text-meta text-ink-600">Deleting can&rsquo;t be undone. To take it off the site, unpublish it instead.</p>
              <Button variant="danger" busy={busy === "delete"} onClick={remove}>Delete for good</Button>
            </Panel>
          ) : null}
        </div>
      </div>

      <VideoPicker
        open={picking}
        exclude={form.videos.map((v) => v.video)}
        onClose={() => setPicking(false)}
        onPick={(video) => {
          if (!form.videos.some((v) => v.video === video.id)) {
            setVideos([
              ...form.videos,
              {
                video: video.id,
                label: "",
                is_primary: form.videos.length === 0,
                youtube_id: video.youtube_id,
                title: video.title,
                thumbnail_url: video.thumbnail_url,
                availability: video.availability,
              },
            ]);
          }
          setPicking(false);
        }}
      />
    </div>
  );
}
