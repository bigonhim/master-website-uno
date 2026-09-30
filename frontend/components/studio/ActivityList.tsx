import Link from "next/link";

import { fieldLabel, formatDate, studioHref, timeAgo } from "@/lib/studio/format";
import type { Revision } from "@/lib/studio/types";

import { Badge } from "./ui";

const TONES: Record<string, "success" | "danger" | "warning" | "info" | "neutral"> = {
  created: "info",
  published: "success",
  unpublished: "warning",
  deleted: "danger",
  restored: "info",
  reset: "warning",
};

const MODEL_LABELS: Record<string, string> = {
  "content.contentitem": "Archive",
  "content.video": "Video",
  "media.mediaasset": "Photo",
  "sitecontent.heroslide": "Hero slide",
  "sitecontent.gallery": "Gallery",
  "sitecontent.sitesection": "Site words",
};

/** Who changed what, and when: one line per saved change. */
export function ActivityList({ revisions, empty }: { revisions: Revision[]; empty: string }) {
  if (!revisions.length) {
    return <p className="px-5 py-8 text-center text-body-sm text-ink-600">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {revisions.map((r) => {
        const href = r.action === "deleted" ? null : studioHref(r.model, r.object_id);
        return (
          <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
            <Badge tone={TONES[r.action] ?? "neutral"}>{r.action_label}</Badge>
            <span className="text-caption text-ink-500">{MODEL_LABELS[r.model] ?? r.model}</span>
            {href ? (
              <Link href={href} className="min-w-0 flex-1 truncate text-body-sm font-bold text-primary-800 hover:underline">
                {r.object_repr}
              </Link>
            ) : (
              <span className="min-w-0 flex-1 truncate text-body-sm font-bold text-ink-700">{r.object_repr}</span>
            )}
            <span className="text-meta text-ink-600" title={formatDate(r.created_at, true)}>
              {r.user} · {timeAgo(r.created_at)}
            </span>
            {r.changed_fields.length ? (
              <span className="basis-full text-meta text-ink-500">
                Changed: {r.changed_fields.map(fieldLabel).join(", ")}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
