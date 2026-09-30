"use client";

import { useEffect, useState } from "react";

import { qs, studio } from "@/lib/studio/client";
import { fieldLabel, formatDate, timeAgo } from "@/lib/studio/format";
import type { Page, Revision } from "@/lib/studio/types";

import { useToast } from "./Toaster";
import { Badge, Button, Panel, Spinner } from "./ui";

/**
 * Every saved version of one thing, newest first. Any earlier version can be
 * looked at and put back; putting one back is itself saved as a new version,
 * so nothing is ever lost by restoring.
 */
export function HistoryPanel({
  model,
  objectId,
  onRestored,
}: {
  model: string;
  objectId: number | string;
  /** Default: reload the page, so every field shows the restored version. */
  onRestored?: () => void;
}) {
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [detail, setDetail] = useState<Revision | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    let live = true;
    studio<Page<Revision>>(`revisions${qs({ model, object_id: objectId, limit: 20 })}`)
      .then((page) => {
        if (!live) return;
        setRevisions(page.results);
        setCount(page.count);
      })
      .catch(() => live && setRevisions([]));
    return () => {
      live = false;
    };
  }, [model, objectId]);

  async function view(id: number) {
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    setDetail(null);
    setDetail(await studio<Revision>(`revisions/${id}`));
  }

  async function restore(revision: Revision) {
    if (!window.confirm(`Put back the version saved ${formatDate(revision.created_at, true)}? Your current version stays in the history.`)) return;
    setBusy(revision.id);
    try {
      await studio(`revisions/${revision.id}/restore`, { method: "POST" });
      toast("Earlier version restored. It's live on the site.");
      if (onRestored) onRestored();
      else window.location.reload();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't restore that version.", "error");
      setBusy(null);
    }
  }

  return (
    <Panel title="History" description={count ? `${count} saved version${count === 1 ? "" : "s"}` : undefined} padded={false}>
      {revisions === null ? (
        <div className="grid place-items-center py-8 text-primary-600">
          <Spinner />
        </div>
      ) : revisions.length === 0 ? (
        <p className="px-5 py-6 text-body-sm text-ink-600">No changes have been saved in the Studio yet.</p>
      ) : (
        <ol className="divide-y divide-ink-100">
          {revisions.map((r, index) => (
            <li key={r.id} className="px-5 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge tone={index === 0 ? "info" : "neutral"}>{index === 0 ? "Current" : r.action_label}</Badge>
                <span className="text-meta text-ink-700" title={formatDate(r.created_at, true)}>
                  {r.user} · {timeAgo(r.created_at)}
                </span>
                {index === 0 && r.action !== "created" ? (
                  <span className="text-caption text-ink-500">{r.action_label}</span>
                ) : null}
                <span className="ml-auto flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => view(r.id)} aria-expanded={open === r.id}>
                    {open === r.id ? "Hide" : "View"}
                  </Button>
                  {index > 0 && r.action !== "deleted" ? (
                    <Button size="sm" busy={busy === r.id} onClick={() => restore(r)}>
                      Restore
                    </Button>
                  ) : null}
                </span>
              </div>
              {r.changed_fields.length ? (
                <p className="mt-1 text-meta text-ink-500">Changed: {r.changed_fields.map(fieldLabel).join(", ")}</p>
              ) : null}
              {open === r.id ? (
                <div className="mt-3 rounded-md bg-ink-25 p-3 ring-1 ring-inset ring-ink-100">
                  {detail?.id === r.id && detail.data ? (
                    <dl className="grid gap-2 text-meta sm:grid-cols-[12rem_1fr]">
                      {Object.entries(detail.data).map(([key, value]) => (
                        <div key={key} className="contents">
                          <dt className="font-bold text-ink-700">{fieldLabel(key)}</dt>
                          <dd className="whitespace-pre-line break-words text-ink-800">{describe(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <Spinner />
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function describe(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.length > 600 ? `${value.slice(0, 600)}…` : value;
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value
      .map((v) =>
        typeof v === "object" && v !== null
          ? String((v as Record<string, unknown>).title ?? (v as Record<string, unknown>).youtube_id ?? JSON.stringify(v))
          : String(v),
      )
      .join("\n");
  }
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
