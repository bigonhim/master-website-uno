import { getArchive } from "@/lib/api/content";

export const revalidate = 3600;

const SITE = process.env.SITE_URL ?? "http://localhost:3000";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS for the archive.
 *
 * A real distribution channel rather than decoration: a diaspora audience
 * following by feed reader or podcast app does not have to remember to visit.
 */
export async function GET() {
  let items: string[] = [];

  try {
    const [prophecies, teachings] = await Promise.all([
      getArchive("prophecies", { limit: 20 }),
      getArchive("teachings", { limit: 10 }),
    ]);

    items = [...prophecies.results, ...teachings.results].map((item) => {
      const path = item.kind === "teaching" ? "teachings" : "prophecies";
      const link = `${SITE}/${path}/${item.slug}`;
      const date = item.prophecy_date ?? item.published_at;
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        item.summary ? `      <description>${escapeXml(item.summary)}</description>` : "",
        date ? `      <pubDate>${new Date(date).toUTCString()}</pubDate>` : "",
        item.category ? `      <category>${escapeXml(item.category.name)}</category>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    });
  } catch {
    // An empty but valid feed beats a 500 in someone's reader.
    items = [];
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    "    <title>Ministry of Repentance and Holiness</title>",
    `    <link>${SITE}</link>`,
    "    <description>Teachings, prophecies and healing testimonies.</description>",
    "    <language>en</language>",
    ...items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
