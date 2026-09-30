/**
 * The home page slider: the ministry's meetings across the nations.
 *
 * Files in public/hero/ are cropped to 3:2 around their subject from the
 * originals in Slider-photos/ and saved as high-quality WebP (q92, up to
 * 2560px); the image optimiser sizes them down per screen. Nothing is painted
 * in. Captions say only what the source folders say; no city or date is
 * filled in that was not supplied.
 *
 * The words cover the left half of the hero on wide screens, so only photos
 * whose subject stands right of centre are used; in the others he would be
 * under the words. The Brazil photos are left out for that reason and because
 * they are too small to fill the width (WhatsApp copies, 1,500px); the camera
 * originals would bring Brazil back.
 */

export type HeroSlide = {
  src: string;
  alt: string;
  /** Yellow block of the place tag. */
  place: string;
  /** Navy block of the place tag, when known. */
  detail?: string;
  event: string;
  /**
   * Which part of the photo stays in view, 0–1 across and down (see .hero-box
   * in globals.css). On phones the frame is a square-ish band, so this mostly
   * picks the side; on wide screens it is far wider than 3:2, so `frameLg`
   * mostly picks the height, usually the top, where the faces are.
   */
  frame: { x: number; y: number };
  frameLg: { x: number; y: number };
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    src: "/hero/nakuru-crowd-flags.webp",
    alt: "Aerial view of a vast crowd in Nakuru carrying the flags of many nations.",
    place: "Nakuru",
    detail: "Kenya",
    event: "Merica Reception",
    frame: { x: 0.5, y: 0.3 },
    frameLg: { x: 0.5, y: 0.25 },
  },
  {
    src: "/hero/western-scroll.webp",
    alt: "Leaders holding up a banner beside the preacher at the Western Region revival.",
    place: "Western Region",
    event: "Revival",
    frame: { x: 0.62, y: 0.1 },
    frameLg: { x: 0.5, y: 0.04 },
  },
  {
    src: "/hero/drc-worship.webp",
    alt: "A conference hall in the DRC on its feet, hands raised in worship.",
    place: "DR Congo",
    event: "Conference Day",
    frame: { x: 0.5, y: 0.3 },
    frameLg: { x: 0.5, y: 0.3 },
  },
  {
    src: "/hero/nakuru-preaching-flags.webp",
    alt: "Preaching on a red stage in Nakuru before a crowd holding national flags.",
    place: "Nakuru",
    detail: "Kenya",
    event: "Merica Reception",
    frame: { x: 0.62, y: 0.12 },
    frameLg: { x: 0.5, y: 0.08 },
  },
  {
    src: "/hero/western-procession.webp",
    alt: "Arriving on foot and waving, ahead of a procession of children at the Western Region revival.",
    place: "Western Region",
    event: "Revival",
    frame: { x: 0.7, y: 0.1 },
    frameLg: { x: 0.5, y: 0.05 },
  },
  {
    src: "/hero/nakuru-children.webp",
    alt: "Children with hand-written signs greeting the preacher on the red carpet in Nakuru.",
    place: "Nakuru",
    detail: "Kenya",
    event: "Merica Reception",
    frame: { x: 0.56, y: 0.15 },
    frameLg: { x: 0.5, y: 0.12 },
  },
];
