"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { StudioError, studio } from "@/lib/studio/client";
import { fileSize, formatDate, studioHref } from "@/lib/studio/format";
import type { Asset } from "@/lib/studio/types";

import { CropPreview, FocalPicker } from "../FocalPicker";
import { useSaveShortcut } from "../hooks";
import { Modal } from "../Modal";
import { useToast } from "../Toaster";
import { Button, Field, Notice, Spinner, inputClass } from "../ui";

type Draft = Pick<Asset, "title" | "alt_text" | "caption" | "credit" | "collection" | "focal_x" | "focal_y">;

const pick = (a: Asset): Draft => ({
  title: a.title,
  alt_text: a.alt_text,
  caption: a.caption,
  credit: a.credit,
  collection: a.collection,
  focal_x: a.focal_x,
  focal_y: a.focal_y,
});

/** One photo's details, its focal point, and everywhere it is used. */
export function PhotoEditor({
  assetId,
  collections,
  onClose,
  onSaved,
  onDeleted,
  canChange,
  canDelete,
}: {
  assetId: number | null;
  collections: string[];
  onClose: () => void;
  onSaved: (asset: Asset) => void;
  onDeleted: (id: number) => void;
  canChange: boolean;
  canDelete: boolean;
}) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "delete">("");
  const toast = useToast();

  // Reset during render when a different photo is opened, not in an effect.
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  if (loadedFor !== assetId) {
    setLoadedFor(assetId);
    setAsset(null);
    setDraft(null);
    setErrors({});
    setProblem("");
  }

  useEffect(() => {
    if (assetId === null) return;
    let live = true;
    studio<Asset>(`media/${assetId}`)
      .then((a) => {
        if (!live) return;
        setAsset(a);
        setDraft(pick(a));
      })
      .catch((e) => live && setProblem(e.message));
    return () => {
      live = false;
    };
  }, [assetId]);

  const dirty = Boolean(asset && draft && JSON.stringify(pick(asset)) !== JSON.stringify(draft));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  async function save() {
    if (!asset || !draft || !dirty || busy) return;
    setBusy("save");
    setErrors({});
    setProblem("");
    try {
      const saved = await studio<Asset>(`media/${asset.id}`, {
        method: "PATCH",
        body: draft,
        version: asset.version,
      });
      setAsset(saved);
      setDraft(pick(saved));
      onSaved(saved);
      toast("Photo saved.");
    } catch (error) {
      if (error instanceof StudioError) {
        setErrors(error.fieldErrors);
        setProblem(error.message);
      }
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!asset || busy) return;
    if (!window.confirm(`Delete “${asset.title}” from the library? This can't be undone.`)) return;
    setBusy("delete");
    try {
      await studio(`media/${asset.id}`, { method: "DELETE" });
      toast("Photo deleted.");
      onDeleted(asset.id);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Couldn't delete the photo.");
    } finally {
      setBusy("");
    }
  }

  useSaveShortcut(save, assetId !== null && dirty);

  const point = draft ? { x: draft.focal_x, y: draft.focal_y } : { x: 0.5, y: 0.5 };
  const inUse = (asset?.usage?.length ?? 0) > 0;

  return (
    <Modal
      open={assetId !== null}
      onClose={() => {
        if (dirty && !window.confirm("Close without saving your changes?")) return;
        onClose();
      }}
      title={asset?.title ?? "Photo"}
      size="xl"
      footer={
        asset && draft ? (
          <>
            {canDelete ? (
              <Button
                variant="danger"
                onClick={remove}
                busy={busy === "delete"}
                disabled={inUse}
                title={inUse ? "Remove it from where it's used first." : undefined}
                className="mr-auto"
              >
                Delete
              </Button>
            ) : null}
            <Button onClick={onClose}>Close</Button>
            {canChange ? (
              <Button variant="primary" onClick={save} busy={busy === "save"} disabled={!dirty}>
                Save photo
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {!asset || !draft ? (
        problem ? (
          <Notice tone="danger">{problem}</Notice>
        ) : (
          <div className="grid place-items-center py-20 text-primary-600">
            <Spinner className="h-6 w-6" />
          </div>
        )
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4">
            <FocalPicker
              src={asset.url}
              alt={draft.alt_text || draft.title}
              value={point}
              onChange={(p) => canChange && setDraft((d) => (d ? { ...d, focal_x: p.x, focal_y: p.y } : d))}
            />
            <p className="text-meta text-ink-600">
              Click the part of the photo that must always stay in view: usually a face. Every crop on the
              site is taken around it.
            </p>
            <div className="grid grid-cols-4 gap-3">
              <CropPreview src={asset.url} point={point} aspect="3 / 2" label="Card" />
              <CropPreview src={asset.url} point={point} aspect="1 / 1" label="Square" />
              <CropPreview src={asset.url} point={point} aspect="16 / 9" label="Video frame" />
              <CropPreview src={asset.url} point={point} aspect="21 / 9" label="Wide band" />
            </div>
          </div>

          <div className="space-y-4">
            {problem ? <Notice tone="danger">{problem}</Notice> : null}
            <Field label="Title" htmlFor="photo-title" error={errors.title} count={[draft.title.length, 200]}>
              <input
                id="photo-title"
                className={inputClass}
                value={draft.title}
                disabled={!canChange}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field
              label="Description for people who can't see it"
              htmlFor="photo-alt"
              error={errors.alt_text}
              count={[draft.alt_text.length, 300]}
              help="Say what the photo shows, as you would to someone on the phone: who, doing what, where."
            >
              <textarea
                id="photo-alt"
                rows={3}
                className={inputClass}
                value={draft.alt_text}
                disabled={!canChange}
                aria-invalid={!draft.alt_text || undefined}
                onChange={(e) => set("alt_text", e.target.value)}
              />
            </Field>
            <Field label="Caption" htmlFor="photo-caption" error={errors.caption}>
              <textarea
                id="photo-caption"
                rows={2}
                className={inputClass}
                value={draft.caption}
                disabled={!canChange}
                onChange={(e) => set("caption", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Credit" htmlFor="photo-credit" error={errors.credit}>
                <input
                  id="photo-credit"
                  className={inputClass}
                  value={draft.credit}
                  disabled={!canChange}
                  onChange={(e) => set("credit", e.target.value)}
                />
              </Field>
              <Field label="Folder" htmlFor="photo-collection" error={errors.collection}>
                <input
                  id="photo-collection"
                  list="photo-collections"
                  className={inputClass}
                  value={draft.collection}
                  disabled={!canChange}
                  placeholder="e.g. Hero"
                  onChange={(e) => set("collection", e.target.value)}
                />
                <datalist id="photo-collections">
                  {collections.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>

            <div className="rounded-md bg-ink-25 p-4 ring-1 ring-inset ring-ink-100">
              <p className="text-meta font-bold text-ink-800">Used in</p>
              {asset.usage?.length ? (
                <ul className="mt-2 space-y-1">
                  {asset.usage.map((use) => {
                    const href =
                      use.model === "sitecontent.galleryphoto"
                        ? "/studio/home/galleries"
                        : studioHref(use.model, use.id);
                    return (
                      <li key={`${use.model}-${use.id}`} className="text-meta">
                        <span className="text-ink-500">{use.type}: </span>
                        {href ? (
                          <Link href={href} className="font-bold text-primary-700 hover:underline">
                            {use.label}
                          </Link>
                        ) : (
                          use.label
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-1 text-meta text-ink-600">Not used on the site yet.</p>
              )}
              <p className="mt-3 border-t border-ink-100 pt-3 text-caption text-ink-500">
                {asset.width}×{asset.height} · {fileSize(asset.file_size)} · from {asset.original_filename || "upload"}
                {asset.uploaded_by ? ` · added by ${asset.uploaded_by}` : ""} on {formatDate(asset.created_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
