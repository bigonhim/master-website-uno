"use client";

import { useCallback, useMemo, useState } from "react";

import { DevicePreview } from "@/components/studio/DevicePreview";
import { FocalPicker } from "@/components/studio/FocalPicker";
import { useSaveShortcut, useUnsavedChanges } from "@/components/studio/hooks";
import { MediaPicker } from "@/components/studio/media/MediaPicker";
import { Thumb } from "@/components/studio/media/Thumb";
import { SortableList } from "@/components/studio/SortableList";
import { useToast } from "@/components/studio/Toaster";
import { Badge, Button, EmptyState, Field, Notice, Panel, Toggle, cx, inputClass } from "@/components/studio/ui";
import { StudioError, studio } from "@/lib/studio/client";
import type { AssetSummary, Slide } from "@/lib/studio/types";
import type { HeroSlide, SiteSections } from "@/lib/site/types";

type Draft = Omit<Slide, "id" | "order" | "created_at" | "updated_at" | "version"> & {
  id: number | null;
  version?: string;
};

const EDITABLE = ["image_id", "alt_text", "place", "detail", "event", "frame_x", "frame_y", "frame_lg_x", "frame_lg_y", "is_active"] as const;

function toDraft(slide: Slide): Draft {
  return { ...slide };
}

function newDraft(image: AssetSummary): Draft {
  return {
    id: null,
    image,
    image_id: image.id,
    alt_text: "",
    place: "",
    detail: "",
    event: "",
    frame_x: image.focal_x,
    frame_y: image.focal_y,
    frame_lg_x: image.focal_x,
    frame_lg_y: image.focal_y,
    is_active: true,
  };
}

function asHeroSlide(slide: Draft | Slide): HeroSlide {
  return {
    src: slide.image.url,
    alt: slide.alt_text || slide.image.alt_text || slide.image.title,
    place: slide.place || "Place",
    detail: slide.detail || undefined,
    event: slide.event || "Event",
    frame: { x: slide.frame_x, y: slide.frame_y },
    frameLg: { x: slide.frame_lg_x, y: slide.frame_lg_y },
  };
}

const payload = (draft: Draft) => Object.fromEntries(EDITABLE.map((k) => [k, draft[k]]));

export function SlidesManager({
  initial,
  hero,
  canAdd,
  canChange,
  canDelete,
}: {
  initial: Slide[];
  hero: SiteSections["home_hero"];
  canAdd: boolean;
  canChange: boolean;
  canDelete: boolean;
}) {
  const [slides, setSlides] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(initial[0] ? toDraft(initial[0]) : null);
  const [picking, setPicking] = useState<"new" | "replace" | null>(null);
  const [busy, setBusy] = useState<"" | "save" | "delete" | "order">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const toast = useToast();

  const saved = draft?.id ? slides.find((s) => s.id === draft.id) : undefined;
  const dirty = Boolean(
    draft && (!saved || JSON.stringify(payload(toDraft(saved))) !== JSON.stringify(payload(draft))),
  );
  useUnsavedChanges(dirty);

  const select = (slide: Slide) => {
    if (dirty && !window.confirm("Leave this slide without saving your changes?")) return;
    setDraft(toDraft(slide));
    setErrors({});
    setProblem("");
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = useCallback(async () => {
    if (!draft || !dirty || busy) return;
    setBusy("save");
    setErrors({});
    setProblem("");
    try {
      const result = draft.id
        ? await studio<Slide>(`slides/${draft.id}`, { method: "PUT", body: payload(draft), version: draft.version })
        : await studio<Slide>("slides", { body: payload(draft) });
      setSlides((all) => (draft.id ? all.map((s) => (s.id === result.id ? result : s)) : [...all, result]));
      setDraft(toDraft(result));
      toast(result.is_active ? "Slide saved. It's on the home page now." : "Slide saved. It's hidden from the home page.");
    } catch (error) {
      if (error instanceof StudioError) {
        setErrors(error.fieldErrors);
        setProblem(error.message);
      }
    } finally {
      setBusy("");
    }
  }, [draft, dirty, busy, toast]);

  useSaveShortcut(save, dirty);

  async function remove() {
    if (!draft?.id || !window.confirm("Delete this slide? The photo stays in the library.")) return;
    setBusy("delete");
    try {
      await studio(`slides/${draft.id}`, { method: "DELETE" });
      const rest = slides.filter((s) => s.id !== draft.id);
      setSlides(rest);
      setDraft(rest[0] ? toDraft(rest[0]) : null);
      toast("Slide deleted.");
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Couldn't delete the slide.");
    } finally {
      setBusy("");
    }
  }

  async function reorder(next: Slide[]) {
    const before = slides;
    setSlides(next);
    setBusy("order");
    try {
      setSlides(await studio<Slide[]>("slides/reorder", { body: { ids: next.map((s) => s.id) } }));
      toast("New order saved.");
    } catch (error) {
      setSlides(before);
      toast(error instanceof Error ? error.message : "Couldn't save the order.", "error");
    } finally {
      setBusy("");
    }
  }

  const previewSlides = useMemo(() => {
    if (draft) return [asHeroSlide(draft)];
    return slides.filter((s) => s.is_active).map(asHeroSlide);
  }, [draft, slides]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        {/* The slides, in order */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-meta font-bold text-ink-700">
              {slides.filter((s) => s.is_active).length} showing · drag to reorder
            </p>
            {canAdd ? (
              <Button size="sm" variant="primary" onClick={() => setPicking("new")}>
                Add slide
              </Button>
            ) : null}
          </div>
          {slides.length ? (
            <SortableList
              items={slides}
              getKey={(s) => s.id}
              label={(s, i) => `slide ${i + 1}, ${s.place}`}
              onReorder={canChange ? reorder : () => undefined}
              renderItem={(slide) => (
                <button
                  type="button"
                  onClick={() => select(slide)}
                  aria-current={draft?.id === slide.id || undefined}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-r-md p-2 text-left transition-colors",
                    draft?.id === slide.id ? "bg-primary-50" : "hover:bg-ink-25",
                  )}
                >
                  <Thumb asset={slide.image} className={cx("w-24 shrink-0 rounded", !slide.is_active && "opacity-40 grayscale")} sizes="96px" />
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-bold text-primary-900">
                      {slide.place}
                      {slide.detail ? `, ${slide.detail}` : ""}
                    </span>
                    <span className="block truncate text-meta text-ink-600">{slide.event}</span>
                    {!slide.is_active ? <Badge className="mt-1">Hidden</Badge> : null}
                  </span>
                </button>
              )}
            />
          ) : (
            <EmptyState title="No slides yet">
              The home page is showing its built-in photos. Add a slide to take over.
            </EmptyState>
          )}
        </div>

        {/* The chosen slide */}
        {draft ? (
          <Panel
            title={draft.id ? "Edit slide" : "New slide"}
            description={dirty ? "Unsaved changes" : draft.id ? "Saved" : undefined}
            actions={
              <div className="flex gap-2">
                {draft.id && canDelete ? (
                  <Button size="sm" variant="danger" busy={busy === "delete"} onClick={remove}>
                    Delete
                  </Button>
                ) : null}
                {!draft.id ? (
                  <Button size="sm" onClick={() => setDraft(slides[0] ? toDraft(slides[0]) : null)}>
                    Cancel
                  </Button>
                ) : null}
                {canChange || (!draft.id && canAdd) ? (
                  <Button size="sm" variant="primary" busy={busy === "save"} disabled={!dirty} onClick={save}>
                    {draft.id ? "Save slide" : "Add to home page"}
                  </Button>
                ) : null}
              </div>
            }
          >
            <div className="space-y-5">
              {problem ? <Notice tone="danger">{problem}</Notice> : null}
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Place" htmlFor="slide-place" error={errors.place} help="Yellow tag, e.g. Nakuru">
                  <input id="slide-place" className={inputClass} value={draft.place} maxLength={60}
                    onChange={(e) => set("place", e.target.value)} />
                </Field>
                <Field label="Country or region" htmlFor="slide-detail" error={errors.detail} help="Navy tag; optional">
                  <input id="slide-detail" className={inputClass} value={draft.detail} maxLength={60}
                    onChange={(e) => set("detail", e.target.value)} />
                </Field>
                <Field label="Event" htmlFor="slide-event" error={errors.event} help="e.g. Revival">
                  <input id="slide-event" className={inputClass} value={draft.event} maxLength={80}
                    onChange={(e) => set("event", e.target.value)} />
                </Field>
              </div>
              <Field
                label="Description for people who can't see it"
                htmlFor="slide-alt"
                error={errors.alt_text}
                help={draft.image.alt_text ? "Leave empty to use the photo's own description." : "The photo has no description in the library; write one here or there."}
              >
                <input id="slide-alt" className={inputClass} value={draft.alt_text} maxLength={300}
                  placeholder={draft.image.alt_text} onChange={(e) => set("alt_text", e.target.value)} />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-meta font-bold text-ink-800">On phones: keep this point in view</p>
                  <FocalPicker
                    src={draft.image.url}
                    alt=""
                    label="Frame on phones"
                    value={{ x: draft.frame_x, y: draft.frame_y }}
                    onChange={(p) => setDraft((d) => (d ? { ...d, frame_x: p.x, frame_y: p.y } : d))}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-meta font-bold text-ink-800">On wide screens: keep this point in view</p>
                  <FocalPicker
                    src={draft.image.url}
                    alt=""
                    label="Frame on wide screens"
                    value={{ x: draft.frame_lg_x, y: draft.frame_lg_y }}
                    onChange={(p) => setDraft((d) => (d ? { ...d, frame_lg_x: p.x, frame_lg_y: p.y } : d))}
                  />
                </div>
              </div>
              <p className="text-meta text-ink-600">
                Wide screens show a long, shallow strip of the photo, so the point mostly chooses its height: put it on the faces.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-4">
                <Toggle
                  checked={draft.is_active}
                  onChange={(v) => set("is_active", v)}
                  label="Show on the home page"
                  description="Hidden slides keep their place and settings."
                />
                <Button size="sm" onClick={() => setPicking("replace")}>
                  Use a different photo
                </Button>
              </div>
            </div>
          </Panel>
        ) : null}
      </div>

      <DevicePreview
        view={{ view: "hero", hero, slides: previewSlides.length ? previewSlides : [] }}
        title={draft ? "Live preview of this slide" : "Live preview"}
      />

      <MediaPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        collection="Hero"
        title={picking === "new" ? "Choose a photo for the new slide" : "Choose a different photo"}
        onPick={([asset]) => {
          if (picking === "new") setDraft(newDraft(asset));
          else setDraft((d) => (d ? { ...d, image: asset, image_id: asset.id } : d));
          setPicking(null);
        }}
      />
    </div>
  );
}
