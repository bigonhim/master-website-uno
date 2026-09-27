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

/**
 * The channel's newest uploads, from its public feed. No API key and no
 * scraping: this is the feed YouTube publishes for exactly this. Revalidated
 * every half hour, so a new upload shows here without anyone adding it.
 */
export async function getLatestVideos(count = 6): Promise<ChannelVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 1800, tags: ["youtube"] },
  });
  if (!response.ok) throw new ApiError(response.status, url);
  return newestDistinct(parseChannelFeed(await response.text()), count);
}

/** A feed entry in the shape the player takes. */
export function asAttachedVideo(video: ChannelVideo): AttachedVideo {
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
