import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { ContentCard } from "@/components/content/ContentCard";
import {
  ArrowIcon,
  BookIcon,
  PenIcon,
  HolyIcon,
  LampIcon,
  PlayIcon,
  RadioIcon,
  RepentIcon,
  ScrollIcon,
} from "@/components/home/icons";
import { HeroSlider } from "@/components/home/HeroSlider";
import { RecognitionGallery } from "@/components/home/RecognitionGallery";
import { PlayRadioButton } from "@/components/radio/PlayRadioButton";
import { KindTag, PlaceTag } from "@/components/ui/Broadcast";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getArchive } from "@/lib/api/content";
import { HERO_SLIDES } from "@/lib/hero-slides";
import { RECOGNITION_PHOTOS, RECOGNITION_PLACE } from "@/lib/recognition";
import type { ContentItem, ContentKind } from "@/lib/api/types";

export const metadata: Metadata = {
  description:
    "Repent, and prepare the way for the LORD. Teachings, prophecies and healing testimonies from the Ministry of Repentance and Holiness, Nakuru, Kenya.",
};

type RecentKey = "prophecies" | "writings" | "teachings";

async function loadHome(): Promise<{
  newest: Record<RecentKey, ContentItem | null>;
  reachable: boolean;
}> {
  try {
    const [prophecies, writings, teachings] = await Promise.all([
      getArchive("prophecies", { limit: 1 }),
      getArchive("writings", { limit: 1 }),
      getArchive("teachings", { limit: 1 }),
    ]);
    return {
      newest: {
        prophecies: prophecies.results[0] ?? null,
        writings: writings.results[0] ?? null,
        teachings: teachings.results[0] ?? null,
      },
      reachable: true,
    };
  } catch {
    // The page still says what it has to say; it just does not claim to know
    // what is in the archive. No invented numbers, no placeholder cards.
    return {
      newest: { prophecies: null, writings: null, teachings: null },
      reachable: false,
    };
  }
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// The newest of each kind, side by side. Articles have no archive page yet,
// so they carry no href and show a placeholder until one exists.
const RECENT: {
  key: RecentKey;
  href: string | null;
  title: string;
  kind: ContentKind;
  icon: IconType;
}[] = [
  {
    key: "prophecies",
    href: "/prophecies",
    title: "Prophecies",
    kind: "prophecy",
    icon: ScrollIcon,
  },
  {
    key: "writings",
    href: null,
    title: "Articles",
    kind: "writing",
    icon: PenIcon,
  },
  {
    key: "teachings",
    href: "/teachings",
    title: "Teachings",
    kind: "teaching",
    icon: BookIcon,
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
    quote:
      "Repent ye therefore, and be converted, that your sins may be blotted out.",
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

// The ministry's own words, as supplied; keep them verbatim.
const ABOUT_PILLARS: {
  n: string;
  title: string;
  icon: IconType;
  /** A name, shown as a plate under the heading. */
  plate?: string;
  body: string[];
}[] = [
  {
    n: "01",
    title: "Who we are",
    icon: HolyIcon,
    body: [
      "The Ministry of Repentance and Holiness is a prophetic ministry raised to awaken the Church to the urgency of repentance and holy living. It proclaims that salvation is found only through the finished work of the Cross and that a holy life is the evidence of true redemption.",
      "The ministry stands firmly on the authority of the Holy Scriptures and teaches uncompromising obedience to the Word of GOD as the only way to prepare for the Kingdom of Heaven.",
    ],
  },
  {
    n: "02",
    title: "The leadership",
    icon: ScrollIcon,
    plate: "Prophet Dr. David Edward Owuor",
    body: [
      "The ministry is led by Prophet Dr. David Edward Owuor, the Servant of THE LORD, sent to restore repentance and holiness in the Church and to prepare the way for the coming of the Messiah.",
      "His calling is centred on obedience to the voice of THE LORD GOD OF ISRAEL and the proclamation of righteousness, holiness and repentance, pointing all glory to GOD alone.",
    ],
  },
];

export default async function HomePage() {
  const { newest, reachable } = await loadHome();
  const featured = newest.prophecies;

  return (
    <>
      {/* ------------------------------------------------------------ hero
          The call over the nations, which are held back under navy by
          HeroSlider. Yellow and bright cyan are legal only on navy. On phones
          the photo is a band above the words: the top padding is its height
          (a square, 16:10 from sm) less the part that has faded into navy.
          The lines wipe in one after another, as the ministry's video titles
          do. */}
      <section className="on-dark relative overflow-hidden bg-primary-950 text-ink-0">
        <HeroSlider slides={HERO_SLIDES}>
          <Container>
            <div className="flex flex-col justify-center pt-[calc(100vw-4rem)] sm:pt-[calc(62.5vw-4rem)] lg:min-h-[max(40rem,calc(100svh-var(--radio-h)-var(--nav-h)-4.5rem))] lg:py-16">
              {/* The call */}
              <div className="min-w-0 lg:max-w-[calc(50%-2rem)]">
                <p className="wipe-in flex items-center gap-3 text-eyebrow uppercase text-cyan-400">
                  <span aria-hidden className="h-1 w-10 bg-grad-rule" />
                  Revelation 16:15
                </p>
                <h1 className="mt-6 text-[clamp(2.75rem,1.2rem+2.9vw,4.25rem)] font-black uppercase leading-[0.95] tracking-[-0.035em] text-ink-0 [text-shadow:0_2px_24px_rgb(4_8_31/0.5)]">
                  <span className="wipe-in block [animation-delay:120ms]">Prepare</span>
                  <span className="wipe-in block [animation-delay:200ms]">the way</span>
                  <span className="wipe-in mt-3 block text-cyan-400 [animation-delay:320ms]">
                    The Messiah
                  </span>
                  <span className="wipe-in mt-3 inline-block bg-sun px-[0.18em] pb-[0.04em] pt-[0.1em] text-primary-950 [animation-delay:440ms] [text-shadow:none]">
                    is coming
                  </span>
                </h1>
                <p className="mt-8 max-w-[34ch] border-l-4 border-ink-0/25 pl-4 text-prose-lg italic text-ink-0/85">
                  &ldquo;Behold, I come as a thief. Blessed is he that
                  watcheth.&rdquo;
                </p>
                {/* One button: the prayer is the step that matters. The
                    archive is a quiet link beside it, not a second button
                    competing for the same glance. */}
                <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                  <ButtonLink href="/salvation-prayer" variant="gold" size="lg">
                    The Salvation Prayer
                    <ArrowIcon className="h-4 w-4" />
                  </ButtonLink>
                  <Link
                    href="/prophecies"
                    className="group inline-flex items-center gap-2 font-display text-body-sm font-extrabold uppercase tracking-wide text-ink-0/85 underline-offset-8 hover:text-ink-0 hover:underline"
                  >
                    Browse the archive
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </HeroSlider>
      </section>

      {/* ---------------------------------------------------- prophecy alert
          The newest prophecy, which used to sit in the hero, as a lower third
          directly beneath it. */}
      {featured ? (
        <Link
          href={`/prophecies/${featured.slug}`}
          className="group block border-b border-ink-100 bg-ink-0 transition-colors hover:bg-primary-50"
        >
          <Container className="flex items-center gap-4 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-alert-500 text-ink-0 shadow-md transition-transform duration-300 ease-emphasis group-hover:scale-110">
              <PlayIcon className="ml-0.5 h-4 w-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <KindTag kind="prophecy" className="shrink-0">
                Prophecy alert!
              </KindTag>
              <span className="line-clamp-2 min-w-0 text-body font-extrabold text-primary-900 group-hover:text-primary-700 sm:line-clamp-1 sm:text-h4">
                {featured.title}
              </span>
            </span>
            <ArrowIcon className="h-5 w-5 shrink-0 text-ink-300 transition-all group-hover:translate-x-1 group-hover:text-primary-600" />
          </Container>
        </Link>
      ) : null}

      {/* ------------------------------------------------------------ about
          Who the ministry is, in its own words. The introduction beside the
          vision and mission, then who we are and the leadership as a pair. The
          vision card repeats the hero's navy-and-sun treatment on purpose: it is
          the same message. */}
      <section
        aria-labelledby="about-heading"
        className="relative border-t border-ink-100 bg-ink-0"
      >
        <Container className="py-section">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="lg:self-center">
              <p className="text-eyebrow uppercase text-cyan-700">About us</p>
              <div aria-hidden className="mt-3 h-1 w-12 bg-grad-rule" />
              <h2
                id="about-heading"
                className="text-display-lg mt-5 max-w-[16ch] text-primary-900 text-balance"
              >
                The Ministry of Repentance and Holiness
              </h2>
              <p className="mt-6 max-w-prose text-prose-lg text-ink-600">
                The Ministry of Repentance and Holiness was founded in 2005 and
                is led by Prophet Dr. David Edward Owuor. It is a global
                end-time ministry mandated by THE LORD GOD OF ISRAEL to prepare
                the nations for the imminent and glorious coming of THE LORD
                JESUS CHRIST.
              </p>
            </div>

            <div className="grid content-start gap-5">
              {/* Vision */}
              <div className="on-dark relative overflow-hidden rounded-lg bg-primary-900 p-7 text-ink-0 shadow-lg sm:p-9">
                <div
                  aria-hidden
                  className="bg-dots-light pointer-events-none absolute inset-0"
                />
                <div className="relative">
                  <p className="flex items-center gap-3 text-eyebrow uppercase text-cyan-400">
                    <span aria-hidden className="h-1 w-8 bg-grad-rule" />
                    Our vision
                  </p>
                  <p className="mt-5 text-[clamp(2rem,1.2rem+2vw,2.75rem)] font-black uppercase leading-[1] tracking-[-0.03em]">
                    <span className="block text-cyan-400">The Messiah</span>
                    <span className="mt-2 inline-block bg-sun px-[0.18em] pb-[0.04em] pt-[0.1em] text-primary-950">
                      is coming
                    </span>
                  </p>
                  <p className="mt-5 max-w-[44ch] text-body-sm text-ink-0/80">
                    This vision stands as the divine alarm to the nations and
                    the central message of the ministry.
                  </p>
                </div>
              </div>

              {/* Mission */}
              <div className="relative overflow-hidden rounded-lg bg-grad-dawn p-7 shadow-md ring-1 ring-primary-100 sm:p-9">
                <div
                  aria-hidden
                  className="bg-dots pointer-events-none absolute inset-0"
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5 bg-alert-500"
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-eyebrow uppercase text-cyan-700">
                      Our mission
                    </p>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-grad-azure text-ink-0 shadow-md shadow-primary-700/25">
                      <LampIcon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-h3 text-primary-900 text-balance">
                    Preparing the Way for the glorious coming of the Messiah.
                  </p>
                  <p className="mt-3 text-body-sm text-ink-700">
                    Through powerful preaching, revival meetings, healing
                    services, conferences and global broadcasts, the ministry
                    calls the world to repentance, holiness and readiness for
                    the return of THE LORD JESUS CHRIST.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:mt-16">
            {ABOUT_PILLARS.map((p) => (
              <article
                key={p.title}
                className="group relative flex flex-col overflow-hidden rounded-lg bg-ink-0 p-7 shadow-lg ring-1 ring-ink-100 transition-all duration-300 ease-emphasis hover:-translate-y-1 hover:shadow-xl hover:ring-primary-200 sm:p-9"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 bg-cyan-400"
                />
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
                  <div
                    aria-hidden
                    className="relative mt-6 h-px w-full bg-ink-100"
                  />
                )}

                <div className="relative mt-5 space-y-3 text-body text-ink-600">
                  {p.body.map((para, i) => (
                    <p
                      key={para.slice(0, 24)}
                      className={i === 0 ? "text-ink-800" : undefined}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------ recognition
          The Prophet of THE LORD honoured in the nations. Navy, so the photos
          are framed rather than washed out by a white page, and so the sun
          rule and place tag are legal. */}
      <section
        aria-labelledby="recognition-heading"
        className="on-dark relative overflow-hidden bg-primary-950 text-ink-0"
      >
        <div
          aria-hidden
          className="bg-dots-light pointer-events-none absolute inset-0"
        />
        <Container className="relative py-section">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="flex items-center gap-3 text-eyebrow uppercase text-cyan-400">
                <span aria-hidden className="h-1 w-10 bg-grad-rule" />
                Recognition
              </p>
              <h2
                id="recognition-heading"
                className="text-display-lg mt-5 max-w-[20ch] text-ink-0 text-balance"
              >
                The Prophet of THE LORD,{" "}
                <span className="text-sun">honoured</span>
              </h2>
            </div>
            <PlaceTag
              name={RECOGNITION_PLACE.name}
              detail={RECOGNITION_PLACE.detail}
            />
          </div>

          <div className="mt-10 lg:mt-12">
            <RecognitionGallery photos={RECOGNITION_PHOTOS} />
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------- recently published
          The newest prophecy, article and teaching, one column each. */}
      {reachable ? (
        <section
          aria-labelledby="recent-heading"
          className="relative border-t border-ink-100 bg-ink-25"
        >
          <Container className="py-section-sm">
            <div>
              <p className="text-eyebrow uppercase text-cyan-700">
                From the archive
              </p>
              <h2 id="recent-heading" className="text-h2 mt-3 text-primary-900">
                Recently published
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {RECENT.map((col, index) => {
                const item = newest[col.key];
                return (
                  <div key={col.key} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-3 text-h4 text-primary-900">
                        <KindTag kind={col.kind} className="!p-0">
                          <span className="grid h-8 w-8 place-items-center">
                            <col.icon className="h-4 w-4" />
                          </span>
                        </KindTag>
                        {col.title}
                      </h3>
                      {col.href ? (
                        <Link
                          href={col.href}
                          className="group inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary-700 hover:text-primary-900"
                        >
                          View all
                          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      ) : null}
                    </div>

                    {item && col.href ? (
                      <ContentCard
                        item={item}
                        href={`${col.href}/${item.slug}`}
                        priority={index === 0}
                      />
                    ) : (
                      <div className="flex flex-1 flex-col overflow-hidden rounded-sm bg-ink-0 ring-1 ring-inset ring-ink-100">
                        <div className="grid aspect-video place-items-center bg-grad-dawn">
                          <col.icon className="h-14 w-14 text-primary-200" />
                        </div>
                        <p className="p-5 text-body-sm text-ink-600">
                          {col.title} are being prepared and will appear here
                          soon.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {/* ------------------------------------------------------ the message */}
      <section className="relative overflow-hidden border-t border-ink-100 bg-grad-dawn">
        <div
          aria-hidden
          className="bg-dots pointer-events-none absolute inset-0"
        />
        <Container className="relative py-section">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow uppercase text-cyan-700">The message</p>
            <div aria-hidden className="mx-auto mt-3 h-1 w-12 bg-grad-rule" />
            <h2 className="text-display-lg mt-5 text-primary-900">
              Repent. Be holy. Prepare.
            </h2>
            <p className="mt-4 text-prose-lg text-ink-600">
              Everything in this archive comes back to one call, given again and
              again across two decades of preaching.
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
                  <span className="font-display text-display-lg tabular-nums text-alert-500">
                    {p.n}
                  </span>
                </div>
                <h3 className="mt-5 text-h3">{p.title}</h3>
                <blockquote className="mt-4 border-l-4 border-alert-500 pl-4 text-body italic text-ink-700">
                  &ldquo;{p.quote}&rdquo;
                  <footer className="mt-1 font-display text-meta font-extrabold uppercase not-italic text-alert-600">
                    {p.ref}
                  </footer>
                </blockquote>
                <p className="mt-4 flex-1 text-body-sm text-ink-600">
                  {p.body}
                </p>
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

      {/* -------------------------------------------------- scripture band */}
      <section className="on-dark relative overflow-hidden bg-grad-royal text-ink-0 grad-dither">
        <div
          aria-hidden
          className="bg-dots-light pointer-events-none absolute inset-0"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-16 select-none font-display text-[16rem] font-black leading-none text-ink-0/5"
        >
          &ldquo;
        </span>
        <Container className="relative py-section">
          <figure className="mx-auto max-w-3xl text-center">
            <p className="text-eyebrow uppercase text-cyan-400">
              Hebrews 12:14
            </p>
            {/* The ministry's quote cards: heavy white caps, the lead word in
                cyan, the words that carry the point in yellow. */}
            <blockquote className="mt-6 text-display-lg uppercase leading-[1.15] text-ink-0 text-balance">
              <span className="text-cyan-400">Follow</span> peace with all men,
              and <span className="text-sun">holiness</span>, without which no
              man shall <span className="text-sun">see the Lord</span>.
            </blockquote>
            <div aria-hidden className="mx-auto mt-8 h-1 w-16 bg-grad-rule" />
            <figcaption className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/teachings" variant="gold" size="lg">
                Teachings on holiness
              </ButtonLink>
              <ButtonLink
                href="/salvation-prayer"
                variant="secondary"
                size="lg"
              >
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
                18, 34, 26, 48, 30, 62, 40, 24, 52, 36, 70, 44, 28, 58, 38, 22,
                46, 32, 64, 42, 26, 54, 34, 20, 50, 40, 72, 46, 30, 60, 36, 24,
                44, 56, 28, 40, 66, 32, 48, 26,
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
                <p className="text-eyebrow uppercase text-cyan-700">
                  Jesus is LORD Radio
                </p>
                <h2 className="text-h2 mt-3 max-w-[18ch] text-primary-900">
                  Preparing the way, around the clock
                </h2>
                <p className="mt-3 max-w-[52ch] text-body text-ink-600">
                  The ministry broadcasts from Nakuru. When the station is on
                  air you can listen from the bar at the top of any page, and it
                  keeps playing while you read.
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
