import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Contact | TeenovateX Labs",
  description: "Ask us anything, pitch us something, or tell us what you're building. A real person on the team reads every message.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const { topic } = await searchParams;
  const requested = Array.isArray(topic) ? topic[0] : topic;
  const initialTopic = CONTACT_TOPICS.find((t) => t === requested) as ContactTopic | undefined;

  return (
    <>
      <Header />
      <main>
        <Contact initialTopic={initialTopic} />
      </main>
      <Footer />
    </>
  );
}
