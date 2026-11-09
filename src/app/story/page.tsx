import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Teenovators from "@/components/Teenovators";

export const metadata: Metadata = {
  title: "The story so far | TeenovateX Labs",
  description:
    "Our first events, the day the founders finally shared a room, and the Teenovators who made it real. Receipts, in photographs.",
};

export default function StoryPage() {
  return (
    <>
      <Header />
      <main>
        <Teenovators />
      </main>
      <Footer />
    </>
  );
}
