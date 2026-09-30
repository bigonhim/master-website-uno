import Link from "next/link";

import { Thumb } from "@/components/studio/media/Thumb";
import { Badge, PageHeader, Panel } from "@/components/studio/ui";
import { formatDate } from "@/lib/studio/format";
import { studioGet } from "@/lib/studio/server";
import type { GallerySummary, Section, Slide } from "@/lib/studio/types";

export const metadata = { title: "Home page" };

export default async function HomeOverview() {
  const [slides, galleries, sections] = await Promise.all([
    studioGet<Slide[]>("slides/"),
    studioGet<GallerySummary[]>("galleries/"),
    studioGet<Section[]>("sections/"),
  ]);
  const active = slides.filter((s) => s.is_active);
  const featured = galleries.find((g) => g.is_featured);
  const homeSections = sections.filter((s) => s.group === "Home page");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="The site"
        title="Home page"
        description="The photos and words on the home page, top to bottom. The newest prophecy, articles and videos fill themselves in from the archive and YouTube."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Photos across the top"
          description={`${active.length} of ${slides.length} slides showing`}
          actions={<Link href="/studio/home/slides" className="text-meta font-bold text-primary-700 hover:underline">Edit slides</Link>}
        >
          {active.length ? (
            <Link href="/studio/home/slides" className="grid grid-cols-3 gap-2">
              {active.slice(0, 6).map((slide) => (
                <Thumb key={slide.id} asset={slide.image} className="rounded" sizes="160px" />
              ))}
            </Link>
          ) : (
            <p className="text-body-sm text-ink-600">
              No slides are showing, so the home page uses its built-in photos.
            </p>
          )}
        </Panel>

        <Panel
          title="Recognition gallery"
          description={featured ? `Showing “${featured.title}”` : "No gallery chosen: the built-in one shows"}
          actions={<Link href="/studio/home/galleries" className="text-meta font-bold text-primary-700 hover:underline">All galleries</Link>}
        >
          {featured ? (
            <Link href={`/studio/home/galleries/${featured.id}`} className="flex items-center gap-4">
              {featured.cover ? (
                <Thumb asset={featured.cover} className="w-40 shrink-0 rounded" sizes="160px" />
              ) : null}
              <span>
                <span className="block text-body-sm font-bold text-primary-900">{featured.title}</span>
                <span className="text-meta text-ink-600">{featured.photo_count} photos</span>
              </span>
            </Link>
          ) : (
            <Link href="/studio/home/galleries" className="text-body-sm font-bold text-primary-700 hover:underline">
              Choose or create a gallery
            </Link>
          )}
        </Panel>
      </div>

      <Panel title="Words on the home page" description="In the order they appear." padded={false}>
        <ul className="divide-y divide-ink-100">
          {homeSections.map((section) => (
            <li key={section.key}>
              <Link
                href={`/studio/text/${section.key}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-primary-50/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-body-sm font-bold text-primary-900">{section.label}</span>
                  <span className="block truncate text-meta text-ink-600">{section.description}</span>
                </span>
                {section.is_default ? (
                  <Badge>Original words</Badge>
                ) : (
                  <span className="text-right text-caption text-ink-500">
                    Edited {formatDate(section.updated_at)}
                    {section.updated_by ? <span className="block">by {section.updated_by}</span> : null}
                  </span>
                )}
                <span aria-hidden className="text-ink-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
