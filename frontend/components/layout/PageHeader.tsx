import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";

/**
 * The light page header that replaces the old full-bleed dark masthead.
 *
 * Weight now comes from the type and a hairline rule rather than from a dark
 * slab, so the page reads as one continuous light surface instead of a dark
 * band with white below it.
 */
export function PageHeader({
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
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-ink-100 bg-gradient-to-b from-primary-50/70 to-ink-0">
      <Container className="pb-10 pt-12 lg:pb-12 lg:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="max-w-[46ch]">
            <p className="text-eyebrow uppercase text-primary-500">{eyebrow}</p>
            <div aria-hidden className="mt-3 h-0.5 w-12 bg-grad-rule" />
            <h1 className="text-display-lg mt-5 text-primary-900">{title}</h1>
            {lede ? <p className="mt-4 text-body text-ink-600">{lede}</p> : null}
          </div>

          {count !== undefined ? (
            <p className="flex items-baseline gap-2.5">
              <span className="text-display-lg font-light tabular-nums text-primary-700">
                {count.toLocaleString()}
              </span>
              <span className="text-eyebrow uppercase text-ink-500">
                {countLabel ?? "entries"}
              </span>
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-8 max-w-xl">{children}</div> : null}
      </Container>
    </div>
  );
}
