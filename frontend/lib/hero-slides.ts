/**
 * The home page slider: the ministry's meetings across the nations.
 *
 * Files in public/hero/ are cropped to 3:2 around their subject from the
 * originals in Slider-photos/ and saved as high-quality WebP (q92, 2560px);
 * the image optimiser sizes them down per screen. Captions say only what the
 * source folders say; no city or date is filled in that was not supplied.
 */

export type HeroSlide = {
  src: string;
  alt: string;
  /** Yellow block of the place tag. */
  place: string;
  /** Navy block of the place tag, when known. */
  detail?: string;
  event: string;
  /** CSS object-position, for frames narrower than the 3:2 files. */
  focus?: string;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/hero/nakuru-crowd-flags.webp",
    alt: "Aerial view of a vast crowd in Nakuru carrying the flags of many nations.",
    place: "Nakuru",
    detail: "Kenya",
    event: "Merica Reception",
  },
  {
    // Re-cut: in the original the preacher stands at the far left edge, where
    // the hero's shade would hide him. The file moves him a third of the way
    // in, filling the gap with a blur of the photo's own edge, tinted navy.
    src: "/hero/drc-preaching-centred.webp",
    alt: "Preaching from the red carpet to a full conference hall in the DRC.",
    place: "DR Congo",
    event: "Conference Day",
    focus: "0% 50%",
  },
  {
    src: "/hero/western-scroll.webp",
    alt: "Leaders holding up a banner beside the preacher at the Western Region revival.",
    place: "Western Region",
    event: "Revival",
    focus: "60% 50%",
  },
  {
    src: "/hero/brazil-welcome.webp",
    alt: "The ministry welcomed with a bouquet of flowers on arrival in Brazil.",
    place: "Brazil",
    event: "Reception",
  },
  {
    src: "/hero/nakuru-preaching-flags.webp",
    alt: "Preaching on a red stage in Nakuru before a crowd holding national flags.",
    place: "Nakuru",
    detail: "Kenya",
    event: "Merica Reception",
    focus: "75% 50%",
  },
  {
    src: "/hero/drc-worship.webp",
    alt: "A conference hall in the DRC on its feet, hands raised in worship.",
    place: "DR Congo",
    event: "Conference Day",
  },
  {
    // Re-cut for the same reason as drc-preaching.
    src: "/hero/western-pulpit-centred.webp",
    alt: "Standing at the pulpit under the canopy at the Western Region revival.",
    place: "Western Region",
    event: "Revival",
    focus: "0% 50%",
  },
  {
    // Re-cut for the same reason as drc-preaching.
    src: "/hero/brazil-reception-centred.webp",
    alt: "Children and families gathered with banners to receive the ministry in Brazil.",
    place: "Brazil",
    event: "Reception",
    focus: "0% 50%",
  },
  {
    // Re-cut for the same reason as drc-preaching.
    src: "/hero/nakuru-red-carpet-centred.webp",
    alt: "Walking the red carpet past a guard of honour in Nakuru.",
    place: "Nakuru",
    detail: "Kenya",
    event: "Merica Reception",
    focus: "0% 50%",
  },
];
