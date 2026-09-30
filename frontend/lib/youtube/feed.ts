/**
 * Reads a YouTube channel's public Atom feed: its fifteen newest uploads.
 *
 * The feed is a fixed, machine-written format, so it is read with patterns
 * and no XML library. Everything taken from it is treated as text: a video id
 * must look like one or the entry is dropped, and titles are unescaped and
 * rendered as text, never as markup.
 */

export interface ChannelVideo {
  id: string;
  title: string;
  /** ISO 8601, as the feed gives it. */
  publishedAt: string;
}

const ENTRY = /<entry>([\s\S]*?)<\/entry>/g;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** True when `value` has the exact shape of a YouTube video id. */
export function isVideoId(value: string): boolean {
  return VIDEO_ID.test(value);
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function unescape(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] !== "#") return ENTITIES[body.toLowerCase()] ?? whole;
    const code =
      body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : whole;
  });
}

function tag(entry: string, name: string): string {
  const match = entry.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? unescape(match[1].trim()) : "";
}

export function parseChannelFeed(xml: string): ChannelVideo[] {
  const videos: ChannelVideo[] = [];
  for (const [, entry] of xml.matchAll(ENTRY)) {
    const id = tag(entry, "yt:videoId");
    const title = tag(entry, "title");
    const publishedAt = tag(entry, "published");
    if (!VIDEO_ID.test(id) || !title || Number.isNaN(Date.parse(publishedAt))) continue;
    videos.push({ id, title, publishedAt });
  }
  return videos;
}

/**
 * The newest `count` videos, one per title. The channel uploads a long
 * service as several parts under one title; three cards saying the same thing
 * would push everything else off the row.
 */
export function newestDistinct(videos: ChannelVideo[], count: number): ChannelVideo[] {
  const seen = new Set<string>();
  const kept: ChannelVideo[] = [];
  for (const video of [...videos].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )) {
    const key = video.title.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(video);
    if (kept.length === count) break;
  }
  return kept;
}
