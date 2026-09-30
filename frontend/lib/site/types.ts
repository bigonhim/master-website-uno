import type defaults from "./defaults.json";

/**
 * Site content as the Studio edits it and the site shows it. Shapes match
 * backend/apps/sitecontent/public.py.
 */

/** The editable words, section by section (backend/apps/sitecontent/sections.py). */
export type SiteSections = typeof defaults;
export type SectionKey = keyof SiteSections;

export type HeroSlide = {
  /** Set for slides from the Studio; absent for the built-in ones. */
  id?: number;
  src: string;
  width?: number;
  height?: number;
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

export type GalleryPhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  caption: string;
  /** CSS object-position for the cropped grid tile; the lightbox never crops. */
  focus?: string;
};

export type FeaturedGallery = {
  eyebrow: string;
  /** May carry **highlight** markup. */
  heading: string;
  place: { name: string; detail: string };
  summary: string;
  photos: GalleryPhoto[];
};

export interface SitePayload {
  sections: SiteSections;
  hero_slides: HeroSlide[];
  gallery: FeaturedGallery | null;
}

export interface SiteContent {
  sections: SiteSections;
  heroSlides: HeroSlide[];
  gallery: FeaturedGallery;
}
