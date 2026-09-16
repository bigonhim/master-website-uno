import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { ContentItem } from "@/lib/api/types";

/**
 * The single card layout. Teachings, prophecies and healings differ only in the
 * metadata they surface, so they share this rather than each growing a variant
 * that drifts.
 */
export function ContentCard({
  item,
  href,
  priority = false,
}: {
  item: ContentItem;
  href: string;
  priority?: boolean;
}) {
  const primary = item.videos.find((v) => v.is_primary) ?? item.videos[0];
  const dead = primary?.availability === "unavailable";

  return (
    <article className="group flex flex-col overflow-hidden rounded-sm bg-ink-0 ring-1 ring-inset ring-ink-100 transition-shadow duration-300 ease-emphasis hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative aspect-video overflow-hidden bg-primary-950">
          {primary && !dead ? (
            <Image
              src={primary.thumbnail_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-emphasis group-hover:scale-[1.03]"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-ink-50">
              <span className="text-caption uppercase tracking-wider text-ink-500">
                {dead ? "Recording unavailable" : "No recording"}
              </span>
            </div>
          )}
          {item.videos.length > 1 ? (
            <span className="absolute bottom-2 right-2 rounded-xs bg-primary-950/85 px-2 py-0.5 text-caption text-ink-0">
              {item.videos.length} parts
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {item.category ? (
            <Badge tone="published">{item.category.name}</Badge>
          ) : null}
          {item.is_fulfilled ? <Badge tone="fulfilled">Fulfilled</Badge> : null}
          {dead ? <Badge tone="danger">Unavailable</Badge> : null}
        </div>

        {item.kicker ? (
          <p className="mt-3 text-eyebrow uppercase text-primary-500">{item.kicker}</p>
        ) : null}

        <h3 className="mt-2 text-h4 text-ink-900">
          <Link
            href={href}
            className="underline-offset-4 outline-none transition-colors group-hover:text-primary-700 group-focus-within:underline"
          >
            {item.title}
          </Link>
        </h3>

        {item.summary ? (
          <p className="mt-2 line-clamp-3 text-body-sm text-ink-600">{item.summary}</p>
        ) : null}

        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-ink-500">
          {item.speaker ? <span>{item.speaker}</span> : null}
          {/* Almost the entire imported archive is undated, so this says so
              plainly rather than inventing a date or hiding the field. */}
          <span className="tabular-nums">
            {item.is_dated && item.prophecy_date
              ? new Date(item.prophecy_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Date not recorded"}
          </span>
        </p>
      </div>
    </article>
  );
}
