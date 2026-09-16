import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * The dark mass every page opens with, dropping hard to the milk ground below.
 *
 * That contrast is what keeps a light theme striking rather than bland, and the
 * headline is text over a CSS gradient rather than a hero image — a design
 * choice made for performance, so the largest paint costs nothing to download.
 */
export function PageMasthead({
  eyebrow,
  title,
  lede,
  count,
  countLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  count?: number;
  countLabel?: string;
  /** Slot for the scoped search bar. */
  children?: ReactNode;
}) {
  return (
    <div className="on-dark grad-dither bg-grad-royal">
      <Container className="py-section-sm">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow rule>{eyebrow}</Eyebrow>
            <h1 className="text-display-xl mt-6 max-w-[16ch]">{title}</h1>
            {lede ? (
              <p className="mt-5 max-w-[56ch] text-body text-ink-200">{lede}</p>
            ) : null}
          </div>

          {count !== undefined ? (
            // An archive should be proud of its size; the numeral is the ornament.
            <div className="flex items-end lg:col-span-5 lg:justify-end">
              <p className="flex items-baseline gap-3">
                <span className="text-display-lg font-light tabular-nums text-gold-400">
                  {count.toLocaleString()}
                </span>
                <span className="text-eyebrow uppercase text-ink-300">
                  {countLabel ?? "entries"}
                </span>
              </p>
            </div>
          ) : null}
        </div>
        {children ? <div className="mt-8 max-w-xl">{children}</div> : null}
      </Container>
    </div>
  );
}
