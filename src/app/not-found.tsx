import type { Metadata } from "next";
import { LottieSlot } from "@/components/ui/LottieSlot";

export const metadata: Metadata = { title: "Page not found" };

// Shown for any URL the app doesn't have, on every host (landing, app, admin).
export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-16 text-center">
      <div>
        <LottieSlot src="/lottie/not-found.json" label="" poster="/assets/logo-nobg.svg" className="mx-auto h-48 w-48" />
        <p className="eyebrow text-rose">404</p>
        <h1 className="mt-3 text-[32px] tracking-[-0.03em] md:text-[44px]">
          This page <span className="font-serif font-normal italic">wandered off.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[420px] text-muted">The link may be old or mistyped. Head back and we&rsquo;ll point you the right way.</p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/" className="btn">Go home</a>
          <a href="/contact" className="btn-secondary">Tell us about it</a>
        </div>
      </div>
    </main>
  );
}
