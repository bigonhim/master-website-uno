import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Markup } from "@/lib/site/markup";
import type { SiteSections } from "@/lib/site/types";

/**
 * The ministry's quote cards: heavy white caps, the lead word in cyan
 * (*single stars* in the Studio), the words that carry the point in yellow
 * (**double stars**).
 */
export function ScriptureBand({ data }: { data: SiteSections["home_scripture"] }) {
  return (
    <section className="on-dark relative overflow-hidden bg-grad-sapphire text-ink-0 grad-dither">
      <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 -top-16 select-none font-display text-[16rem] font-black leading-none text-ink-0/5"
      >
        &ldquo;
      </span>
      <Container className="relative py-section">
        <figure className="mx-auto max-w-3xl text-center">
          <p className="text-eyebrow uppercase text-cyan-400">{data.reference}</p>
          <blockquote className="mt-6 text-display-lg uppercase leading-[1.15] text-ink-0 text-balance">
            <Markup text={data.verse} em="text-cyan-400" strong="text-sun" />
          </blockquote>
          <div aria-hidden className="mx-auto mt-8 h-1 w-16 bg-grad-rule" />
          <figcaption className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/teachings" variant="gold" size="lg">
              {data.button_1}
            </ButtonLink>
            <ButtonLink href="/salvation-prayer" variant="secondary" size="lg">
              {data.button_2}
            </ButtonLink>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
