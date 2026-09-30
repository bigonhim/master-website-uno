"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { DevicePreview } from "@/components/studio/DevicePreview";
import { HistoryPanel } from "@/components/studio/HistoryPanel";
import { useSaveShortcut, useUnsavedChanges } from "@/components/studio/hooks";
import { MediaPicker } from "@/components/studio/media/MediaPicker";
import { Thumb } from "@/components/studio/media/Thumb";
import { SortableList } from "@/components/studio/SortableList";
import { useToast } from "@/components/studio/Toaster";
import { Badge, Button, EmptyState, Field, Notice, Panel, inputClass } from "@/components/studio/ui";
import { StudioError, studio } from "@/lib/studio/client";
import type { Gallery, GalleryPhotoRow } from "@/lib/studio/types";
import type { FeaturedGallery } from "@/lib/site/types";

type Row = GalleryPhotoRow & { key: string };

const fields = (g: Gallery) => ({
  title: g.title,
  eyebrow: g.eyebrow,
  heading: g.heading,
  place_name: g.place_name,
  place_detail: g.place_detail,
  summary: g.summary,
});

const rowsOf = (g: Gallery): Row[] => g.photos.map((p, i) => ({ ...p, key: `saved-${p.id ?? i}` }));

const photoPayload = (rows: Row[]) =>
  rows.map((r) => ({ image_id: r.image_id, title: r.title, caption: r.caption, alt_text: r.alt_text }));

export function GalleryEditor({
  initial,
  canChange,
  canDelete,
}: {
  initial: Gallery;
  canChange: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [gallery, setGallery] = useState(initial);
  const [form, setForm] = useState(fields(initial));
  const [rows, setRows] = useState<Row[]>(rowsOf(initial));
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState<"" | "save" | "feature" | "delete">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [historyKey, setHistoryKey] = useState(0);

  const isNew = !gallery.id;
  const dirty =
    JSON.stringify(form) !== JSON.stringify(fields(gallery)) ||
    JSON.stringify(photoPayload(rows)) !== JSON.stringify(photoPayload(rowsOf(gallery)));
  useUnsavedChanges(dirty);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setRow = (key: string, patch: Partial<Row>) =>
    setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const save = useCallback(async () => {
    if (!dirty || busy || !canChange) return;
    setBusy("save");
    setErrors({});
    setProblem("");
    try {
      const body = { ...form, photos: photoPayload(rows) };
      const saved = isNew
        ? await studio<Gallery>("galleries", { body })
        : await studio<Gallery>(`galleries/${gallery.id}`, { method: "PUT", body, version: gallery.version });
      setGallery(saved);
      setForm(fields(saved));
      setRows(rowsOf(saved));
      setHistoryKey((n) => n + 1);
      toast(saved.is_featured ? "Gallery saved. The home page shows it now." : "Gallery saved.");
      if (isNew) router.replace(`/studio/home/galleries/${saved.id}`);
    } catch (error) {
      if (error instanceof StudioError) {
        setErrors(error.fieldErrors);
        setProblem(error.status === 400 ? "Some fields need attention." : error.message);
      }
    } finally {
      setBusy("");
    }
  }, [dirty, busy, canChange, form, rows, isNew, gallery, toast, router]);

  useSaveShortcut(save, dirty);

  async function feature(on: boolean) {
    if (dirty) {
      toast("Save your changes first.", "info");
      return;
    }
    setBusy("feature");
    try {
      const saved = await studio<Gallery>(`galleries/${gallery.id}/feature`, { body: { featured: on } });
      setGallery(saved);
      setHistoryKey((n) => n + 1);
      toast(on ? "It's on the home page now." : "Taken off the home page; the built-in gallery shows instead.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't change that.", "error");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the gallery “${gallery.title}”? Its photos stay in the library.`)) return;
    setBusy("delete");
    try {
      await studio(`galleries/${gallery.id}`, { method: "DELETE" });
      toast("Gallery deleted.");
      router.push("/studio/home/galleries");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Couldn't delete it.");
      setBusy("");
    }
  }

  const preview: FeaturedGallery = useMemo(
    () => ({
      eyebrow: form.eyebrow || "Recognition",
      heading: form.heading || "Heading",
      place: { name: form.place_name, detail: form.place_detail },
      summary: form.summary,
      photos: rows.map((r) => ({
        src: r.image.url,
        width: r.image.width,
        height: r.image.height,
        alt: r.alt_text || r.image.alt_text || r.title,
        title: r.title,
        caption: r.caption,
        focus: `${r.image.focal_x * 100}% ${r.image.focal_y * 100}%`,
      })),
    }),
    [form, rows],
  );

  return (
    <div className="space-y-6">
      {problem ? <Notice tone="danger">{problem}</Notice> : null}

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-0 px-4 py-3 shadow-xs ring-1 ring-ink-100">
        {gallery.is_featured ? (
          <Badge tone="success">On the home page</Badge>
        ) : (
          <Badge>{isNew ? "Not saved yet" : "Not on the home page"}</Badge>
        )}
        {dirty ? <span className="text-meta font-semibold text-gold-800">Unsaved changes</span> : null}
        <div className="ml-auto flex flex-wrap gap-2">
          {!isNew && canDelete && !gallery.is_featured ? (
            <Button variant="danger" busy={busy === "delete"} onClick={remove}>
              Delete
            </Button>
          ) : null}
          {!isNew && canChange ? (
            gallery.is_featured ? (
              <Button busy={busy === "feature"} onClick={() => feature(false)}>
                Take off the home page
              </Button>
            ) : (
              <Button variant="success" busy={busy === "feature"} disabled={!rows.length} onClick={() => feature(true)}>
                Put on the home page
              </Button>
            )
          ) : null}
          {canChange ? (
            <Button variant="primary" busy={busy === "save"} disabled={!dirty} onClick={save}>
              {isNew ? "Create gallery" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Panel title="Heading and words">
          <div className="space-y-4">
            <Field label="Name (for staff)" htmlFor="g-title" error={errors.title} help="e.g. Bogotá, Colombia. Not shown on the site.">
              <input id="g-title" className={inputClass} value={form.title} maxLength={200} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <Field label="Label" htmlFor="g-eyebrow" error={errors.eyebrow}>
                <input id="g-eyebrow" className={inputClass} value={form.eyebrow} maxLength={60} onChange={(e) => set("eyebrow", e.target.value)} />
              </Field>
              <Field label="Heading" htmlFor="g-heading" error={errors.heading} count={[form.heading.length, 200]}
                help="Wrap words in **double stars** to set them in yellow.">
                <input id="g-heading" className={inputClass} value={form.heading} maxLength={200} onChange={(e) => set("heading", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Place" htmlFor="g-place" error={errors.place_name} help="Yellow tag">
                <input id="g-place" className={inputClass} value={form.place_name} maxLength={80} onChange={(e) => set("place_name", e.target.value)} />
              </Field>
              <Field label="Country" htmlFor="g-detail" error={errors.place_detail} help="Navy tag">
                <input id="g-detail" className={inputClass} value={form.place_detail} maxLength={80} onChange={(e) => set("place_detail", e.target.value)} />
              </Field>
            </div>
            <Field label="Summary" htmlFor="g-summary" error={errors.summary} count={[form.summary.length, 600]}
              help="One or two sentences. Say only what the photos show.">
              <textarea id="g-summary" rows={3} className={inputClass} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Photos"
          description="In the order they're shown. The first is the one visitors see first."
          actions={canChange ? <Button size="sm" variant="primary" onClick={() => setPicking(true)}>Add photos</Button> : null}
        >
          {errors.photos ? <Notice tone="danger" className="mb-3">{errors.photos}</Notice> : null}
          {rows.length ? (
            <SortableList
              items={rows}
              getKey={(r) => r.key}
              label={(r, i) => `photo ${i + 1}, ${r.title}`}
              onReorder={setRows}
              renderItem={(row) => (
                <div className="flex gap-3 p-2.5">
                  <Thumb asset={row.image} className="w-28 shrink-0 self-start rounded" sizes="112px" />
                  <div className="grid min-w-0 flex-1 gap-2">
                    <input aria-label="Photo title" placeholder="Title" className={inputClass} value={row.title} maxLength={120}
                      onChange={(e) => setRow(row.key, { title: e.target.value })} />
                    <input aria-label="Caption" placeholder="Caption: what it shows" className={inputClass} value={row.caption} maxLength={400}
                      onChange={(e) => setRow(row.key, { caption: e.target.value })} />
                    <input aria-label="Description for people who can't see it" placeholder={row.image.alt_text || "Description for people who can't see it"}
                      className={inputClass} value={row.alt_text} maxLength={300}
                      onChange={(e) => setRow(row.key, { alt_text: e.target.value })} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((all) => all.filter((r) => r.key !== row.key))}
                    className="self-start rounded p-1.5 text-ink-500 hover:bg-[rgb(253_236_234)] hover:text-danger"
                  >
                    <span className="sr-only">Remove {row.title} from the gallery</span>
                    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
                  </button>
                </div>
              )}
            />
          ) : (
            <EmptyState title="No photos yet" action={canChange ? <Button variant="primary" onClick={() => setPicking(true)}>Add photos</Button> : undefined}>
              Choose them from the library, or upload new ones.
            </EmptyState>
          )}
        </Panel>
      </div>

      {rows.length ? <DevicePreview view={{ view: "recognition", gallery: preview }} /> : null}

      {!isNew ? <HistoryPanel key={historyKey} model="sitecontent.gallery" objectId={gallery.id} /> : null}

      <MediaPicker
        open={picking}
        multiple
        collection={form.title ? `Recognition — ${form.place_name || form.title}` : ""}
        title="Add photos to the gallery"
        onClose={() => setPicking(false)}
        onPick={(assets) => {
          setRows((all) => [
            ...all,
            ...assets.map((a, i) => ({
              key: `new-${Date.now()}-${i}`,
              image: a,
              image_id: a.id,
              title: a.title,
              caption: a.caption,
              alt_text: "",
            })),
          ]);
          setPicking(false);
        }}
      />
    </div>
  );
}
