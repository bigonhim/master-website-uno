import type { FeaturedGallery, HeroSlide, SiteSections } from "@/lib/site/types";

/**
 * What an editor's live preview shows. The editor sends one of these to the
 * preview frame (app/studio/frame) as the fields change, and the frame draws
 * it with the site's own components at a real phone or desktop width.
 */
export type PreviewView =
  | { view: "hero"; hero: SiteSections["home_hero"]; slides: HeroSlide[] }
  | {
      view: "about";
      intro: SiteSections["about_intro"];
      pillars: SiteSections["about_pillars"];
    }
  | { view: "message"; data: SiteSections["home_message"] }
  | { view: "scripture"; data: SiteSections["home_scripture"] }
  | { view: "radio"; data: SiteSections["home_radio"] }
  | { view: "recognition"; gallery: FeaturedGallery }
  | { view: "footer"; contact: SiteSections["contact"] };

export const PREVIEW_READY = "studio-frame-ready";
export const PREVIEW_UPDATE = "studio-preview";

export const DEVICES = {
  desktop: { width: 1280, height: 800, label: "Desktop" },
  phone: { width: 390, height: 780, label: "Phone" },
} as const;

export type Device = keyof typeof DEVICES;
