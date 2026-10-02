import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/home",
    name: "TeenovateX Labs",
    short_name: "TeenovateX",
    description: "A global, youth-led tech community for teenagers exploring coding, robotics, AI and more.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff9eb",
    theme_color: "#fff9eb",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Labs", url: "/labs", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Messages", url: "/messages", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Notifications", url: "/notifications", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
