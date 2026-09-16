import type { Metadata } from "next";
import Link from "next/link";

import { ContentCard } from "@/components/content/ContentCard";
import { PlayRadioButton } from "@/components/radio/PlayRadioButton";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getArchive } from "@/lib/api/content";
import type { ContentItem } from "@/lib/api/types";

export const metadata: Metadata = {
  description:
    "Repent, and prepare the way for the LORD. Teachings, prophecies and healing testimonies from the Ministry of Repentance and Holiness, Nakuru, Kenya.",
};

async function loadHome(): Promise<{
  latest: ContentItem[];
  counts: { prophecies: number; teachings: number; healings: number };
  reachable: boolean;
}> {
  try {
    const [prophecies, teachings, healings] = await Promise.all([
      getArchive("prophecies", { limit: 3 }),
      getArchive("teachings", { limit: 1 }),
      getArchive("healings", { limit: 1 }),
    ]);
    return {
      latest: prophecies.results,
      counts: {
        prophecies: prophecies.count,
        teachings: teachings.count,
        healings: healings.count,
      },
      reachable: true,
    };
  } catch {
    // The page still says what it has to say; it just does not claim to know
    // what is in the archive. No invented numbers, no placeholder cards.
    return {
      latest: [],
      counts: { prophecies: 0, teachings: 0, healings: 0 },
      reachable: false,
    };
  }
}

const SECTIONS = [
  {
    href: "/prophecies",
    title: "Prophecies",
    body: "Prophetic words given through the ministry, gathered from two decades of recordings.",
  },
  {
    href: "/teachings",
    title: "Teachings",
    body: "Messages on repentance, holiness and preparing for the coming of the Messiah.",
  },
  {
    href: "/healings",
    title: "Healings",
    body: "Testimonies of healing recorded at services and crusades across the nations.",
  },
];

export default async function HomePage() {
  const { latest, counts, reachable } = await loadHome();

  return (
    <>
      {/* Light hero. The weight comes from the type, not from a dark slab. */}
      <section className="border-b border-ink-100 bg-gradient-to-b from-primary-50 via-ink-0 to-ink-0">
        <Container className="pb-16 pt-16 lg:pb-20 lg:pt-24">
          <div className="max-w-[54ch]">
            <p className="text-eyebrow uppercase text-primary-500">Isaiah 40:3</p>
            <div aria-hidden className="mt-3 h-0.5 w-12 bg-grad-rule" />
            <h1 className="text-display-2xl mt-6 text-primary-900">
              Prepare the way
              <span className="block text-primary-700">for the LORD</span>
            </h1>
            <p className="mt-7 max-w-[52ch] font-prose text-prose-lg text-ink-600">
              A voice of one calling: in the wilderness prepare the way for the
              LORD; make straight in the desert a highway for our God.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/salvation-prayer" variant="primary" size="lg">
                The Salvation Prayer
              </ButtonLink>
              <ButtonLink href="/prophecies" variant="secondary" size="lg">
                Browse the archive
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* A quiet band of figures. An archive should be plain about its size. */}
      {reachable ? (
        <section className="border-b border-ink-100 bg-ink-25">
          <Container className="py-8">
            <dl className="grid grid-cols-3 gap-4">
              {[
                { label: "Prophecies", value: counts.prophecies, href: "/prophecies" },
                { label: "Teachings", value: counts.teachings, href: "/teachings" },
                { label: "Healings", value: counts.healings, href: "/healings" },
              ].map((stat) => (
                <div key={stat.href}>
                  <Link href={stat.href} className="group block">
                    <dd className="text-h2 tabular-nums text-primary-700">
                      {stat.value.toLocaleString()}
                    </dd>
                    <dt className="mt-1 text-eyebrow uppercase text-ink-500 group-hover:text-primary-700">
                      {stat.label}
                    </dt>
                  </Link>
                </div>
              ))}
            </dl>
          </Container>
        </section>
      ) : null}

      <section>
        <Container className="py-section-sm">
          <div className="grid gap-5 md:grid-cols-3">
            {SECTIONS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-sm border border-ink-100 bg-ink-0 p-6 transition-shadow duration-300 ease-emphasis hover:shadow-md"
              >
                <h2 className="text-h3 text-primary-800 group-hover:text-primary-700">
                  {card.title}
                </h2>
                <p className="mt-2 text-body-sm text-ink-600">{card.body}</p>
                <span className="mt-4 inline-block text-body-sm font-semibold text-primary-700 underline-offset-4 group-hover:underline">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {latest.length > 0 ? (
        <section className="border-t border-ink-100 bg-ink-25">
          <Container className="py-section-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-eyebrow uppercase text-primary-500">From the archive</p>
                <h2 className="text-h2 mt-3 text-primary-900">Recently published</h2>
              </div>
              <Link
                href="/prophecies"
                className="text-body-sm font-semibold text-primary-700 underline underline-offset-4"
              >
                See all prophecies →
              </Link>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((item, index) => (
                <ContentCard
                  key={item.slug}
                  item={item}
                  href={`/prophecies/${item.slug}`}
                  priority={index === 0}
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-t border-ink-100">
        <Container className="py-section-sm">
          <div className="grid items-center gap-6 rounded-sm border border-ink-100 bg-ink-0 p-8 lg:grid-cols-2">
            <div>
              <p className="text-eyebrow uppercase text-primary-500">
                Jesus is LORD Radio
              </p>
              <h2 className="text-h2 mt-3 max-w-[18ch] text-primary-900">
                Preparing the way, around the clock
              </h2>
              <p className="mt-3 max-w-[52ch] text-body text-ink-600">
                The ministry broadcasts from Nakuru. When the station is on air
                you can listen from the bar at the top of any page, and it keeps
                playing while you read.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <PlayRadioButton label="Listen live" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
