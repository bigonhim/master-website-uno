import Image from "next/image";

import type { AssetSummary } from "@/lib/studio/types";

import { cx } from "../ui";

/** A library photo, cropped around its focal point. */
export function Thumb({
  asset,
  className = "",
  sizes = "200px",
  aspect = "aspect-[3/2]",
}: {
  asset: Pick<AssetSummary, "url" | "alt_text" | "title" | "focal_x" | "focal_y">;
  className?: string;
  sizes?: string;
  aspect?: string;
}) {
  return (
    <span className={cx("relative block overflow-hidden bg-ink-100", aspect, className)}>
      <Image
        src={asset.url}
        alt={asset.alt_text || asset.title}
        fill
        sizes={sizes}
        className="object-cover"
        style={{ objectPosition: `${asset.focal_x * 100}% ${asset.focal_y * 100}%` }}
      />
    </span>
  );
}
