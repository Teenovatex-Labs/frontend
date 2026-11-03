"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Motion";

const FEATURES = [
  {
    kind: "DISCUSS / CONNECT",
    type: "{ hello, world }",
    typeClass: "display-clean text-[25px]",
    name: "Global forums",
    title: "Get a fresh perspective.",
    body: "Ask technical questions, exchange resources and join discussions with members around the world.",
    cardClass: "bg-cream",
  },
  {
    kind: "SHARE / GET FEEDBACK",
    type: "Made by me.",
    typeClass: "display-clean text-[37px] -rotate-[4deg] underline decoration-2 underline-offset-[12px]",
    name: "Project showcases",
    title: "Show your work.",
    body: "Publish your projects, gather feedback and discover what other members are making.",
    cardClass: "bg-pink mt-6",
  },
  {
    kind: "EXPLORE / IMPROVE",
    type: "idea → attempt → aha!",
    typeClass: "display-clean text-[18px] text-yellow",
    name: "AI insights",
    title: "Work through the tricky bits.",
    body: "Use code suggestions and progress tracking to understand your next steps.",
    cardClass: "bg-[#292b25] text-cream",
  },
  {
    kind: "ASK / LEARN",
    type: "Good question.",
    typeClass: "display-clean text-[34px] rotate-[4deg]",
    name: "Mentorship",
    title: "Learn from experience.",
    body: "Access coaching and guidance from experienced mentors as you develop your skills.",
    cardClass: "bg-[#f5d8e3] mt-6",
  },
  {
    kind: "TEAM UP / BUILD",
    type: "you + me + what if?",
    typeClass: "display-clean text-[24px]",
    name: "Collaboration",
    title: "Make room for teamwork.",
    body: "Work in shared environments so your team can contribute to the same project in real time.",
    cardClass: "bg-[#f9f4d9]",
  },
];

// Vertical pixels scrolled per horizontal pixel the cards travel. Higher =
// slower, calmer carousel.
const SCROLL_RATIO = 2.2;
// Fraction of the remaining distance covered each frame; lower = smoother.
const EASE = 0.08;

export default function Toolkit() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [pinHeight, setPinHeight] = useState<number | undefined>(undefined);
  const [stickyTop, setStickyTop] = useState(0);

  const scrollToIndex = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(FEATURES.length - 1, next));
    const card = track.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setIndex(clamped);
  };

  // Size the pin zone so the cards' horizontal travel is spread over
  // SCROLL_RATIO times as much vertical scroll. When the pinned content is
  // taller than the viewport (short laptops, phones), stick it with a
  // negative top so its bottom, where the cards are, stays on screen.
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
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, []);

  // Drive the track's horizontal position from page vertical scroll while
  // the pin zone is in view. It advances on the way down, reverses on the
  // way back up. Skipped entirely for prefers-reduced-motion, where the
  // track falls back to manual swipe/arrow-button scrolling only.
  useEffect(() => {
    if (typeof window === "undefined") return;
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

    // The track eases toward the scroll-derived target instead of jumping
    // to it, so a mouse-wheel notch glides rather than lurches.
    let target = track.scrollLeft;
    let current = track.scrollLeft;
    let raf = 0;

    const tick = () => {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.5) current = target;
      track.scrollLeft = current;
      const max = track.scrollWidth - track.clientWidth;
      setIndex(max > 0 ? Math.round((current / max) * (FEATURES.length - 1)) : 0);
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
    if (initial !== null) {
      track.scrollLeft = initial;
      target = current = initial;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinHeight, stickyTop]);

  return (
    <section id="explore" className="border-y border-ink bg-yellow">
      <div ref={pinRef} style={{ height: pinHeight }}>
        <div ref={stickyRef} className="sticky py-16 md:py-24" style={{ top: stickyTop }}>
          {/* Desktop: pinned to the top-centre, between the heading and the
              blurb, tucked behind the cards. */}
          <img
            src="/assets/illustration-nobg.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -z-10 hidden w-[340px] -translate-x-1/2 opacity-40 lg:block xl:w-[400px]"
          />
          <div className="wrap relative">
            {/* Below lg there's no room between heading and blurb, so it
                sits centred above them instead. */}
            <img
              src="/assets/illustration-nobg.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none mx-auto -mt-16 mb-8 block w-[240px] opacity-40 md:-mt-24 md:w-[300px] lg:hidden"
            />
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <Reveal direction="right">
                  <h2 className="max-w-[760px] text-[38px] leading-[1.04] md:text-[58px]">
                    Find the people and tools to move your idea forward.
                  </h2>
                </Reveal>
              </div>

              <div className="max-w-[310px]">
                <p className="text-lg">Ask for help, meet a collaborator, or get useful feedback without pretending you already know everything.</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  The community is open now. A few platform tools are still on the way.
                </p>

                <div className="mt-4 flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => scrollToIndex(index - 1)}
                    disabled={index === 0}
                    aria-label="Previous features"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink text-xl transition-colors hover:enabled:bg-pink disabled:opacity-35"
                  >
                    ←
                  </button>
                  <span className="text-sm font-medium">
                    {String(index + 1).padStart(2, "0")} / {String(FEATURES.length).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToIndex(index + 1)}
                    disabled={index === FEATURES.length - 1}
                    aria-label="Next features"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink text-xl transition-colors hover:enabled:bg-pink disabled:opacity-35"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={trackRef}
            className="feature-track mt-8 flex gap-5 overflow-x-auto px-5 pb-6 md:px-[max(56px,calc((100vw-1280px)/2))]"
            role="region"
            aria-label="TeenovateX features, scroll horizontally"
          >
            {FEATURES.map((feature, featureIndex) => (
              <article
                key={feature.name}
                style={{ transform: `rotate(${featureIndex % 2 ? 0.7 : -0.55}deg)` }}
                className={`feature-card depth-card flex min-h-[450px] w-[82vw] max-w-[365px] shrink-0 flex-col overflow-hidden rounded-[18px] border-2 border-ink ${feature.cardClass}`}
              >
                <div className="flex justify-end px-6 py-5 text-[10px] font-medium tracking-wider">
                  <span>{feature.kind}</span>
                </div>

                <div
                  className={`flex min-h-[150px] flex-1 items-center justify-center px-5 text-center ${feature.typeClass}`}
                  aria-hidden="true"
                >
                  {feature.type}
                </div>

                <div className="border-t border-current p-6">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-wider">
                    {feature.name}
                  </p>
                  <h3 className="text-2xl leading-tight tracking-tight">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed opacity-85">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="wrap flex items-center justify-between gap-5">
            <span className="text-xs">← Swipe, scroll or use the arrows →</span>
          </div>
        </div>
      </div>
    </section>
  );
}
