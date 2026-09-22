import Image from "next/image";

import logo from "@/public/brand/logo.png";

/**
 * The ministry's mark: the dove over the globe.
 *
 * One component so every placement ships the same file. The artwork's edge is
 * a vignette that fades to white, so on a dark surface it needs its white
 * ground back — `onDark` gives it a white disc rather than letting the fade
 * turn into a grey smudge against navy.
 *
 * Decorative by default, because it almost always sits beside the ministry's
 * name. Pass `alt` when it stands alone.
 */
export function Logo({
  size = 40,
  onDark = false,
  alt = "",
  priority = false,
  className = "",
}: {
  size?: number;
  onDark?: boolean;
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={logo}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 rounded-full ${onDark ? "bg-ink-0 p-[3%]" : ""} ${className}`}
    />
  );
}
