"use client";

import { useEffect, useState } from "react";

import { PhotoEditor } from "@/components/studio/media/PhotoEditor";
import { Thumb } from "@/components/studio/media/Thumb";
import { Uploader } from "@/components/studio/media/Uploader";
import { Badge, Button, EmptyState, Spinner, Toggle, cx, inputClass } from "@/components/studio/ui";
import { qs, studio } from "@/lib/studio/client";
import type { Asset, Page } from "@/lib/studio/types";

const PAGE = 48;

export function MediaLibrary({
  collections: initialCollections,
  initialPhoto,
  initialMissingAlt,
  canAdd,
  canChange,
  canDelete,
}: {
  collections: { name: string; count: number }[];
  initialPhoto: number | null;
  initialMissingAlt: boolean;
  canAdd: boolean;
  canChange: boolean;
  canDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("");
  const [unused, setUnused] = useState(false);
  const [missingAlt, setMissingAlt] = useState(initialMissingAlt);
  const [page, setPage] = useState<Page<Asset> | null>(null);
  const [extra, setExtra] = useState<Asset[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState<number | null>(initialPhoto);
  const [collections, setCollections] = useState(initialCollections);

  const filters = { q: query, collection, unused, missing_alt: missingAlt };
  const key = JSON.stringify(filters);

  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(() => {
      studio<Page<Asset>>(`media${qs({ ...JSON.parse(key), limit: PAGE })}`)
        .then((p) => {
          if (!live) return;
          setPage(p);
          setExtra([]);
        })
        .catch(() => live && setPage({ count: 0, next: null, previous: null, results: [] }));
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [key]);

  const assets = [...(page?.results ?? []), ...extra];

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = await studio<Page<Asset>>(
        `media${qs({ ...filters, limit: PAGE, offset: assets.length })}`,
      );
      setExtra((all) => [...all, ...next.results]);
    } finally {
      setLoadingMore(false);
    }
  }

  const replace = (asset: Asset) => {
    const swap = (list: Asset[]) => list.map((a) => (a.id === asset.id ? { ...a, ...asset } : a));
    setPage((p) => (p ? { ...p, results: swap(p.results) } : p));
    setExtra(swap);
    if (asset.collection && !collections.some((c) => c.name === asset.collection)) {
      setCollections((all) => [...all, { name: asset.collection, count: 1 }].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const added = (asset: Asset) => {
    if (asset.duplicate) {
      setOpen(asset.id);
      return;
    }
    setPage((p) =>
      p ? { ...p, count: p.count + 1, results: [asset, ...p.results.filter((a) => a.id !== asset.id)] } : p,
    );
  };

  const removed = (id: number) => {
    setOpen(null);
    setPage((p) => (p ? { ...p, count: p.count - 1, results: p.results.filter((a) => a.id !== id) } : p));
    setExtra((all) => all.filter((a) => a.id !== id));
  };

  const filtered = Boolean(query || collection || unused || missingAlt);

  return (
    <div className="space-y-5">
      {canAdd ? <Uploader onUploaded={added} collection={collection} /> : null}

      <div className="flex flex-col gap-3 rounded-lg bg-ink-0 p-4 shadow-xs ring-1 ring-ink-100 lg:flex-row lg:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, description, caption or file name"
          aria-label="Search photos"
          className={cx(inputClass, "lg:max-w-sm")}
        />
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          aria-label="Folder"
          className={cx(inputClass, "lg:max-w-[14rem]")}
        >
          <option value="">All folders</option>
          {collections.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-5 lg:ml-auto">
          <Toggle checked={unused} onChange={setUnused} label="Not used anywhere" />
          <Toggle checked={missingAlt} onChange={setMissingAlt} label="No description" />
        </div>
      </div>

      {page === null ? (
        <div className="grid place-items-center py-20 text-primary-600">
          <Spinner className="h-6 w-6" />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState title={filtered ? "No photos match" : "The library is empty"}>
          {filtered
            ? "Try a different search, or clear the filters."
            : "Upload the site's photos above. From then on, the hero, galleries and anything else pick from here."}
        </EmptyState>
      ) : (
        <>
          <p className="text-meta text-ink-600">
            {page.count} photo{page.count === 1 ? "" : "s"}
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {assets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setOpen(asset.id)}
                  className="group block w-full overflow-hidden rounded-lg bg-ink-0 text-left shadow-xs ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-200"
                >
                  <Thumb asset={asset} sizes="(min-width: 1536px) 16vw, (min-width: 1024px) 22vw, 45vw" />
                  <span className="block px-3 py-2.5">
                    <span className="block truncate text-meta font-bold text-primary-900">{asset.title}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {asset.usage_count ? (
                        <Badge tone="info">Used {asset.usage_count}×</Badge>
                      ) : (
                        <Badge>Unused</Badge>
                      )}
                      {!asset.alt_text ? <Badge tone="warning">No description</Badge> : null}
                      {asset.collection ? <Badge>{asset.collection}</Badge> : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {assets.length < page.count ? (
            <div className="flex justify-center">
              <Button onClick={loadMore} busy={loadingMore}>
                Show more photos
              </Button>
            </div>
          ) : null}
        </>
      )}

      <PhotoEditor
        assetId={open}
        collections={collections.map((c) => c.name)}
        onClose={() => setOpen(null)}
        onSaved={replace}
        onDeleted={removed}
        canChange={canChange}
        canDelete={canDelete}
      />
    </div>
  );
}
