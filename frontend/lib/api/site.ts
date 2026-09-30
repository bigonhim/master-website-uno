import "server-only";

import { cache } from "react";

import { BUILTIN_CONTENT } from "@/lib/site/builtin";
import type { SiteContent, SitePayload, SiteSections } from "@/lib/site/types";

import { apiFetch } from "./client";

/**
 * The site's words and photos, as edited in the Studio.
 *
 * Tagged "site": every save in the Studio refreshes this tag, so an edit shows
 * on the next page view. The revalidate window only bounds staleness if that
 * signal is ever lost.
 *
 * Unlike the archive, this falls back rather than failing: these are the
 * site's own words, not data it could be wrong about, and the built-in copy of
 * them (lib/site/defaults.json) is kept identical to the backend's by a test.
 * A missing hero or footer would hide the outage no better and serve the
 * visitor worse.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  try {
    const payload = await apiFetch<SitePayload>("/site/", { revalidate: 300, tags: ["site"] });
    return {
      sections: withDefaults(payload.sections),
      // The hero is never empty: with no slides switched on in the Studio,
      // the built-in photos stand in.
      heroSlides: payload.hero_slides.length
        ? payload.hero_slides
        : BUILTIN_CONTENT.heroSlides,
      gallery: payload.gallery?.photos.length ? payload.gallery : BUILTIN_CONTENT.gallery,
    };
  } catch {
    return BUILTIN_CONTENT;
  }
});

/** A section the API left out (an older backend) keeps its original words. */
function withDefaults(sections: Partial<SiteSections>): SiteSections {
  const merged = { ...BUILTIN_CONTENT.sections };
  for (const key of Object.keys(merged) as (keyof SiteSections)[]) {
    if (sections[key]) Object.assign(merged, { [key]: { ...merged[key], ...sections[key] } });
  }
  return merged;
}
