/**
 * The home page slider: the ministry's meetings across the nations.
 *
 * Files in public/hero/ are cropped to 3:2 around their subject from the
 * originals in Slider-photos/ and saved as high-quality WebP (q92, 2560px);
 * the image optimiser sizes them down per screen. Nothing is painted in: where
 * the subject stands at an edge of the original, he stays there and `focus`
 * keeps that side of the frame. Captions say only what the source folders say;
 * no city or date is filled in that was not supplied.
 */

export type HeroSlide = {
  src: string;
  alt: string;
  /** Yellow block of the place tag. */
  place: string;
  /** Navy block of the place tag, when known. */
  detail?: string;
  event: string;
  /** CSS object-position. The frame is narrower than 3:2 on most screens
   *  (near square on a laptop), so this says which side of the photo to keep. */
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
    // Preaching from the far left of the photo, towards the hall.
    src: "/hero/drc-preaching.webp",
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
    src: "/hero/western-pulpit.webp",
    alt: "Standing at the pulpit under the canopy at the Western Region revival.",
    place: "Western Region",
    event: "Revival",
    focus: "0% 50%",
  },
  {
    src: "/hero/brazil-reception.webp",
    alt: "Children and families gathered with banners to receive the ministry in Brazil.",
    place: "Brazil",
    event: "Reception",
    focus: "0% 50%",
  },
  {
    src: "/hero/nakuru-red-carpet.webp",
    alt: "Walking the red carpet past a guard of honour in Nakuru.",
    place: "Nakuru",
    detail: "Kenya",
    event: "Merica Reception",
    focus: "0% 50%",
  },
];
