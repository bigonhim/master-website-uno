import type { Metadata } from "next";
import Link from "next/link";

import { ContentCard } from "@/components/content/ContentCard";
import { PlayRadioButton } from "@/components/radio/PlayRadioButton";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { getArchive } from "@/lib/api/content";
import type { ContentItem } from "@/lib/api/types";

export const metadata: Metadata = {
  description:
    "Repent, and prepare the way for the LORD. Teachings, prophecies and healing testimonies from the Ministry of Repentance and Holiness, Nakuru, Kenya.",
};

type Counts = { prophecies: number; teachings: number; healings: number };

async function loadHome(): Promise<{
  latest: ContentItem[];
  counts: Counts;
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
    // The page still renders its own words; it just does not claim to know
    // what is in the archive. No invented numbers, no placeholder cards.
    return {
      latest: [],
      counts: { prophecies: 0, teachings: 0, healings: 0 },
      reachable: false,
    };
  }
}

function Stat({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 rounded-sm px-2 py-3 transition-colors hover:bg-ink-0/5"
    >
      <span className="text-display-lg font-light tabular-nums text-gold-400">
        {value.toLocaleString()}
      </span>
      <span className="text-eyebrow uppercase text-ink-300 group-hover:text-ink-0">
        {label}
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const { latest, counts, reachable } = await loadHome();

  return (
    <>
      {/* The thesis: the verse the ministry is named for, set as the page's
          largest graphic element. Text over a CSS gradient, so the largest
          paint costs nothing to download. */}
      <section className="on-dark grad-dither relative bg-grad-royal">
        <Container className="py-section-lg">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Eyebrow rule>Isaiah 40:3</Eyebrow>
              <h1 className="text-display-2xl mt-7 max-w-[13ch]">
                Prepare the way for the <span className="text-sun">LORD</span>
              </h1>
              <p className="mt-7 max-w-[52ch] font-prose text-prose-lg text-ink-200">
                A voice of one calling: in the wilderness prepare the way for the
                LORD; make straight in the desert a highway for our God.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ButtonLink href="/salvation-prayer" variant="gold" size="lg">
                  The Salvation Prayer
                </ButtonLink>
                <ButtonLink href="/prophecies" variant="secondary" size="lg">
                  Browse the archive
                </ButtonLink>
                <PlayRadioButton />
              </div>
            </div>

            <div className="flex items-end lg:col-span-4">
              {reachable ? (
                <div className="grid w-full grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0">
                  <Stat value={counts.prophecies} label="Prophecies" href="/prophecies" />
                  <Stat value={counts.teachings} label="Teachings" href="/teachings" />
                  <Stat value={counts.healings} label="Healings" href="/healings" />
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {/* Dawn gradient: the light-blue transition out of the dark mass. */}
      <Section tone="dawn" spacing="sm">
        <div className="grid gap-8 md:grid-cols-3">
          {[
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
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-sm bg-ink-0/70 p-6 ring-1 ring-inset ring-primary-200/60 transition-shadow hover:shadow-md"
            >
              <h2 className="text-h3 text-primary-700">{card.title}</h2>
              <p className="mt-2 text-body-sm text-ink-600">{card.body}</p>
              <span className="mt-4 inline-block text-body-sm font-semibold text-primary-700 underline-offset-4 group-hover:underline">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {latest.length > 0 ? (
        <Section tone="default">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow rule>From the archive</Eyebrow>
              <h2 className="text-h2 mt-5 text-ink-900">Recently published</h2>
            </div>
            <Link
              href="/prophecies"
              className="text-body-sm font-semibold text-primary-700 underline underline-offset-4"
            >
              See all prophecies →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((item, index) => (
              <ContentCard
                key={item.slug}
                item={item}
                href={`/prophecies/${item.slug}`}
                priority={index === 0}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone="sunken" spacing="sm">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <Eyebrow rule>Jesus is LORD Radio</Eyebrow>
            <h2 className="text-h2 mt-5 max-w-[18ch] text-ink-900">
              Preparing the way, around the clock
            </h2>
            <p className="mt-4 max-w-[52ch] text-body text-ink-600">
              The ministry broadcasts from Nakuru. When the station is on air you
              can listen from the bar at the top of any page, and it keeps playing
              while you read.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <PlayRadioButton label="Listen live" />
          </div>
        </div>
      </Section>
    </>
  );
}
