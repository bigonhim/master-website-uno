import Link from "next/link";

import { ArrowIcon } from "@/components/home/icons";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { HeroSlide, SiteSections } from "@/lib/site/types";

/**
 * The call over the nations, which are held back under the sapphire's blue by
 * HeroSlider. Yellow and bright cyan are legal only on the blue. On phones the
 * photo is a band above the words: the top padding is its height (a square,
 * 16:10 from sm) less the part that has faded out. The lines wipe in one after
 * another, as the ministry's video titles do.
 *
 * The words come from the Studio ("The call"); the links stay fixed.
 */
export function HeroSection({
  data,
  slides,
}: {
  data: SiteSections["home_hero"];
  slides: HeroSlide[];
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-grad-sapphire text-ink-0 grad-dither">
      <HeroSlider slides={slides}>
        <Container>
          <div className="flex flex-col justify-center pt-[calc(100vw-4rem)] sm:pt-[calc(62.5vw-4rem)] lg:min-h-[max(40rem,calc(100svh-var(--radio-h)-var(--nav-h)-4.5rem))] lg:py-16">
            {/* The call */}
            <div className="min-w-0 lg:max-w-[calc(50%-2rem)]">
              <p className="wipe-in flex items-center gap-3 text-eyebrow uppercase text-cyan-400">
                <span aria-hidden className="h-1 w-10 bg-grad-rule" />
                {data.eyebrow}
              </p>
              <h1 className="mt-6 text-[clamp(2.75rem,1.2rem+2.9vw,4.25rem)] font-black uppercase leading-[0.95] tracking-[-0.035em] text-ink-0 [text-shadow:0_2px_24px_rgb(4_8_31/0.5)]">
                <span className="wipe-in block [animation-delay:120ms]">{data.line_1}</span>
                <span className="wipe-in block [animation-delay:200ms]">{data.line_2}</span>
                <span className="wipe-in mt-3 block text-cyan-400 [animation-delay:320ms]">
                  {data.accent}
                </span>
                <span className="wipe-in mt-3 inline-block bg-sun px-[0.18em] pb-[0.04em] pt-[0.1em] text-primary-950 [animation-delay:440ms] [text-shadow:none]">
                  {data.highlight}
                </span>
              </h1>
              <p className="mt-8 max-w-[34ch] border-l-4 border-ink-0/25 pl-4 text-prose-lg italic text-ink-0/85">
                &ldquo;{data.quote}&rdquo;
              </p>
              {/* One button: the prayer is the step that matters. The archive
                  is a quiet link beside it, not a second button competing for
                  the same glance. */}
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <ButtonLink href="/salvation-prayer" variant="gold" size="lg">
                  {data.button}
                  <ArrowIcon className="h-4 w-4" />
                </ButtonLink>
                <Link
                  href="/prophecies"
                  className="group inline-flex items-center gap-2 font-display text-body-sm font-extrabold uppercase tracking-wide text-ink-0/85 underline-offset-8 hover:text-ink-0 hover:underline"
                >
                  {data.link}
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </HeroSlider>
    </section>
  );
}
