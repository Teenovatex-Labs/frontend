import type { Metadata } from "next";

export const metadata: Metadata = { title: "TeenovateX Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <main className="wrap flex min-h-screen flex-col justify-center gap-4 py-16">
      <p className="eyebrow text-rose">admin.teenovatex.org</p>
      <h1 className="text-[38px] md:text-[54px]">
        The admin console <span className="font-serif font-normal italic">is on its way.</span>
      </h1>
    </main>
  );
}
