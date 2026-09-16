import type { ElementType, ReactNode } from "react";

/**
 * The single horizontal rhythm for the site. Every page uses this rather than
 * ad-hoc max-w/px pairs, so gutters stay identical at every breakpoint.
 */
export function Container({
  as: Tag = "div",
  width = "default",
  className = "",
  children,
}: {
  as?: ElementType;
  /** `prose` caps the measure at 68ch for long-form reading. */
  width?: "default" | "prose" | "wide";
  className?: string;
  children: ReactNode;
}) {
  const widths = {
    default: "max-w-container",
    prose: "max-w-prose",
    wide: "max-w-none",
  } as const;

  return (
    <Tag className={`mx-auto w-full px-5 sm:px-8 lg:px-12 ${widths[width]} ${className}`}>
      {children}
    </Tag>
  );
}
