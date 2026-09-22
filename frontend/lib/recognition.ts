/**
 * The home page's recognition gallery: the Prophet of THE LORD honoured on
 * arrival in Bogotá, Colombia.
 *
 * Files in public/recognition/ are the originals in Recognition/ re-encoded
 * as high-quality WebP (q92) at their full 2456px width, uncropped; the image
 * optimiser sizes them down per screen. Captions say only what the photos
 * themselves show; no title, office or date is filled in that was not given.
 */

export type RecognitionPhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  caption: string;
  /** CSS object-position for the cropped grid tile; the lightbox never crops. */
  focus?: string;
};

export const RECOGNITION_PLACE = { name: "Bogotá", detail: "Colombia" };

export const RECOGNITION_PHOTOS: RecognitionPhoto[] = [
  {
    src: "/recognition/bogota-key-to-the-city.webp",
    width: 2456,
    height: 1376,
    alt: "The Prophet receiving a ceremonial golden key in a presentation case, surrounded by people filming.",
    title: "A ceremonial key",
    caption:
      "Presented with a golden key inscribed “Bendito el que viene en el nombre de Jehová” (Psalm 118:26).",
    focus: "60% 50%",
  },
  {
    src: "/recognition/bogota-police-escort.webp",
    width: 2456,
    height: 1600,
    alt: "The Prophet walking through the airport arrivals hall, escorted by uniformed police officers.",
    title: "Escorted on arrival",
    caption: "Received at the airport with a police escort.",
    focus: "50% 35%",
  },
  {
    src: "/recognition/bogota-city-flag.webp",
    width: 2456,
    height: 1380,
    alt: "The Prophet and his hosts holding up the yellow and red flag of Bogotá in the airport.",
    title: "The flag of Bogotá",
    caption: "Welcomed with the flag of the city.",
  },
  {
    src: "/recognition/bogota-welcome.webp",
    width: 2456,
    height: 1380,
    alt: "Hosts presenting the Prophet with gifts, beside a sign welcoming him to Bogotá.",
    title: "Gifts of welcome",
    caption: "Gifts presented by his hosts on arrival.",
    focus: "55% 40%",
  },
  {
    src: "/recognition/bogota-police-plaque.webp",
    width: 2456,
    height: 1380,
    alt: "The Prophet speaking and holding a plaque, standing between four police officers.",
    title: "A plaque, among the police",
    caption: "Holding a plaque, standing with officers of the police.",
    focus: "50% 30%",
  },
];
