import type { ReactNode } from "react";

import { Bar, LeadIn } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";

/**
 * The light page header, dressed as the ministry's video title cards: a cyan
 * lead-in and the title in a navy bar with yellow type. `aside` sits opposite
 * the title on wide screens — the archives put their search there — and drops
 * below it on narrow ones.
 *
 * The page itself stays light; only the title carries the navy.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-ink-100 bg-gradient-to-b from-primary-50/70 to-ink-0">
      <Container className="py-5 lg:py-6">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="max-w-[46ch]">
            {eyebrow ? <LeadIn>{eyebrow}</LeadIn> : null}
            {/* Kept to bar height, not display size: the header is a label
                over the archive, and the shorter it stands, the more of the
                first two card rows arrive on screen with it. */}
            <h1 className={`text-h2 uppercase leading-[1.3] ${eyebrow ? "mt-3" : ""}`}>
              <Bar tone="gold">{title}</Bar>
            </h1>
            {lede ? <p className="mt-3 text-body-sm text-ink-600">{lede}</p> : null}
          </div>

          {aside ? <div className="w-full lg:w-[30rem]">{aside}</div> : null}
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </div>
  );
}
