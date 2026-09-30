import type { NextConfig } from "next";

// Where Django is. Photos uploaded in the Studio live under its /media/, and
// are served to visitors from this site's own /media/ (the rewrite below), so
// the image optimiser treats them as local files and no Django host has to be
// allowed as a remote image source.
const API_ORIGIN = new URL(process.env.API_URL ?? "http://127.0.0.1:8000/api/v1").origin;

const nextConfig: NextConfig = {
  async rewrites() {
    // Exactly the shape of a stored photo (cms/<year>/<month>/<name>.webp),
    // so nothing else under Django, not even a path with "..", is reachable
    // through this site's /media/.
    return [
      {
        source: "/media/cms/:year(\\d{4})/:month(\\d{2})/:file([A-Za-z0-9_-]+\\.webp)",
        destination: `${API_ORIGIN}/media/cms/:year/:month/:file`,
      },
    ];
  },
  async headers() {
    // The Studio and draft previews may only be framed by the site itself
    // (the Studio's own live preview frames /studio/frame).
    const noFraming = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];
    return [
      { source: "/studio/:path*", headers: noFraming },
      { source: "/studio", headers: noFraming },
      { source: "/preview/:path*", headers: noFraming },
    ];
  },
  images: {
    // Only the hosts we actually serve images from. Left as the scaffold
    // default this was empty, so Next's optimiser rejected every YouTube
    // thumbnail with a 400 and every card and video poster rendered broken.
    // A wildcard would fix it too, but it turns the optimiser into an open
    // proxy for any image on the internet.
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "images.radio.co" },
    ],
    formats: ["image/avif", "image/webp"],
    // 90 is for the hero photos, which are large enough on screen that the
    // default 75 visibly softens them. Everything else stays at 75.
    qualities: [75, 90],
  },
};

export default nextConfig;
