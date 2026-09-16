/** Shapes the Django API guarantees. Verified against the live endpoint. */

export type RadioStatus = "live" | "offline" | "unknown";

export interface NowPlaying {
  title: string;
}

export interface RadioStatusPayload {
  status: RadioStatus;
  station_name: string;
  stream_url: string;
  /** Null when nothing is playing. radio.co sends the literal string " - " when
   *  idle; the backend normalises it so the UI never renders a stray dash. */
  now_playing: string | null;
  artwork_url: string | null;
  offline_message: string;
  schedule_note: string;
  /** True when served from the last known snapshot because upstream failed. */
  stale: boolean;
  checked_at: string;
}

export type VideoAvailability = "available" | "unavailable" | "unknown";

export interface AttachedVideo {
  youtube_id: string;
  label: string;
  order: number;
  is_primary: boolean;
  availability: VideoAvailability;
  allow_embed: boolean;
  thumbnail_url: string;
  embed_url: string;
  watch_url: string;
  duration_seconds: number | null;
}

export interface Facet {
  value: string;
  label: string;
  count: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  facets?: Record<string, Facet[]>;
}
