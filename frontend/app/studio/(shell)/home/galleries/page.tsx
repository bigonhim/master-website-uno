import Link from "next/link";

import { Thumb } from "@/components/studio/media/Thumb";
import { Badge, ButtonLink, EmptyState, PageHeader } from "@/components/studio/ui";
import { can } from "@/lib/studio/client";
import { formatDate } from "@/lib/studio/format";
import { getEditor, studioGet } from "@/lib/studio/server";
import type { GallerySummary } from "@/lib/studio/types";

export const metadata = { title: "Galleries" };

export default async function GalleriesPage() {
  const [user, galleries] = await Promise.all([getEditor(), studioGet<GallerySummary[]>("galleries/")]);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/studio/home", label: "Home page" }}
        eyebrow="Home page"
        title="Galleries"
        description="Sets of photos with a heading, for the blue recognition band on the home page. Prepare the next one here, then put it on the home page when it's ready: one shows at a time."
        actions={
          can(user, "sitecontent.add_gallery") ? (
            <ButtonLink href="/studio/home/galleries/new" variant="primary">
              New gallery
            </ButtonLink>
          ) : null
        }
      />

      {galleries.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {galleries.map((g) => (
            <li key={g.id}>
              <Link
                href={`/studio/home/galleries/${g.id}`}
                className="block overflow-hidden rounded-lg bg-ink-0 shadow-xs ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-200"
              >
                {g.cover ? (
                  <Thumb asset={g.cover} sizes="(min-width: 1280px) 30vw, 50vw" />
                ) : (
                  <span className="grid aspect-[3/2] place-items-center bg-ink-50 text-meta text-ink-500">No photos yet</span>
                )}
                <span className="block p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-body-sm font-bold text-primary-900">{g.title}</span>
                    {g.is_featured ? <Badge tone="success">On the home page</Badge> : null}
                  </span>
                  <span className="mt-1 block text-meta text-ink-600">
                    {g.photo_count} photos · edited {formatDate(g.updated_at)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No galleries yet">
          The home page shows its built-in gallery until one is made here and put on it.
        </EmptyState>
      )}
    </div>
  );
}
