import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { ContentCard } from "@/components/content/ContentCard";
import {
  ArrowIcon,
  BookIcon,
  HeartIcon,
  HolyIcon,
  LampIcon,
  PlayIcon,
  RadioIcon,
  RepentIcon,
  ScrollIcon,
} from "@/components/home/icons";
import { PlayRadioButton } from "@/components/radio/PlayRadioButton";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getArchive } from "@/lib/api/content";
import type { ContentItem } from "@/lib/api/types";

export const metadata: Metadata = {
  description:
    "Repent, and prepare the way for the LORD. Teachings, prophecies and healing testimonies from the Ministry of Repentance and Holiness, Nakuru, Kenya.",
};

type Counts = { prophecies: number; teachings: number; healings: number };

async function loadHome(): Promise<{
  latest: ContentItem[];
  newest: Record<keyof Counts, ContentItem | null>;
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
      newest: {
        prophecies: prophecies.results[0] ?? null,
        teachings: teachings.results[0] ?? null,
        healings: healings.results[0] ?? null,
      },
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
      newest: { prophecies: null, teachings: null, healings: null },
      counts: { prophecies: 0, teachings: 0, healings: 0 },
      reachable: false,
    };
  }
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

function thumbOf(item: ContentItem | null): string | null {
  if (!item) return null;
  const video = item.videos.find((v) => v.is_primary) ?? item.videos[0];
  return video?.thumbnail_url || null;
}

const SECTIONS: {
  href: string;
  title: string;
  key: keyof Counts;
  icon: IconType;
  body: string;
}[] = [
  {
    href: "/prophecies",
    title: "Prophecies",
    key: "prophecies",
    icon: ScrollIcon,
    body: "Prophetic words given through the ministry, gathered from two decades of recordings.",
  },
  {
    href: "/teachings",
    title: "Teachings",
    key: "teachings",
    icon: BookIcon,
    body: "Messages on repentance, holiness and preparing for the coming of the Messiah.",
  },
  {
    href: "/healings",
    title: "Healings",
    key: "healings",
    icon: HeartIcon,
    body: "Testimonies of healing recorded at services and crusades across the nations.",
  },
];

const PILLARS: {
  n: string;
  title: string;
  icon: IconType;
  quote: string;
  ref: string;
  body: string;
  cta: { href: string; label: string };
}[] = [
  {
    n: "01",
    title: "Repent",
    icon: RepentIcon,
    quote: "Repent ye therefore, and be converted, that your sins may be blotted out.",
    ref: "Acts 3:19",
    body: "Turning from sin is where every walk with God begins. It is not a feeling but a decision, made before Him.",
    cta: { href: "/salvation-prayer", label: "Pray the Salvation Prayer" },
  },
  {
    n: "02",
    title: "Be holy",
    icon: HolyIcon,
    quote: "Because it is written, Be ye holy; for I am holy.",
    ref: "1 Peter 1:16",
    body: "Holiness is the life that follows repentance: set apart in word, in conduct and in what we allow into our hearts.",
    cta: { href: "/teachings", label: "Hear the teachings" },
  },
  {
    n: "03",
    title: "Prepare",
    icon: LampIcon,
    quote: "Prepare to meet thy God.",
    ref: "Amos 4:12",
    body: "The ministry exists to call the nations to be ready for the coming of the Messiah, like wise virgins with oil in their lamps.",
    cta: { href: "/prophecies", label: "Read the prophecies" },
  },
];

export default async function HomePage() {
  const { latest, newest, counts, reachable } = await loadHome();
  const featured = newest.prophecies;
  const featuredThumb = thumbOf(featured);

  return (
    <>
      {/* ------------------------------------------------------------ hero
          Two parts: the words on the left, the newest recording on the right.
          The photo is left clean; its title sits beneath it, not over it. */}
      <section className="relative isolate overflow-hidden border-b border-ink-100 bg-gradient-to-b from-primary-50 via-ink-0 to-ink-0">
        {/* Texture: a dot lattice and a halo behind the photo. */}
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 -z-10" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(closest-side,rgb(var(--c-primary-100))_0%,rgb(var(--c-primary-50)/0)_100%)]"
        />

        <Container>
          <div className="grid items-center gap-12 py-14 lg:grid-cols-12 lg:gap-10 lg:py-20">
            {/* Words */}
            <div className="min-w-0 lg:col-span-6">
              <div className="animate-rise">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-ink-0/80 py-1.5 pl-2 pr-3.5 text-meta text-primary-700 shadow-xs backdrop-blur">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-grad-rule">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-900" />
                  </span>
                  Ministry of Repentance &amp; Holiness · Nakuru, Kenya
                </span>
              </div>

              <p className="mt-7 animate-rise text-eyebrow uppercase text-primary-500 [animation-delay:60ms]">
                Isaiah 40:3
              </p>
              <div aria-hidden className="mt-3 h-0.5 w-12 bg-grad-rule" />
              <h1 className="text-display-2xl mt-5 animate-rise text-primary-900 [animation-delay:120ms]">
                Prepare the way
                <span className="block bg-gradient-to-r from-primary-700 via-primary-500 to-primary-700 bg-clip-text text-transparent">
                  for the LORD
                </span>
              </h1>
              <p className="mt-6 max-w-[50ch] animate-rise font-prose text-prose-lg text-ink-600 [animation-delay:180ms]">
                A voice of one calling: in the wilderness prepare the way for the LORD; make
                straight in the desert a highway for our God.
              </p>
              <div className="mt-8 flex animate-rise flex-wrap items-center gap-3 [animation-delay:240ms]">
                <ButtonLink
                  href="/salvation-prayer"
                  variant="primary"
                  size="lg"
                  className="shadow-md shadow-primary-700/20"
                >
                  The Salvation Prayer
                  <ArrowIcon className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/prophecies" variant="secondary" size="lg">
                  Browse the archive
                </ButtonLink>
              </div>
            </div>

            {/* Photo */}
            <div className="relative min-w-0 animate-rise [animation-delay:200ms] lg:col-span-6 lg:pl-6 xl:pl-10">
              {/* Offset navy plate and a gold corner give the photo depth. */}
              <div
                aria-hidden
                className="absolute -right-3 -top-3 hidden h-full w-full rounded-lg bg-grad-royal sm:block lg:-right-4 lg:-top-4"
              />
              <div
                aria-hidden
                className="absolute -bottom-4 -left-4 hidden h-20 w-20 border-b-2 border-l-2 border-gold-500 sm:block lg:left-2"
              />

              {featured ? (
                <Link
                  href={`/prophecies/${featured.slug}`}
                  className="group relative block overflow-hidden rounded-lg bg-ink-0 shadow-lg ring-1 ring-ink-100"
                >
                  <div className="relative aspect-video overflow-hidden bg-primary-950">
                    {featuredThumb ? (
                      <Image
                        src={featuredThumb}
                        alt=""
                        fill
                        priority
                        sizes="(min-width: 1024px) 45vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-emphasis group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-500 text-primary-950 shadow-md transition-transform duration-300 ease-emphasis group-hover:scale-110">
                      <PlayIcon className="ml-0.5 h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-caption uppercase tracking-wider text-gold-800">
                        Latest prophecy
                      </span>
                      <span className="mt-1 line-clamp-2 block text-h4 text-primary-900 group-hover:text-primary-700">
                        {featured.title}
                      </span>
                    </span>
                    <ArrowIcon className="h-5 w-5 shrink-0 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-primary-600" />
                  </div>
                </Link>
              ) : (
                <div className="on-dark relative overflow-hidden rounded-lg bg-grad-royal p-10 shadow-lg grad-dither">
                  <div aria-hidden className="bg-dots-light absolute inset-0" />
                  <p className="relative text-eyebrow uppercase text-gold-400">Matthew 3:2</p>
                  <p className="relative mt-4 font-prose text-display-lg text-ink-0">
                    Repent ye: for the kingdom of heaven is at hand.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------- the archives
          Pictures are left clean; words sit beneath them. */}
      <section className="relative border-t border-ink-100 bg-ink-25">
        <Container className="py-section-sm">
          <div className="grid gap-6 md:grid-cols-3">
            {SECTIONS.map((card, index) => {
              const count = counts[card.key];
              const thumb = thumbOf(newest[card.key]);
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex animate-rise flex-col overflow-hidden rounded-lg bg-ink-0 shadow-lg ring-1 ring-ink-100 transition-all duration-300 ease-emphasis hover:-translate-y-1 hover:shadow-xl hover:ring-primary-200"
                  style={{ animationDelay: `${320 + index * 80}ms` }}
                >
                  <div className="relative aspect-video overflow-hidden bg-primary-50">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        priority={index === 0}
                        className="object-cover transition-transform duration-700 ease-emphasis group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-grad-dawn">
                        <card.icon className="h-16 w-16 text-primary-200" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="flex items-center gap-3 text-h3 text-primary-900 group-hover:text-primary-700">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                          <card.icon className="h-4 w-4" />
                        </span>
                        {card.title}
                      </h2>
                      {reachable ? (
                        <span className="shrink-0 text-meta tabular-nums text-ink-500">
                          {count > 0
                            ? `${count.toLocaleString()} ${count === 1 ? "item" : "items"}`
                            : "Being catalogued"}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 flex-1 text-body-sm text-ink-600">{card.body}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-body-sm font-semibold text-primary-700">
                      Explore {card.title.toLowerCase()}
                      <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------ the message */}
      <section className="relative overflow-hidden border-t border-ink-100 bg-grad-dawn">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0" />
        <Container className="relative py-section">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow uppercase text-primary-500">The message</p>
            <div aria-hidden className="mx-auto mt-3 h-0.5 w-12 bg-grad-rule" />
            <h2 className="text-display-lg mt-5 text-primary-900">Repent. Be holy. Prepare.</h2>
            <p className="mt-4 font-prose text-prose-lg text-ink-600">
              Everything in this archive comes back to one call, given again and again across two
              decades of preaching.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <li
                key={p.n}
                className="relative flex flex-col rounded-md border border-ink-100 bg-ink-0/90 p-7 shadow-sm backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-display-lg tabular-nums text-primary-100">
                    {p.n}
                  </span>
                </div>
                <h3 className="mt-5 text-h3">{p.title}</h3>
                <blockquote className="mt-4 border-l-2 border-gold-500 pl-4 font-prose text-body italic text-ink-700">
                  &ldquo;{p.quote}&rdquo;
                  <footer className="mt-1 font-display text-meta not-italic text-gold-800">
                    {p.ref}
                  </footer>
                </blockquote>
                <p className="mt-4 flex-1 text-body-sm text-ink-600">{p.body}</p>
                <Link
                  href={p.cta.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary-700 underline-offset-4 hover:underline"
                >
                  {p.cta.label}
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ----------------------------------------------- recently published */}
      {latest.length > 0 ? (
        <section className="border-t border-ink-100 bg-ink-25">
          <Container className="py-section-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-eyebrow uppercase text-primary-500">From the archive</p>
                <h2 className="text-h2 mt-3 text-primary-900">Recently published</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SECTIONS.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-0 px-3.5 py-1.5 text-body-sm font-semibold text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
                  >
                    <s.icon className="h-4 w-4 text-primary-400" />
                    All {s.title.toLowerCase()}
                  </Link>
                ))}
              </div>
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

      {/* -------------------------------------------------- scripture band */}
      <section className="on-dark relative overflow-hidden bg-grad-royal text-ink-0 grad-dither">
        <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-16 select-none font-prose text-[16rem] leading-none text-ink-0/5"
        >
          &ldquo;
        </span>
        <Container className="relative py-section">
          <figure className="mx-auto max-w-3xl text-center">
            <p className="text-eyebrow uppercase text-gold-400">Hebrews 12:14</p>
            <blockquote className="mt-6 font-prose text-display-lg font-normal text-ink-0 text-balance">
              Follow peace with all men, and holiness, without which no man shall see the Lord.
            </blockquote>
            <div aria-hidden className="mx-auto mt-8 h-0.5 w-16 bg-grad-rule" />
            <figcaption className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/teachings" variant="gold" size="lg">
                Teachings on holiness
              </ButtonLink>
              <ButtonLink href="/salvation-prayer" variant="secondary" size="lg">
                Begin with prayer
              </ButtonLink>
            </figcaption>
          </figure>
        </Container>
      </section>

      {/* ------------------------------------------------------------ radio */}
      <section>
        <Container className="py-section-sm">
          <div className="relative grid items-center gap-8 overflow-hidden rounded-lg border border-ink-100 bg-gradient-to-br from-primary-50 via-ink-0 to-ink-0 p-8 lg:grid-cols-[1fr_auto] lg:p-12">
            {/* Static equaliser: decoration only, so it does not pretend the
                station is broadcasting when it is not. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-between gap-1.5 px-8 opacity-70"
            >
              {[
                18, 34, 26, 48, 30, 62, 40, 24, 52, 36, 70, 44, 28, 58, 38, 22, 46, 32, 64, 42, 26,
                54, 34, 20, 50, 40, 72, 46, 30, 60, 36, 24, 44, 56, 28, 40, 66, 32, 48, 26,
              ].map((h, i) => (
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
                <p className="text-eyebrow uppercase text-primary-500">Jesus is LORD Radio</p>
                <h2 className="text-h2 mt-3 max-w-[18ch] text-primary-900">
                  Preparing the way, around the clock
                </h2>
                <p className="mt-3 max-w-[52ch] text-body text-ink-600">
                  The ministry broadcasts from Nakuru. When the station is on air you can listen
                  from the bar at the top of any page, and it keeps playing while you read.
                </p>
              </div>
            </div>
            <div className="relative rounded-md bg-ink-0/90 p-5 shadow-md ring-1 ring-ink-100 backdrop-blur lg:justify-self-end">
              <PlayRadioButton label="Listen live" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
