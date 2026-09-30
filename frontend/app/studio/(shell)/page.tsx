import Link from "next/link";

import { ActivityList } from "@/components/studio/ActivityList";
import { ButtonLink, PageHeader, Panel, cx } from "@/components/studio/ui";
import { can } from "@/lib/studio/client";
import { KIND_LABELS } from "@/lib/studio/format";
import { getEditor, studioGet } from "@/lib/studio/server";
import type { Dashboard } from "@/lib/studio/types";

export const metadata = { title: "Overview" };

export default async function StudioHome() {
  const [user, data] = await Promise.all([getEditor(), studioGet<Dashboard>("dashboard/")]);
  const { counts } = data;
  const firstName = user.name.split(" ")[0];

  const tiles = [
    { label: "Published", value: counts.published, href: "/studio/archive?state=published" },
    { label: "Drafts", value: counts.drafts, href: "/studio/archive?state=draft" },
    { label: "Need review", value: counts.needs_review, href: "/studio/archive?needs_review=1" },
    { label: "Scheduled", value: counts.scheduled, href: "/studio/archive?state=scheduled" },
    { label: "Photos", value: counts.photos, href: "/studio/media" },
    { label: "Videos", value: counts.videos, href: "/studio/videos" },
  ];

  const quick = [
    { href: "/studio/archive/new?kind=prophecy", label: "New prophecy", perm: "content.add_contentitem" },
    { href: "/studio/archive/new?kind=teaching", label: "New teaching", perm: "content.add_contentitem" },
    { href: "/studio/media", label: "Upload photos", perm: "media.add_mediaasset" },
    { href: "/studio/videos", label: "Add a video", perm: "content.add_video" },
    { href: "/studio/home/slides", label: "Change the hero photos", perm: "sitecontent.change_heroslide" },
  ].filter((a) => can(user, a.perm));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Studio"
        title={`Welcome, ${firstName}`}
        description="Everything on the site that changes from time to time: the home page's photos and words, the archive, videos and contact details. Saving publishes straight to the site."
      />

      {quick.length ? (
        <div className="flex flex-wrap gap-2">
          {quick.map((action, i) => (
            <ButtonLink key={action.href} href={action.href} variant={i === 0 ? "primary" : "secondary"}>
              {action.label}
            </ButtonLink>
          ))}
        </div>
      ) : null}

      {data.warnings.length ? (
        <ul className="space-y-2">
          {data.warnings.map((warning) => (
            <li key={warning.text}>
              <Link
                href={warning.href}
                className={cx(
                  "flex items-center justify-between gap-4 rounded-md px-4 py-3 text-body-sm font-semibold ring-1 ring-inset transition-colors",
                  warning.level === "danger" && "bg-[rgb(253_236_234)] text-danger ring-danger/20 hover:bg-[rgb(250_222_218)]",
                  warning.level === "warning" && "bg-[rgb(253_246_220)] text-[rgb(110_76_0)] ring-gold-400/40",
                  warning.level === "info" && "bg-primary-50 text-primary-800 ring-primary-100 hover:bg-primary-100",
                )}
              >
                {warning.text}
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-lg bg-ink-0 p-4 shadow-xs ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-200"
          >
            <span className="block font-display text-h2 tabular-nums text-primary-900">{tile.value}</span>
            <span className="mt-1 block text-meta text-ink-600">{tile.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title="Latest changes" description="Everything saved in the Studio, newest first." padded={false}
          actions={<Link href="/studio/history" className="text-meta font-bold text-primary-700 hover:underline">All history</Link>}>
          <ActivityList revisions={data.recent} empty="Nothing has been changed in the Studio yet." />
        </Panel>

        <Panel title="The archive" description="Published and waiting, by kind.">
          <ul className="divide-y divide-ink-100">
            {Object.entries(data.by_kind).map(([kind, n]) => (
              <li key={kind} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/studio/archive?kind=${kind}`} className="text-body-sm font-bold text-primary-800 hover:underline">
                  {KIND_LABELS[kind]?.many ?? kind}
                </Link>
                <span className="text-meta tabular-nums text-ink-600">
                  {n.published} published · {n.drafts} drafts
                </span>
              </li>
            ))}
          </ul>
          {counts.dead_videos ? (
            <p className="mt-4 text-meta text-ink-600">
              <Link href="/studio/videos?availability=unavailable" className="font-bold text-danger hover:underline">
                {counts.dead_videos} videos
              </Link>{" "}
              are deleted on YouTube and can&rsquo;t be played.
            </p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
