import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },
};

export default nextConfig;
