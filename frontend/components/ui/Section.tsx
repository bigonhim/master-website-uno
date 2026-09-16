import type { ReactNode } from "react";

import { Container } from "./Container";

/**
 * A vertical band. `tone` is what keeps the page composed: the light theme
 * stays striking by alternating a dominant dark mass against milk, rather than
 * sprinkling colour evenly.
 */
export function Section({
  tone = "default",
  spacing = "default",
  className = "",
  containerWidth = "default",
  children,
}: {
  tone?: "default" | "sunken" | "royal" | "dawn";
  spacing?: "sm" | "default" | "lg";
  className?: string;
  containerWidth?: "default" | "prose" | "wide";
  children: ReactNode;
}) {
  const tones = {
    default: "bg-ink-0 text-ink-800",
    sunken: "bg-ink-25 text-ink-800",
    // `on-dark` unlocks the guarded sun/gold tokens and the gold focus ring.
    royal: "on-dark bg-grad-royal text-ink-0 grad-dither",
    dawn: "bg-grad-dawn text-ink-800",
  } as const;

  const spacings = {
    sm: "py-section-sm",
    default: "py-section",
    lg: "py-section-lg",
  } as const;

  return (
    <section className={`${tones[tone]} ${spacings[spacing]} ${className}`}>
      <Container width={containerWidth}>{children}</Container>
    </section>
  );
}
