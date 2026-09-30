/** Small formatting helpers for the Studio. */

const TIME_ZONE = "Africa/Nairobi";

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: TIME_ZONE,
  });
}

export function timeAgo(value: string, now = Date.now()): string {
  const seconds = Math.round((now - new Date(value).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "fulfillment_summary" -> "Fulfillment summary". */
export function fieldLabel(name: string): string {
  const words = name.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Where in the Studio a thing named in the history is edited. */
export function studioHref(model: string, id: string | number): string | null {
  switch (model) {
    case "content.contentitem":
      return `/studio/archive/${id}`;
    case "media.mediaasset":
      return `/studio/media?photo=${id}`;
    case "content.video":
      return `/studio/videos?video=${id}`;
    case "sitecontent.heroslide":
      return "/studio/home/slides";
    case "sitecontent.gallery":
      return `/studio/home/galleries/${id}`;
    case "sitecontent.galleryphoto":
      return "/studio/home/galleries";
    case "sitecontent.sitesection":
      return `/studio/text/${id}`;
    default:
      return null;
  }
}

export const KIND_LABELS: Record<string, { one: string; many: string; path: string }> = {
  prophecy: { one: "Prophecy", many: "Prophecies", path: "prophecies" },
  teaching: { one: "Teaching", many: "Teachings", path: "teachings" },
  healing: { one: "Healing", many: "Healings", path: "healings" },
  writing: { one: "Writing", many: "Writings", path: "writings" },
};

/** An ISO timestamp as the value of a datetime-local input, in Nairobi time. */
export function toLocalInput(value: string | null): string {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** A datetime-local value, read as Nairobi time (UTC+3, no daylight saving). */
export function fromLocalInput(value: string): string | null {
  return value ? new Date(`${value}:00+03:00`).toISOString() : null;
}
