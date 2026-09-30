import type { ReactNode } from "react";

import { HolyIcon, LampIcon, ScrollIcon } from "@/components/home/icons";
import { Container } from "@/components/ui/Container";
import { paragraphs } from "@/lib/site/markup";
import type { SiteSections } from "@/lib/site/types";

/**
 * Who the ministry is, in its own words. The introduction beside the vision
 * and mission, then (as `children`) who we are and the leadership as a pair.
 * The vision card repeats the hero's blue-and-sun treatment on purpose: it is
 * the same message.
 */
export function AboutSection({
  data,
  children,
}: {
  data: SiteSections["about_intro"];
  children?: ReactNode;
}) {
  return (
    <section aria-labelledby="about-heading" className="relative border-t border-ink-100 bg-ink-0">
      <Container className="py-section">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="lg:self-center">
            <p className="text-eyebrow uppercase text-cyan-700">{data.eyebrow}</p>
            <div aria-hidden className="mt-3 h-1 w-12 bg-grad-rule" />
            <h2
              id="about-heading"
              className="text-display-lg mt-5 max-w-[16ch] text-primary-900 text-balance"
            >
              {data.heading}
            </h2>
            <p className="mt-6 max-w-prose text-prose-lg text-ink-600">{data.intro}</p>
          </div>

          <div className="grid content-start gap-5">
            {/* Vision */}
            <div className="on-dark relative overflow-hidden rounded-lg bg-grad-sapphire p-7 text-ink-0 shadow-lg sm:p-9">
              <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
              <div className="relative">
                <p className="flex items-center gap-3 text-eyebrow uppercase text-cyan-400">
                  <span aria-hidden className="h-1 w-8 bg-grad-rule" />
                  Our vision
                </p>
                <p className="mt-5 text-[clamp(2rem,1.2rem+2vw,2.75rem)] font-black uppercase leading-[1] tracking-[-0.03em]">
                  <span className="block text-cyan-400">{data.vision_accent}</span>
                  <span className="mt-2 inline-block bg-sun px-[0.18em] pb-[0.04em] pt-[0.1em] text-primary-950">
                    {data.vision_highlight}
                  </span>
                </p>
                <p className="mt-5 max-w-[44ch] text-body-sm text-ink-0/80">{data.vision_text}</p>
              </div>
            </div>

            {/* Mission */}
            <div className="relative overflow-hidden rounded-lg bg-grad-dawn p-7 shadow-md ring-1 ring-primary-100 sm:p-9">
              <div aria-hidden className="bg-dots pointer-events-none absolute inset-0" />
              <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-alert-500" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-eyebrow uppercase text-cyan-700">Our mission</p>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-grad-azure text-ink-0 shadow-md shadow-primary-700/25">
                    <LampIcon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-h3 text-primary-900 text-balance">{data.mission_heading}</p>
                <p className="mt-3 text-body-sm text-ink-700">{data.mission_text}</p>
              </div>
            </div>
          </div>
        </div>

        {children}
      </Container>
    </section>
  );
}

/** Who we are and the leadership: the ministry's own words, as supplied. */
export function AboutPillars({ data }: { data: SiteSections["about_pillars"] }) {
  const cards = [
    { n: "01", title: data.who_title, icon: HolyIcon, plate: "", body: data.who_body },
    {
      n: "02",
      title: data.leader_title,
      icon: ScrollIcon,
      plate: data.leader_name,
      body: data.leader_body,
    },
  ];

  return (
    <div className="mt-12 grid gap-6 md:grid-cols-2 lg:mt-16">
      {cards.map((p) => (
        <article
          key={p.n}
          className="group relative flex flex-col overflow-hidden rounded-lg bg-ink-0 p-7 shadow-lg ring-1 ring-ink-100 transition-all duration-300 ease-emphasis hover:-translate-y-1 hover:shadow-xl hover:ring-primary-200 sm:p-9"
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-cyan-400" />
          <p.icon
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-primary-50 transition-transform duration-700 ease-emphasis group-hover:scale-105"
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-grad-azure text-ink-0 shadow-md shadow-primary-700/25">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="text-h3 text-primary-900">{p.title}</h3>
            </div>
            <span className="font-display text-h2 tabular-nums text-primary-100 sm:text-display-lg">
              {p.n}
            </span>
          </div>

          {p.plate ? (
            <p className="relative mt-6 rounded-md border-l-4 border-cyan-400 bg-primary-50 px-4 py-3 text-body font-extrabold text-primary-900">
              {p.plate}
            </p>
          ) : (
            <div aria-hidden className="relative mt-6 h-px w-full bg-ink-100" />
          )}

          <div className="relative mt-5 space-y-3 text-body text-ink-600">
            {paragraphs(p.body).map((para, i) => (
              <p key={i} className={i === 0 ? "text-ink-800" : undefined}>
                {para}
              </p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
