"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Two-sided shell for the /auth page. On large screens the form sits
 * beside a full-height brand panel; below that it collapses to a single
 * centred column with a big illustration watermark behind the form
 * instead, since there's no room for a side panel.
 *
 * Switching between login and signup keeps both panels mounted in the
 * same two grid slots and just swaps which content each holds — so this
 * runs a manual FLIP (First-Last-Invert-Play) on every `imageSide` change:
 * capture each panel's position before the swap, let the swap happen,
 * then animate from the old position to the new one. That's what actually
 * produces the "picture and form trade places" slide; CSS alone can't
 * animate a `order` change. */
export default function AuthSplit({
  children,
  image,
  imageSide,
}: {
  children: ReactNode;
  image: { src: string; flip?: boolean };
  imageSide: "left" | "right";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const prevRects = useRef<{ panel?: DOMRect; form?: DOMRect }>({});

  useLayoutEffect(() => {
    if (window.innerWidth < 1024) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    (
      [
        ["panel", panelRef.current],
        ["form", formRef.current],
      ] as const
    ).forEach(([key, el]) => {
      if (!el) return;
      const next = el.getBoundingClientRect();
      const prev = prevRects.current[key];
      if (prev) {
        const dx = prev.left - next.left;
        if (dx !== 0) {
          el.style.transition = "none";
          el.style.transform = `translateX(${dx}px)`;
          // Force a reflow so the browser registers the jump before we
          // transition back to identity — otherwise it just skips straight
          // to the end state.
          el.getBoundingClientRect();
          el.style.transition = "transform 1s cubic-bezier(0.22, 0.68, 0, 1.01)";
          el.style.transform = "translateX(0)";
        }
      }
      prevRects.current[key] = next;
    });
  }, [imageSide]);

  const panel = <ImagePanel key="panel" ref={panelRef} {...image} />;
  const form = (
    <div
      key="form"
      ref={formRef}
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#392a36] px-4 py-8 lg:h-screen lg:overflow-y-auto lg:px-8"
    >
      <PlayfulBackdrop />
      {/* Mobile/tablet only — there's no room for the side panel, so the
          brand shows up as a big, unmissable watermark behind the form. */}
      <div className="relative m-auto w-full max-w-[480px] rounded-[28px] border border-white/20 bg-cream px-5 py-8 shadow-[12px_12px_0_rgba(15,14,17,.28)] sm:px-9 sm:py-10">{children}</div>
    </div>
  );

  return (
    <main className="min-h-screen lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      {imageSide === "left" ? [panel, form] : [form, panel]}
    </main>
  );
}

function PlayfulBackdrop() {
  const marks = ["✳", "↗", "◇", "✦", "⌁", "○", "✎", "+", "✳", "↝", "□", "✦", "⌘", "◇", "↗", "○"];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(255,249,235,.18)_1px,transparent_0)] bg-[size:23px_23px]">
      {marks.map((mark, index) => (
        <span
          key={index}
          className="absolute select-none font-serif text-3xl opacity-80 motion-safe:animate-[auth-drift_8s_ease-in-out_infinite_alternate]"
          style={{
            left: `${5 + (index * 37) % 88}%`,
            top: `${4 + (index * 29) % 89}%`,
            color: ["#f3aac7", "#f5e794", "#fff9eb", "#bd91bb"][index % 4],
            animationDelay: `${-index * 0.65}s`,
          }}
        >{mark}</span>
      ))}
      <style>{`@keyframes auth-drift { from { transform: translate3d(0,0,0) rotate(-8deg); } to { transform: translate3d(8px,-12px,0) rotate(8deg); } }`}</style>
    </div>
  );
}

function ImagePanel({
  src,
  flip,
  ref,
}: {
  src: string;
  flip?: boolean;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className="relative hidden overflow-hidden lg:block">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`h-full w-full object-cover ${flip ? "-scale-x-100" : ""}`}
      />
    </div>
  );
}
