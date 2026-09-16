import type { MetadataRoute } from "next";

import { getArchive, type ArchiveKind } from "@/lib/api/content";

export const revalidate = 3600;

const SITE = process.env.SITE_URL ?? "http://localhost:3000";
const KINDS: { kind: ArchiveKind; path: string }[] = [
  { kind: "prophecies", path: "/prophecies" },
  { kind: "teachings", path: "/teachings" },
  { kind: "healings", path: "/healings" },
];

/** Pages through an archive. The API caps `limit` at 100. */
async function allSlugs(kind: ArchiveKind): Promise<string[]> {
  const slugs: string[] = [];
  let offset = 0;
  for (let page = 0; page < 50; page += 1) {
    const data = await getArchive(kind, { limit: 100, offset });
    slugs.push(...data.results.map((item) => item.slug));
    if (!data.next) break;
    offset += 100;
  }
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, priority: 1 },
    { url: `${SITE}/salvation-prayer`, lastModified: now, priority: 0.9 },
    { url: `${SITE}/prophecies`, lastModified: now, priority: 0.8 },
    { url: `${SITE}/teachings`, lastModified: now, priority: 0.8 },
    { url: `${SITE}/healings`, lastModified: now, priority: 0.8 },
  ];

  try {
    const groups = await Promise.all(
      KINDS.map(async ({ kind, path }) => {
        const slugs = await allSlugs(kind);
        return slugs.map((slug) => ({
          url: `${SITE}${path}/${slug}`,
          lastModified: now,
          priority: 0.6,
        }));
      }),
    );
    return [...staticEntries, ...groups.flat()];
  } catch {
    // A sitemap listing only the hubs is honest. One that invents URLs, or a
    // build that dies because the API blinked, is not.
    return staticEntries;
  }
}
