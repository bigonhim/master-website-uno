import Link from "next/link";

import { ArrowIcon, HolyIcon, LampIcon, RepentIcon } from "@/components/home/icons";
import { Container } from "@/components/ui/Container";
import type { SiteSections } from "@/lib/site/types";

// Each card keeps its icon and destination; the Studio edits only the words.
const WIRING = [
  { n: "01", icon: RepentIcon, href: "/salvation-prayer" },
  { n: "02", icon: HolyIcon, href: "/teachings" },
  { n: "03", icon: LampIcon, href: "/prophecies" },
];

/** Repent. Be holy. Prepare: the call the whole archive comes back to. */
export function MessageSection({ data }: { data: SiteSections["home_message"] }) {
  return (
    <section className="relative overflow-hidden border-t border-ink-100 bg-grad-dawn">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0" />
      <Container className="relative py-section">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-eyebrow uppercase text-cyan-700">{data.eyebrow}</p>
          <div aria-hidden className="mx-auto mt-3 h-1 w-12 bg-grad-rule" />
          <h2 className="text-display-lg mt-5 text-primary-900">{data.heading}</h2>
          <p className="mt-4 text-prose-lg text-ink-600">{data.intro}</p>
        </div>

        <ol className="mt-14 grid gap-6 lg:grid-cols-3">
          {data.pillars.slice(0, WIRING.length).map((p, i) => {
            const { n, icon: Icon, href } = WIRING[i];
            return (
              <li
                key={n}
                className="relative flex flex-col rounded-md border border-ink-100 bg-ink-0/90 p-7 shadow-sm backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-display-lg tabular-nums text-primary-100">
                    {n}
                  </span>
                </div>
                <h3 className="mt-5 text-h3">{p.title}</h3>
                <blockquote className="mt-4 border-l-4 border-cyan-400 pl-4 text-body italic text-ink-700">
                  &ldquo;{p.quote}&rdquo;
                  <footer className="mt-1 font-display text-meta font-extrabold uppercase not-italic text-cyan-700">
                    {p.reference}
                  </footer>
                </blockquote>
                <p className="mt-4 flex-1 text-body-sm text-ink-600">{p.body}</p>
                <Link
                  href={href}
                  className="mt-6 inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary-700 underline-offset-4 hover:underline"
                >
                  {p.link}
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
