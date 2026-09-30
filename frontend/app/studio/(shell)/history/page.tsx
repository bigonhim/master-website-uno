import Link from "next/link";

import { ActivityList } from "@/components/studio/ActivityList";
import { ButtonLink, PageHeader, Panel, cx } from "@/components/studio/ui";
import { qs } from "@/lib/studio/client";
import { studioGet } from "@/lib/studio/server";
import type { Page, Revision } from "@/lib/studio/types";

export const metadata = { title: "History" };

const PER_PAGE = 30;

const AREAS = [
  { value: "", label: "Everything" },
  { value: "content.contentitem", label: "Archive" },
  { value: "sitecontent.sitesection", label: "Words" },
  { value: "sitecontent.heroslide", label: "Hero slides" },
  { value: "sitecontent.gallery", label: "Galleries" },
  { value: "media.mediaasset", label: "Photos" },
  { value: "content.video", label: "Videos" },
];

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string; page?: string }>;
}) {
  const { model, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const data = await studioGet<Page<Revision>>(
    `revisions/${qs({ model, limit: PER_PAGE, offset: (page - 1) * PER_PAGE })}`,
  );
  const pages = Math.max(1, Math.ceil(data.count / PER_PAGE));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="History"
        description="Every change saved in the Studio: who made it and when. Open anything to see its earlier versions and put one back."
      />
      <nav aria-label="Area" className="flex flex-wrap gap-2">
        {AREAS.map((area) => {
          const active = (model ?? "") === area.value;
          return (
            <Link
              key={area.value}
              href={`/studio/history${qs({ model: area.value })}`}
              aria-current={active ? "page" : undefined}
              className={cx(
                "rounded-full px-3 py-1.5 text-meta font-bold ring-1 ring-inset transition-colors",
                active ? "bg-primary-700 text-ink-0 ring-primary-700" : "bg-ink-0 text-ink-700 ring-ink-200 hover:ring-primary-300",
              )}
            >
              {area.label}
            </Link>
          );
        })}
      </nav>
      <Panel padded={false}>
        <ActivityList revisions={data.results} empty="Nothing here yet." />
      </Panel>
      {pages > 1 ? (
        <div className="flex items-center justify-between text-meta text-ink-600">
          <span>Page {page} of {pages}</span>
          <span className="flex gap-2">
            {page > 1 ? <ButtonLink size="sm" href={`/studio/history${qs({ model, page: page - 1 })}`}>Newer</ButtonLink> : null}
            {page < pages ? <ButtonLink size="sm" href={`/studio/history${qs({ model, page: page + 1 })}`}>Older</ButtonLink> : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
