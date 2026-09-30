"use client";

import { useEffect, useState } from "react";

import { qs, studio } from "@/lib/studio/client";
import type { Asset, Page } from "@/lib/studio/types";

import { Modal } from "../Modal";
import { Button, Spinner, cx, inputClass } from "../ui";
import { Thumb } from "./Thumb";
import { Uploader } from "./Uploader";

/**
 * Choose photos from the library, or upload new ones on the spot. Used
 * wherever a photo goes: hero slides, galleries.
 */
export function MediaPicker({
  open,
  onClose,
  onPick,
  multiple = false,
  title = "Choose a photo",
  collection = "",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (assets: Asset[]) => void;
  multiple?: boolean;
  title?: string;
  /** Folder new uploads go into. */
  collection?: string;
}) {
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [chosen, setChosen] = useState<Asset[]>([]);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setChosen([]);
  }

  useEffect(() => {
    if (!open) return;
    let live = true;
    const timer = window.setTimeout(() => {
      studio<Page<Asset>>(`media${qs({ q: query, limit: 60 })}`)
        .then((page) => live && setAssets(page.results))
        .catch(() => live && setAssets([]));
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const toggle = (asset: Asset) => {
    if (!multiple) {
      onPick([asset]);
      return;
    }
    setChosen((all) =>
      all.some((a) => a.id === asset.id) ? all.filter((a) => a.id !== asset.id) : [...all, asset],
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        multiple ? (
          <>
            <span className="mr-auto text-meta text-ink-600">
              {chosen.length ? `${chosen.length} chosen` : "Choose one or more"}
            </span>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={!chosen.length} onClick={() => onPick(chosen)}>
              Add {chosen.length || ""} photo{chosen.length === 1 ? "" : "s"}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <Uploader
          compact
          collection={collection}
          onUploaded={(asset) => {
            setAssets((all) => [asset, ...(all ?? []).filter((a) => a.id !== asset.id)]);
            if (multiple) setChosen((all) => (all.some((a) => a.id === asset.id) ? all : [...all, asset]));
          }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the library by title, description or folder"
          aria-label="Search photos"
          className={inputClass}
        />
        {assets === null ? (
          <div className="grid place-items-center py-12 text-primary-600">
            <Spinner className="h-6 w-6" />
          </div>
        ) : assets.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {assets.map((asset) => {
              const order = chosen.findIndex((a) => a.id === asset.id);
              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => toggle(asset)}
                    aria-pressed={multiple ? order >= 0 : undefined}
                    className={cx(
                      "group relative block w-full overflow-hidden rounded-md text-left ring-2 transition",
                      order >= 0 ? "ring-primary-500" : "ring-transparent hover:ring-primary-200",
                    )}
                  >
                    <Thumb asset={asset} />
                    {order >= 0 ? (
                      <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary-600 text-caption text-ink-0">
                        {order + 1}
                      </span>
                    ) : null}
                    <span className="block truncate bg-ink-0 px-2 py-1.5 text-meta font-semibold text-ink-800">
                      {asset.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-10 text-center text-body-sm text-ink-600">
            {query ? "No photos match that search." : "The library is empty. Upload a photo above."}
          </p>
        )}
      </div>
    </Modal>
  );
}
