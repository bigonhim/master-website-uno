import type { Metadata } from "next";
import type { ComponentType, SVGProps } from "react";

import { HolyIcon, ScrollIcon } from "@/components/home/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Who the Ministry of Repentance and Holiness is, and the leadership of Prophet Dr. David Edward Owuor.",
  alternates: { canonical: "/about" },
};

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// The ministry's own words, as supplied; keep them verbatim. A new section is
// one more entry here: the cards number themselves in order.
const SECTIONS: {
  title: string;
  icon: IconType;
  /** A name, shown as a plate under the heading. */
  plate?: string;
  body: string[];
}[] = [
  {
    title: "Who we are",
    icon: HolyIcon,
    body: [
      "The Ministry of Repentance and Holiness is a prophetic ministry raised to awaken the Church to the urgency of repentance and holy living. It proclaims that salvation is found only through the finished work of the Cross and that a holy life is the evidence of true redemption.",
      "The ministry stands firmly on the authority of the Holy Scriptures and teaches uncompromising obedience to the Word of GOD as the only way to prepare for the Kingdom of Heaven.",
    ],
  },
  {
    title: "The leadership",
    icon: ScrollIcon,
    plate: "Prophet Dr. David Edward Owuor",
    body: [
      "The ministry is led by Prophet Dr. David Edward Owuor, the Servant of THE LORD, sent to restore repentance and holiness in the Church and to prepare the way for the coming of the Messiah.",
      "His calling is centred on obedience to the voice of THE LORD GOD OF ISRAEL and the proclamation of righteousness, holiness and repentance, pointing all glory to GOD alone.",
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="The ministry"
        title="About us"
        lede="The Ministry of Repentance and Holiness was founded in 2005 and is led by Prophet Dr. David Edward Owuor. It is a global end-time ministry mandated by THE LORD GOD OF ISRAEL to prepare the nations for the imminent and glorious coming of THE LORD JESUS CHRIST."
      />

      <Container className="py-section-sm">
        <div className="grid gap-6 md:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <article
              key={s.title}
              className="group relative flex flex-col overflow-hidden rounded-lg bg-ink-0 p-7 shadow-lg ring-1 ring-ink-100 transition-all duration-300 ease-emphasis hover:-translate-y-1 hover:shadow-xl hover:ring-primary-200 sm:p-9"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-cyan-400"
              />
              <s.icon
                aria-hidden
                className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-primary-50 transition-transform duration-700 ease-emphasis group-hover:scale-105"
              />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-grad-azure text-ink-0 shadow-md shadow-primary-700/25">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-h3 text-primary-900">{s.title}</h2>
                </div>
                <span
                  aria-hidden
                  className="font-display text-h2 tabular-nums text-primary-100 sm:text-display-lg"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {s.plate ? (
                <p className="relative mt-6 rounded-md border-l-4 border-cyan-400 bg-primary-50 px-4 py-3 text-body font-extrabold text-primary-900">
                  {s.plate}
                </p>
              ) : (
                <div
                  aria-hidden
                  className="relative mt-6 h-px w-full bg-ink-100"
                />
              )}

              <div className="relative mt-5 space-y-3 text-body text-ink-600">
                {s.body.map((para, j) => (
                  <p
                    key={para.slice(0, 24)}
                    className={j === 0 ? "text-ink-800" : undefined}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </>
  );
}
