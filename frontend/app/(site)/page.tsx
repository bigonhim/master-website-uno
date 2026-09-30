import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { ContentCard } from "@/components/content/ContentCard";
import { ArrowIcon, BookIcon, PenIcon, PlayIcon, ScrollIcon } from "@/components/home/icons";
import { LatestVideos } from "@/components/home/LatestVideos";
import { AboutPillars, AboutSection } from "@/components/home/sections/AboutSection";
import { HeroSection } from "@/components/home/sections/HeroSection";
import { MessageSection } from "@/components/home/sections/MessageSection";
import { RadioPanel } from "@/components/home/sections/RadioPanel";
import { RecognitionSection } from "@/components/home/sections/RecognitionSection";
import { ScriptureBand } from "@/components/home/sections/ScriptureBand";
import { PlayRadioButton } from "@/components/radio/PlayRadioButton";
import { KindTag } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";
import { getArticles, getFeedImage, type ArticleSummary } from "@/lib/api/articles";
import { getArchive } from "@/lib/api/content";
import { getSiteContent } from "@/lib/api/site";
import { getLatestVideos, getLiveVideoId } from "@/lib/api/youtube";
import type { ContentItem, ContentKind } from "@/lib/api/types";
import type { ChannelVideo } from "@/lib/youtube/feed";

export const metadata: Metadata = {
  description:
    "Repent, and prepare the way for the LORD. Teachings, prophecies and healing testimonies from the Ministry of Repentance and Holiness, Nakuru, Kenya.",
};

type RecentKey = "prophecies" | "articles" | "teachings";
type ArchiveKey = Exclude<RecentKey, "articles">;

async function loadHome(): Promise<{
  newest: Record<ArchiveKey, ContentItem | null>;
  reachable: boolean;
}> {
  try {
    const [prophecies, teachings] = await Promise.all([
      getArchive("prophecies", { limit: 1 }),
      getArchive("teachings", { limit: 1 }),
    ]);
    return {
      newest: {
        prophecies: prophecies.results[0] ?? null,
        teachings: teachings.results[0] ?? null,
      },
      reachable: true,
    };
  } catch {
    // The page still says what it has to say; it just does not claim to know
    // what is in the archive. No invented numbers, no placeholder cards.
    return {
      newest: { prophecies: null, teachings: null },
      reachable: false,
    };
  }
}

/** The newest article, from the publication. It and the channel each fail on
 *  their own: neither is the archive, and neither may take the page down. */
async function loadLatestArticle(): Promise<{
  article: ArticleSummary;
  image?: string;
} | null> {
  try {
    const article = (await getArticles({ limit: 1 })).data[0];
    if (!article) return null;
    return {
      article,
      image: article.image ? await getFeedImage(article.image.url) : undefined,
    };
  } catch {
    return null;
  }
}

async function loadLatestVideos(): Promise<ChannelVideo[]> {
  try {
    return await getLatestVideos(6);
  } catch {
    return [];
  }
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

// The newest of each kind, side by side. Prophecies and teachings come from
// the archive; the article comes from the publication.
const RECENT: {
  key: RecentKey;
  href: string;
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
    key: "articles",
    href: "/articles",
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

export default async function HomePage() {
  const [{ newest, reachable }, latestArticle, latestVideos, liveVideoId, site] =
    await Promise.all([
      loadHome(),
      loadLatestArticle(),
      loadLatestVideos(),
      // Never throws: any doubt reads as "not live".
      getLiveVideoId(),
      // Never throws: falls back to the site's built-in words and photos.
      getSiteContent(),
    ]);
  const { sections } = site;
  const featured = newest.prophecies;

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <HeroSection data={sections.home_hero} slides={site.heroSlides} />

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

      {/* ------------------------------------------------------------ about */}
      <AboutSection data={sections.about_intro}>
        <AboutPillars data={sections.about_pillars} />
      </AboutSection>

      {/* ------------------------------------------------------ recognition */}
      <RecognitionSection gallery={site.gallery} />

      {/* ----------------------------------------------- recently published
          The newest prophecy, article and teaching, one column each. */}
      {reachable || latestArticle ? (
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
                const item = col.key === "articles" ? null : newest[col.key];
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
                      <Link
                        href={col.href}
                        className="group inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary-700 hover:text-primary-900"
                      >
                        View all
                        <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>

                    {col.key === "articles" && latestArticle ? (
                      <ArticleCard
                        article={latestArticle.article}
                        image={latestArticle.image}
                      />
                    ) : item ? (
                      <ContentCard
                        item={item}
                        href={`${col.href}/${item.slug}`}
                        priority={index === 0}
                      />
                    ) : (
                      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-ink-200 bg-ink-0 shadow-sm">
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

      {/* ---------------------------------------------------- latest videos
          The channel's newest uploads, straight from its feed. */}
      <LatestVideos videos={latestVideos} liveId={liveVideoId} />

      {/* ------------------------------------------------------ the message */}
      <MessageSection data={sections.home_message} />

      {/* -------------------------------------------------- scripture band */}
      <ScriptureBand data={sections.home_scripture} />

      {/* ------------------------------------------------------------ radio */}
      <RadioPanel
        data={sections.home_radio}
        action={<PlayRadioButton label={sections.home_radio.button} />}
      />
    </>
  );
}
