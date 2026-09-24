import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TeenovateX Labs",
    short_name: "TeenovateX",
    description: "A global, youth-led tech community for teenagers exploring coding, robotics, AI and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9eb",
    theme_color: "#fff9eb",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
