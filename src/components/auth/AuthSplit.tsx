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
          el.style.transition = "transform 0.6s cubic-bezier(0.22, 0.68, 0, 1.01)";
          el.style.transform = "translateX(0)";
        }
      }
      prevRects.current[key] = next;
    });
  }, [imageSide]);

  const panel = <ImagePanel key="panel" ref={panelRef} {...image} adjacentEdge={imageSide === "left" ? "right" : "left"} />;
  const form = (
    <div
      key="form"
      ref={formRef}
      className="relative flex h-screen items-center justify-center overflow-hidden px-5 py-6"
    >
      {/* Mobile/tablet only — there's no room for the side panel, so the
          brand shows up as a big, unmissable watermark behind the form. */}
      <img
        src="/assets/illustration2-nobg.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 w-[240%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.16] lg:hidden"
      />
      <div className="relative w-full max-w-[440px]">{children}</div>
    </div>
  );

  return (
    <main className="h-screen overflow-hidden lg:grid lg:grid-cols-2">
      {imageSide === "left" ? [panel, form] : [form, panel]}
    </main>
  );
}

function ImagePanel({
  src,
  flip,
  adjacentEdge,
  ref,
}: {
  src: string;
  flip?: boolean;
  adjacentEdge: "left" | "right";
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
      {/* Blends the panel's inner edge — whichever side touches the form —
          into the form side's cream background instead of a sharp cut. */}
      <div
        className={`pointer-events-none absolute inset-y-0 w-28 ${
          adjacentEdge === "left"
            ? "left-0 bg-gradient-to-r from-cream to-transparent"
            : "right-0 bg-gradient-to-l from-cream to-transparent"
        }`}
      />
    </div>
  );
}
