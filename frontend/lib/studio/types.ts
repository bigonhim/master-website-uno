/** Shapes of the Studio API (backend/apps/studio/serializers). */

export interface StudioUser {
  id: number;
  username: string;
  name: string;
  email: string;
  is_superuser: boolean;
  permissions: string[];
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Usage {
  model: string;
  type: string;
  id: number;
  label: string;
}

export interface AssetSummary {
  id: number;
  url: string;
  title: string;
  alt_text: string;
  width: number;
  height: number;
  focal_x: number;
  focal_y: number;
}

export interface Asset extends AssetSummary {
  caption: string;
  credit: string;
  collection: string;
  file_size: number;
  original_filename: string;
  uploaded_by: string;
  usage_count: number;
  usage?: Usage[];
  created_at: string;
  updated_at: string;
  version: string;
  duplicate?: boolean;
}

export type Availability = "available" | "unavailable" | "unknown";

export interface Video {
  id: number;
  youtube_id: string;
  title: string;
  availability: Availability;
  allow_embed: boolean;
  thumbnail_override: string;
  thumbnail_url: string;
  watch_url: string;
  embed_url: string;
  duration_seconds: number | null;
  last_checked_at: string | null;
  usage_count: number;
  usage?: Usage[];
  created_at: string;
  updated_at: string;
  version: string;
  duplicate?: boolean;
}

export type Kind = "teaching" | "prophecy" | "healing" | "writing";
export type ItemState = "draft" | "scheduled" | "published";

export interface ItemSummary {
  id: number;
  kind: Kind;
  title: string;
  kicker: string;
  slug: string;
  status: "draft" | "published";
  state: ItemState;
  category: string;
  published_at: string | null;
  prophecy_date: string | null;
  needs_review: boolean;
  thumbnail_url: string;
  video_count: number;
  dead_videos: number;
  updated_at: string;
}

export interface AttachedVideo {
  video: number;
  label: string;
  is_primary: boolean;
  youtube_id: string;
  title: string;
  thumbnail_url: string;
  availability: Availability;
}

/** The fields an editor writes. */
export interface ItemFields {
  kind: Kind;
  title: string;
  slug: string;
  kicker: string;
  speaker: string;
  summary: string;
  body: string;
  category: number | null;
  regions: number[];
  series: number | null;
  position_in_series: number | null;
  published_at: string | null;
  prophecy_date: string | null;
  date_source: string;
  date_precision: string;
  is_fulfilled: boolean;
  fulfillment_summary: string;
  condition: string;
  is_anonymous: boolean;
  is_featured: boolean;
  needs_review: boolean;
  videos: AttachedVideo[];
}

export interface Item extends ItemFields {
  id: number;
  status: "draft" | "published";
  state: ItemState;
  public_path: string;
  title_source: string;
  title_yt: string;
  confidence: number;
  created_at: string;
  updated_at: string;
  version: string;
}

export interface Choice {
  value: string;
  label: string;
}

export interface Taxonomy {
  kinds: Choice[];
  categories: { id: number; name: string }[];
  regions: { id: number; name: string }[];
  series: { id: number; title: string }[];
  date_sources: Choice[];
  date_precisions: Choice[];
}

export interface Slide {
  id: number;
  image: AssetSummary;
  image_id: number;
  alt_text: string;
  place: string;
  detail: string;
  event: string;
  frame_x: number;
  frame_y: number;
  frame_lg_x: number;
  frame_lg_y: number;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  version: string;
}

export interface GalleryPhotoRow {
  id?: number;
  image: AssetSummary;
  image_id: number;
  title: string;
  caption: string;
  alt_text: string;
}

export interface Gallery {
  id: number;
  title: string;
  eyebrow: string;
  heading: string;
  place_name: string;
  place_detail: string;
  summary: string;
  photos: GalleryPhotoRow[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  version: string;
}

export interface GallerySummary {
  id: number;
  title: string;
  heading: string;
  is_featured: boolean;
  photo_count: number;
  cover: AssetSummary | null;
  updated_at: string;
}

export interface SectionField {
  name: string;
  label: string;
  kind: "text" | "textarea" | "phone" | "email" | "items";
  max_length: number;
  required: boolean;
  help: string;
  markup: boolean;
  count?: number;
  item_fields?: SectionField[];
}

export type SectionValue = string | Record<string, string>[];
export type SectionData = Record<string, SectionValue>;

export interface Section {
  key: string;
  label: string;
  group: string;
  description: string;
  page: string;
  fields: SectionField[];
  data: SectionData;
  defaults: SectionData;
  is_default: boolean;
  updated_at: string | null;
  updated_by: string;
  version: string;
}

export interface Revision {
  id: number;
  model: string;
  object_id: string;
  object_repr: string;
  action: string;
  action_label: string;
  changed_fields: string[];
  user: string;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface Dashboard {
  counts: {
    drafts: number;
    needs_review: number;
    published: number;
    scheduled: number;
    photos: number;
    videos: number;
    dead_videos: number;
    slides: number;
  };
  by_kind: Record<Kind, { published: number; drafts: number }>;
  warnings: { level: "info" | "warning" | "danger"; text: string; href: string }[];
  recent: Revision[];
}
