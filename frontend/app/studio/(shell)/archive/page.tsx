/* eslint-disable @next/next/no-img-element -- YouTube thumbnails, already sized. */

import Link from "next/link";

import { Badge, ButtonLink, EmptyState, PageHeader, StateBadge, buttonClass, cx, inputClass } from "@/components/studio/ui";
import { can, qs } from "@/lib/studio/client";
import { KIND_LABELS, formatDate } from "@/lib/studio/format";
import { getEditor, studioGet } from "@/lib/studio/server";
import type { ItemSummary, Page } from "@/lib/studio/types";

export const metadata = { title: "Archive" };

const PER_PAGE = 25;

type Params = {
  kind?: string;
  state?: string;
  q?: string;
  needs_review?: string;
  dead_video?: string;
  ordering?: string;
  page?: string;
};

export default async function ArchivePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filters = {
    kind: params.kind,
    state: params.state,
    q: params.q,
    needs_review: params.needs_review,
    dead_video: params.dead_video,
    ordering: params.ordering,
  };
  const [user, data] = await Promise.all([
    getEditor(),
    studioGet<Page<ItemSummary>>(`items/${qs({ ...filters, limit: PER_PAGE, offset: (page - 1) * PER_PAGE })}`),
  ]);

  const href = (patch: Partial<Params>) => `/studio/archive${qs({ ...filters, ...patch, page: patch.page })}`;
  const pages = Math.max(1, Math.ceil(data.count / PER_PAGE));

  const kinds = [{ value: "", label: "Everything" }, ...Object.entries(KIND_LABELS).map(([value, k]) => ({ value, label: k.many }))];
  const states = [
    { value: "", label: "Any state" },
    { value: "draft", label: "Drafts" },
    { value: "scheduled", label: "Scheduled" },
    { value: "published", label: "Published" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Archive"
        description="Teachings, prophecies, healings and writings. Drafts stay in the Studio until they're published; a published item can also be scheduled for later."
        actions={
          can(user, "content.add_contentitem") ? (
            <>
              <ButtonLink href={`/studio/archive/new?kind=${params.kind || "prophecy"}`} variant="primary">
                New {KIND_LABELS[params.kind || "prophecy"]?.one.toLowerCase() ?? "item"}
              </ButtonLink>
            </>
          ) : null
        }
      />

      <nav aria-label="Kind" className="flex gap-1 overflow-x-auto border-b border-ink-100">
        {kinds.map((k) => {
          const active = (params.kind ?? "") === k.value;
          return (
            <Link
              key={k.value}
              href={href({ kind: k.value || undefined })}
              aria-current={active ? "page" : undefined}
              className={cx(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-body-sm font-bold transition-colors",
                active ? "border-primary-700 text-primary-800" : "border-transparent text-ink-600 hover:text-primary-700",
              )}
            >
              {k.label}
            </Link>
          );
        })}
      </nav>

      <form className="flex flex-col gap-3 rounded-lg bg-ink-0 p-4 shadow-xs ring-1 ring-ink-100 lg:flex-row lg:items-center">
        {params.kind ? <input type="hidden" name="kind" value={params.kind} /> : null}
        <input type="search" name="q" defaultValue={params.q} placeholder="Search titles, summaries and transcripts" aria-label="Search the archive" className={cx(inputClass, "lg:max-w-sm")} />
        <select name="state" defaultValue={params.state ?? ""} aria-label="State" className={cx(inputClass, "lg:max-w-[11rem]")}>
          {states.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select name="ordering" defaultValue={params.ordering ?? ""} aria-label="Order" className={cx(inputClass, "lg:max-w-[13rem]")}>
          <option value="">Recently edited</option>
          <option value="published">Recently published</option>
          <option value="title">Title A–Z</option>
          <option value="review">Review queue</option>
        </select>
        <label className="flex items-center gap-2 whitespace-nowrap text-body-sm font-semibold text-ink-800">
          <input type="checkbox" name="needs_review" value="1" defaultChecked={params.needs_review === "1"} className="h-4 w-4 accent-primary-600" />
          Needs review
        </label>
        <label className="flex items-center gap-2 whitespace-nowrap text-body-sm font-semibold text-ink-800">
          <input type="checkbox" name="dead_video" value="1" defaultChecked={params.dead_video === "1"} className="h-4 w-4 accent-primary-600" />
          Deleted video
        </label>
        <button type="submit" className={buttonClass("secondary", "md", "lg:ml-auto")}>Filter</button>
      </form>

      {data.results.length ? (
        <div className="overflow-hidden rounded-lg bg-ink-0 shadow-xs ring-1 ring-ink-100">
          <ul className="divide-y divide-ink-100">
            {data.results.map((item) => (
              <li key={item.id}>
                <Link href={`/studio/archive/${item.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-primary-50/60">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt="" loading="lazy" className="hidden aspect-video w-24 shrink-0 rounded bg-ink-100 object-cover sm:block" />
                  ) : (
                    <span className="hidden aspect-video w-24 shrink-0 rounded bg-ink-50 sm:block" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-body-sm font-bold text-primary-900">{item.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <StateBadge state={item.state} />
                      <Badge>{KIND_LABELS[item.kind]?.one}</Badge>
                      {item.category ? <Badge>{item.category}</Badge> : null}
                      {item.needs_review ? <Badge tone="warning">Needs review</Badge> : null}
                      {item.dead_videos ? <Badge tone="danger">{item.dead_videos} deleted video{item.dead_videos === 1 ? "" : "s"}</Badge> : null}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-caption text-ink-500 md:block">
                    {item.state === "scheduled" ? `Goes live ${formatDate(item.published_at, true)}` : `Edited ${formatDate(item.updated_at)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState title="Nothing matches">
          {Object.values(filters).some(Boolean) ? <Link href="/studio/archive" className="font-bold text-primary-700 underline">Clear the filters</Link> : "The archive is empty."}
        </EmptyState>
      )}

      <div className="flex items-center justify-between text-meta text-ink-600">
        <span>
          {data.count} item{data.count === 1 ? "" : "s"}
          {pages > 1 ? ` · page ${page} of ${pages}` : ""}
        </span>
        {pages > 1 ? (
          <span className="flex gap-2">
            {page > 1 ? <ButtonLink size="sm" href={href({ page: String(page - 1) })}>Previous</ButtonLink> : null}
            {page < pages ? <ButtonLink size="sm" href={href({ page: String(page + 1) })}>Next</ButtonLink> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
