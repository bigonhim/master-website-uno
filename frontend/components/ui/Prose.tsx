import type { ReactNode } from "react";

/**
 * The reading column: Montserrat at 500, capped at 68ch.
 *
 * Montserrat's wide letterforms tire the eye over a long transcript, so the
 * column compensates with measure and air rather than a second typeface: a
 * tight 68ch line, generous 1.8 leading, and heavy headings to break it up.
 */
export function Prose({
  size = "default",
  className = "",
  children,
}: {
  size?: "default" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "prose max-w-prose font-prose",
        size === "lg" ? "text-prose-lg" : "text-body",
        "font-medium prose-headings:font-display prose-headings:font-extrabold prose-headings:tracking-tight",
        "prose-p:text-ink-800 prose-li:text-ink-800",
        "prose-a:text-primary-500 prose-a:underline-offset-2",
        "prose-strong:font-extrabold prose-strong:text-primary-900",
        "prose-blockquote:border-l-4 prose-blockquote:border-alert-500",
        "prose-blockquote:not-italic prose-blockquote:text-ink-700",
        "[.on-dark_&]:prose-p:text-ink-100 [.on-dark_&]:prose-headings:text-ink-0",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
