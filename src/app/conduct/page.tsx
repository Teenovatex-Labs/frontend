import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Code of Conduct | TeenovateX Labs",
  description: "How we keep the TeenovateX community welcoming and safe.",
};

export default function ConductPage() {
  return (
    <>
      <Header />
      <main className="wrap max-w-[760px] py-14 md:py-20">
        <p className="eyebrow text-rose">Our community</p>
        <h1 className="mt-2 text-[clamp(38px,8vw,56px)] leading-[1.05] tracking-tight">Code of <span className="font-serif font-normal italic">Conduct.</span></h1>
        <p className="mt-5 max-w-[600px] text-lg text-muted">Everyone here deserves room to learn, make things, and feel safe. These are the community rules already set out in our terms, written here so new members can read them before joining in.</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed">
          <section className="rounded-[20px] border border-ink bg-yellow p-6 shadow-[4px_4px_0_var(--ink)]">
            <h2 className="text-2xl">Make room for others.</h2>
            <p className="mt-2">Ask questions and share work in good faith. Do not harass, bully, threaten, impersonate, or post hateful or sexually explicit content.</p>
          </section>
          <section className="rounded-[20px] border border-ink bg-white p-6 shadow-[4px_4px_0_var(--ink)]">
            <h2 className="text-2xl">Share honestly.</h2>
            <p className="mt-2">Only post projects and material you built or have the right to share. Do not manipulate votes, points, or rankings, or attack, scrape, or abuse the platform.</p>
          </section>
          <section className="rounded-[20px] border border-ink bg-pink p-6 shadow-[4px_4px_0_var(--ink)]">
            <h2 className="text-2xl">Protect yourself and others.</h2>
            <p className="mt-2">Keep your password, address, and school details private. If something online or in the group feels wrong, tell a moderator or email <a href="mailto:hello@teenovatex.org" className="font-semibold underline underline-offset-4">hello@teenovatex.org</a>. You will not be in trouble for speaking up.</p>
          </section>
        </div>

        <p className="mt-10 text-sm text-muted">The team may remove harmful content or pause an account to protect members. Read the full <a href="/terms-of-service" className="font-semibold text-rose underline underline-offset-4">Terms of Service</a> for the platform rules.</p>
      </main>
      <Footer />
    </>
  );
}
