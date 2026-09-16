import type { ReactNode } from "react";

/**
 * An uppercase kicker above a heading, optionally over a gold hairline.
 *
 * This pairing replaces the blurred-circle decoration that makes so many
 * church sites look templated — structure carrying meaning instead of ornament.
 */
export function Eyebrow({
  rule = false,
  className = "",
  children,
}: {
  /** Draws the 2px gold gradient hairline beneath. */
  rule?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <p className="text-eyebrow uppercase text-primary-500 [.on-dark_&]:text-gold-400">
        {children}
      </p>
      {rule ? <div aria-hidden className="mt-3 h-0.5 w-16 bg-grad-rule" /> : null}
    </div>
  );
}
