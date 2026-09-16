import type { MetadataRoute } from "next";

const SITE = process.env.SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/design-system", // internal reference, not content
          "/salvation-prayer/thank-you",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
