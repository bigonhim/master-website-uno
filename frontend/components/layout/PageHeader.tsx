import type { ReactNode } from "react";

import { Bar, LeadIn } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";

/**
 * The light page header, dressed as the ministry's video title cards: a cyan
 * lead-in, the title in a navy bar with yellow type, and the count set like the
 * video's date card — heavy numerals behind a red rule.
 *
 * The page itself stays light; only the title carries the navy.
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
            <LeadIn>{eyebrow}</LeadIn>
            <h1 className="text-display-lg mt-4 uppercase leading-[1.3]">
              <Bar tone="gold">{title}</Bar>
            </h1>
            {lede ? <p className="mt-5 text-body text-ink-600">{lede}</p> : null}
          </div>

          {count !== undefined ? (
            <p className="flex flex-col border-l-4 border-alert-500 pl-4">
              <span className="text-display-lg tabular-nums text-primary-900">
                {count.toLocaleString()}
              </span>
              <span className="mt-1 text-eyebrow uppercase text-ink-600">
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
