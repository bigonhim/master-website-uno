import type { ReactNode } from "react";

/**
 * The reading column. Source Serif, capped at 68ch.
 *
 * This is the only place the serif appears — transcripts, testimonies and the
 * salvation prayer. Montserrat everywhere else is what makes the brand read as
 * Montserrat; a geometric sans across a 2,000-word transcript would not.
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
        // Headings inside prose stay Montserrat: sans chrome, serif content.
        "prose-headings:font-display prose-headings:tracking-tight",
        "prose-p:text-ink-800 prose-li:text-ink-800",
        "prose-a:text-primary-500 prose-a:underline-offset-2",
        "prose-strong:text-ink-900",
        "prose-blockquote:border-l-2 prose-blockquote:border-gold-500",
        "prose-blockquote:not-italic prose-blockquote:text-ink-700",
        "[.on-dark_&]:prose-p:text-ink-100 [.on-dark_&]:prose-headings:text-ink-0",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
