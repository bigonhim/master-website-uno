import "server-only";

import { newestDistinct, parseChannelFeed, type ChannelVideo } from "@/lib/youtube/feed";

import { ApiError } from "./client";
import type { AttachedVideo } from "./types";

/**
 * The ministry's YouTube channel, "Repent & Prepare The Way": the one its
 * publication links to, and where new prophecies and services go up first.
 */
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID ?? "UCqdgi-yU4fVlOhKZLrz24rw";

export const YOUTUBE_CHANNEL_URL = `https://www.youtube.com/channel/${CHANNEL_ID}`;

async function channelFeed(): Promise<ChannelVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 1800, tags: ["youtube"] },
  });
  if (!response.ok) throw new ApiError(response.status, url);
  return parseChannelFeed(await response.text());
}

/**
 * The channel's newest uploads, from its public feed. No API key and no
 * scraping: this is the feed YouTube publishes for exactly this. Revalidated
 * every half hour, so a new upload shows here without anyone adding it.
 */
export async function getLatestVideos(count = 6): Promise<ChannelVideo[]> {
  return newestDistinct(await channelFeed(), count);
}

/**
 * The id of the broadcast the channel is streaming right now, or null.
 *
 * YouTube publishes no feed for this; the channel's /live page is the one
 * keyless signal. Only two facts are read from it — the canonical watch URL
 * and whether it declares that stream live now — and any doubt (an error, a
 * timeout, a page that says neither) reads as "not live", never as a crash.
 */
export async function getLiveVideoId(): Promise<string | null> {
  try {
    const response = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/live`, {
      signal: AbortSignal.timeout(8000),
      // Without a browser user agent YouTube serves a stripped page that
      // carries neither fact.
      headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
      // A minute stale is fine; half an hour of "LIVE" after the stream
      // has ended is not.
      next: { revalidate: 60, tags: ["youtube"] },
    });
    if (!response.ok) return null;
    const page = await response.text();
    // Off air, the page's canonical URL is the channel, not a watch URL.
    const id = page.match(
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})"/,
    )?.[1];
    return id && page.includes('"isLive":true') ? id : null;
  } catch {
    return null;
  }
}

/** What the watch page can say about a video. */
export interface WatchableVideo {
  id: string;
  title: string;
  /** Null once the video is older than the feed's fifteen entries. */
  publishedAt: string | null;
}

/**
 * One video, by id. The feed knows the channel's newest fifteen; for anything
 * older — a bookmarked watch page — oEmbed still gives the title. Null means
 * YouTube does not know the video either.
 */
export async function getChannelVideo(id: string): Promise<WatchableVideo | null> {
  try {
    const fromFeed = (await channelFeed()).find((video) => video.id === id);
    if (fromFeed) return fromFeed;
  } catch {
    // The feed being down does not make the video unknown; ask oEmbed.
  }
  const watch = `https://www.youtube.com/watch?v=${id}`;
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`,
    { signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } },
  );
  if (!response.ok) return null;
  const title = ((await response.json()) as { title?: unknown }).title;
  return typeof title === "string" && title ? { id, title, publishedAt: null } : null;
}

/** A channel video in the shape the player takes; only the id matters. */
export function asAttachedVideo(video: Pick<ChannelVideo, "id">): AttachedVideo {
  return {
    youtube_id: video.id,
    label: "",
    order: 0,
    is_primary: true,
    // It was in the channel's feed minutes ago.
    availability: "available",
    allow_embed: true,
    thumbnail_url: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    // youtube-nocookie sets no tracking cookie until the viewer presses play.
    embed_url: `https://www.youtube-nocookie.com/embed/${video.id}`,
    watch_url: `https://www.youtube.com/watch?v=${video.id}`,
    duration_seconds: null,
  };
}
