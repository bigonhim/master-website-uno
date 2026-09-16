/** Shapes the Django API guarantees. Verified against the live endpoints. */

/* ------------------------------------------------------------------ radio */

export type RadioStatus = "live" | "offline" | "unknown";

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

/* ------------------------------------------------------------------ media */

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

/* ---------------------------------------------------------------- content */

export type ContentKind = "teaching" | "prophecy" | "healing" | "writing";
export type DateSource = "title_parsed" | "manual" | "unknown";

export interface Category {
  name: string;
  slug: string;
  description: string;
}

export interface Region {
  name: string;
  slug: string;
  iso2: string;
  continent: string;
}

export interface Series {
  title: string;
  slug: string;
  description: string;
  starts_on: string | null;
  ends_on: string | null;
  location: string;
}

export interface ContentItem {
  slug: string;
  kind: ContentKind;
  kicker: string;
  title: string;
  speaker: string;
  summary: string;
  category: Category | null;
  published_at: string | null;
  prophecy_date: string | null;
  date_source: DateSource;
  date_precision: string;
  /** False for almost the whole imported archive — the source carried no dates. */
  is_dated: boolean;
  is_fulfilled: boolean;
  condition: string;
  videos: AttachedVideo[];
}

export interface ContentDetail extends ContentItem {
  body: string;
  fulfillment_summary: string;
  regions: Region[];
  series: Series | null;
  position_in_series: number | null;
  is_anonymous: boolean;
  language: string;
  updated_at: string;
}

/* ------------------------------------------------------------- collections */

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
