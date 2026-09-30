import builtin from "./builtin-photos.json";
import defaults from "./defaults.json";
import type { FeaturedGallery, HeroSlide, SiteContent } from "./types";

/**
 * What the site shows when the Studio has nothing to say: before its photos
 * have been set up, or in the rare moment the API cannot be reached.
 *
 * The hero photos in public/hero/ are cropped to 3:2 around their subject from
 * the originals in Slider-photos/ and saved as high-quality WebP (q92, up to
 * 2560px). The words cover the left half of the hero on wide screens, so only
 * photos whose subject stands right of centre are used. The recognition photos
 * in public/recognition/ are the originals in Recognition/, uncropped. Captions
 * say only what the photos and their folders say; nothing is filled in that was
 * not supplied.
 *
 * `manage.py seed_site_content` copies these into the Studio, where they become
 * editable; from then on the Studio's copies are what the site shows.
 */

export const BUILTIN_SLIDES: HeroSlide[] = builtin.heroSlides;

export const BUILTIN_GALLERY: FeaturedGallery = builtin.recognition;

export const BUILTIN_CONTENT: SiteContent = {
  sections: defaults,
  heroSlides: BUILTIN_SLIDES,
  gallery: BUILTIN_GALLERY,
};
