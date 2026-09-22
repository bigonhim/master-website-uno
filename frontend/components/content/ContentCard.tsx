import Link from "next/link";

import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { Badge } from "@/components/ui/Badge";
import { LowerThird } from "@/components/ui/Broadcast";
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
      {/* Plays right here in the card: one press, no trip to the detail page
          or to YouTube. Only dead or missing recordings fall back to a link. */}
      {primary && !dead ? (
        <YouTubeEmbed video={primary} title={item.title} priority={priority} flush />
      ) : (
        <Link href={href} className="block">
          <div className="flex aspect-video items-center justify-center bg-ink-50">
            <span className="text-caption uppercase tracking-wider text-ink-500">
              {dead ? "Recording unavailable" : "No recording"}
            </span>
          </div>
        </Link>
      )}

      {/* The lower third: kind and date, butted under the picture as in the
          ministry's broadcasts. Almost the entire imported archive is undated,
          so it says so plainly rather than inventing a date. */}
      <LowerThird
        kind={item.kind}
        date={
          item.is_dated && item.prophecy_date
            ? new Date(item.prophecy_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Date not recorded"
        }
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 empty:hidden">
          {item.category ? (
            <Badge tone="published">{item.category.name}</Badge>
          ) : null}
          {item.is_fulfilled ? <Badge tone="fulfilled">Fulfilled</Badge> : null}
          {dead ? <Badge tone="danger">Unavailable</Badge> : null}
          {/* Lives here, not over the video, where it would cover the
              player's own controls. */}
          {item.videos.length > 1 ? (
            <Badge tone="neutral">{item.videos.length} parts</Badge>
          ) : null}
        </div>

        {item.kicker ? (
          <p className="mt-3 text-eyebrow uppercase text-cyan-700">{item.kicker}</p>
        ) : null}

        <h3 className="mt-2 text-h4 text-primary-900">
          <Link
            href={href}
            className="underline-offset-4 outline-none transition-colors group-hover:text-primary-600 group-focus-within:underline"
          >
            {item.title}
          </Link>
        </h3>

        {item.summary ? (
          <p className="mt-2 line-clamp-3 text-body-sm text-ink-600">{item.summary}</p>
        ) : null}

        {item.speaker ? (
          <p className="mt-4 text-meta text-ink-600">{item.speaker}</p>
        ) : null}
      </div>
    </article>
  );
}
