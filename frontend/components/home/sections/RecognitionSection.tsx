import { RecognitionGallery } from "@/components/home/RecognitionGallery";
import { PlaceTag } from "@/components/ui/Broadcast";
import { Container } from "@/components/ui/Container";
import { Markup } from "@/lib/site/markup";
import type { FeaturedGallery } from "@/lib/site/types";

/**
 * The Prophet of THE LORD honoured in the nations, on the site's sapphire band:
 * dark enough that the photos are framed rather than washed out, and that the
 * sun rule and place tag are legal. The white sections either side keep it from
 * running into the hero and the scripture band, which share its blue. The
 * heading sits beside a single photo viewer, so the section stays within one
 * screen and has no empty corner.
 *
 * Whichever gallery is featured in the Studio fills it.
 */
export function RecognitionSection({ gallery }: { gallery: FeaturedGallery }) {
  return (
    <section
      aria-labelledby="recognition-heading"
      className="on-dark relative overflow-hidden bg-grad-sapphire text-ink-0 grad-dither"
    >
      <div aria-hidden className="bg-dots-light pointer-events-none absolute inset-0" />
      <Container className="relative py-section-sm">
        <RecognitionGallery photos={gallery.photos}>
          {/* Heading and summary side by side on tablets, where the viewer
              runs full width below them; stacked beside it from lg. */}
          <div className="md:grid md:grid-cols-2 md:items-end md:gap-10 lg:block">
            <div>
              <p className="flex items-center gap-3 text-eyebrow uppercase text-cyan-400">
                <span aria-hidden className="h-1 w-10 bg-grad-rule" />
                {gallery.eyebrow}
              </p>
              <h2
                id="recognition-heading"
                className="text-display-lg mt-5 max-w-[14ch] text-ink-0 text-balance"
              >
                <Markup text={gallery.heading} strong="text-sun" em="text-cyan-400" />
              </h2>
              {gallery.place.name ? (
                <div className="mt-5">
                  <PlaceTag
                    name={gallery.place.name}
                    detail={gallery.place.detail || undefined}
                  />
                </div>
              ) : null}
            </div>
            {gallery.summary ? (
              <p className="mt-5 max-w-[46ch] text-body text-ink-0/85 md:mt-0 lg:mt-5">
                {gallery.summary}
              </p>
            ) : null}
          </div>
        </RecognitionGallery>
      </Container>
    </section>
  );
}
