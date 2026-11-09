"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

// Vertical pixels scrolled per horizontal pixel the cards travel. Higher = slower, calmer.
const SCROLL_RATIO = 1.6;
// Fraction of the remaining distance covered each frame; lower = smoother.
const EASE = 0.08;

/**
 * A pinned horizontal slider: the section sticks while page scroll slides the cards sideways, then releases.
 * Same behaviour as the "From curious to creating" section. Swipe, the arrows and (with reduced motion) plain
 * horizontal scrolling all work too.
 */
export default function PinnedSlider({
  header,
  blurb,
  background,
  label,
  children,
}: {
  header: ReactNode;
  /** Short text beside the heading, above the arrows. */
  blurb?: ReactNode;
  /** Decoration drawn behind the pinned content. */
  background?: ReactNode;
  label: string;
  children: ReactNode;
}) {
  const cards = Children.toArray(children);
  const count = cards.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [pinHeight, setPinHeight] = useState<number | undefined>(undefined);
  const [stickyTop, setStickyTop] = useState(0);

  const scrollToIndex = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(count - 1, next));
    (track.children[clamped] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setIndex(clamped);
  };

  // Spread the cards' horizontal travel over SCROLL_RATIO times as much vertical scroll. When the pinned content
  // is taller than the viewport, stick it with a negative top so its bottom (the cards) stays on screen.
  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!track || !sticky) return;
    const recompute = () => {
      const horizontal = Math.max(0, track.scrollWidth - track.clientWidth);
      setStickyTop(Math.min(0, window.innerHeight - sticky.offsetHeight));
      setPinHeight(sticky.offsetHeight + horizontal * SCROLL_RATIO);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(track);
    ro.observe(sticky);
    window.addEventListener("resize", recompute);
    // Web fonts change the card sizes after first paint.
    void document.fonts?.ready.then(recompute);
    return () => { ro.disconnect(); window.removeEventListener("resize", recompute); };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pin = pinRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!pin || !sticky || !track) return;

    const targetFor = () => {
      const range = pin.offsetHeight - sticky.offsetHeight;
      if (range <= 0) return null;
      const progress = Math.min(1, Math.max(0, (stickyTop - pin.getBoundingClientRect().top) / range));
      return progress * (track.scrollWidth - track.clientWidth);
    };

    let target = track.scrollLeft;
    let current = track.scrollLeft;
    let raf = 0;
    const tick = () => {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.5) current = target;
      track.scrollLeft = current;
      const max = track.scrollWidth - track.clientWidth;
      setIndex(max > 0 ? Math.round((current / max) * (count - 1)) : 0);
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      const next = targetFor();
      if (next === null) return;
      if (!raf) current = track.scrollLeft;
      target = next;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const initial = targetFor();
    if (initial !== null) { track.scrollLeft = initial; target = current = initial; }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [pinHeight, stickyTop, count]);

  return (
    <div ref={pinRef} style={{ height: pinHeight }}>
      <div ref={stickyRef} className="sticky overflow-hidden py-8 md:py-8" style={{ top: stickyTop }}>
        {background}
        <div className="wrap relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>{header}</div>
          <div className="max-w-[340px]">
            {blurb}
            <div className="mt-4 flex items-center gap-5">
              <button type="button" onClick={() => scrollToIndex(index - 1)} disabled={index === 0} aria-label="Previous" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink bg-cream text-xl transition-colors hover:enabled:bg-pink disabled:opacity-35">←</button>
              <span className="text-sm font-medium">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
              <button type="button" onClick={() => scrollToIndex(index + 1)} disabled={index === count - 1} aria-label="Next" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink bg-cream text-xl transition-colors hover:enabled:bg-pink disabled:opacity-35">→</button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          className="feature-track relative mt-5 flex gap-5 overflow-x-auto px-5 pb-6 md:px-[max(56px,calc((100vw-1280px)/2))]"
          role="region"
          aria-label={label}
        >
          {cards}
        </div>
      </div>
    </div>
  );
}
