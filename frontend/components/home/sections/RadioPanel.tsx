import type { ReactNode } from "react";

import { RadioIcon } from "@/components/home/icons";
import { Container } from "@/components/ui/Container";
import type { SiteSections } from "@/lib/site/types";

// Static equaliser: decoration only, so it does not pretend the station is
// broadcasting when it is not.
const BARS = [
  18, 34, 26, 48, 30, 62, 40, 24, 52, 36, 70, 44, 28, 58, 38, 22, 46, 32, 64, 42, 26, 54, 34,
  20, 50, 40, 72, 46, 30, 60, 36, 24, 44, 56, 28, 40, 66, 32, 48, 26,
];

/**
 * The invitation to listen. `action` is the play control: the live one on the
 * site, a stand-in in the Studio's preview, which has no player.
 */
export function RadioPanel({
  data,
  action,
}: {
  data: SiteSections["home_radio"];
  action: ReactNode;
}) {
  return (
    <section>
      <Container className="py-section-sm">
        <div className="relative grid items-center gap-8 overflow-hidden rounded-lg border border-ink-100 bg-gradient-to-br from-primary-50 via-ink-0 to-ink-0 p-8 lg:grid-cols-[1fr_auto] lg:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-between gap-1.5 px-8 opacity-70"
          >
            {BARS.map((h, i) => (
              <span
                key={i}
                className="w-1.5 rounded-t-sm bg-primary-100"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          <div className="relative flex gap-5">
            <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-700 text-ink-0 shadow-md shadow-primary-700/25 sm:grid">
              <RadioIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-eyebrow uppercase text-cyan-700">{data.eyebrow}</p>
              <h2 className="text-h2 mt-3 max-w-[18ch] text-primary-900">{data.heading}</h2>
              <p className="mt-3 max-w-[52ch] text-body text-ink-600">{data.body}</p>
            </div>
          </div>
          <div className="relative rounded-md bg-ink-0/90 p-5 shadow-md ring-1 ring-ink-100 backdrop-blur lg:justify-self-end">
            {action}
          </div>
        </div>
      </Container>
    </section>
  );
}
