import type { Metadata } from "next";
import AlfredStudio from "@/components/alfred/AlfredStudio";

export const metadata: Metadata = {
  title: "Meet Alfred | TeenovateX Labs",
  description: "Meet Alfred and preview his expressions and companion interactions.",
  robots: { index: false, follow: false },
};

export default function AlfredPage() {
  return <AlfredStudio />;
}
