"use client";

import { useRef, useState } from "react";

const FEATURES = [
  {
    tag: "01 / TX",
    kind: "DISCUSS / CONNECT",
    type: "{ hello, world }",
    typeClass: "font-mono text-[27px] font-medium tracking-tight",
    name: "Global forums",
    title: "Get a fresh perspective.",
    body: "Ask technical questions, exchange resources and join discussions with members around the world.",
    cardClass: "bg-cream",
  },
  {
    tag: "02 / TX",
    kind: "SHARE / GET FEEDBACK",
    type: "Made by me.",
    typeClass:
      "font-serif italic text-[52px] -rotate-[7deg] underline decoration-2 underline-offset-[12px]",
    name: "Project showcases",
    title: "Show your work.",
    body: "Publish your projects, gather feedback and discover what other members are making.",
    cardClass: "bg-pink mt-6",
  },
  {
    tag: "03 / TX",
    kind: "EXPLORE / IMPROVE",
    type: "idea → attempt → aha!",
    typeClass: "font-mono text-[22px] font-medium tracking-tight text-yellow",
    name: "AI insights",
    title: "Work through the tricky bits.",
    body: "Use code suggestions and progress tracking to understand your next steps.",
    cardClass: "bg-[#292b25] text-cream",
  },
  {
    tag: "04 / TX",
    kind: "ASK / LEARN",
    type: "Good question.",
    typeClass: "font-serif italic text-[46px] rotate-[5deg]",
    name: "Mentorship",
    title: "Learn from experience.",
    body: "Access coaching and guidance from experienced mentors as you develop your skills.",
    cardClass: "bg-[#f5d8e3] mt-6",
  },
  {
    tag: "05 / TX",
    kind: "TEAM UP / BUILD",
    type: "you + me + what if?",
    typeClass: "font-serif italic text-[31px]",
    name: "Collaboration",
    title: "Make room for teamwork.",
    body: "Work in shared environments so your team can contribute to the same project in real time.",
    cardClass: "bg-[#f9f4d9]",
  },
];

export default function Toolkit() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollToIndex = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(FEATURES.length - 1, next));
    const card = track.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setIndex(clamped);
  };

  return (
    <section id="explore" className="border-y border-ink bg-yellow py-16 md:py-24">
      <div className="wrap">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-rose">02 / The toolkit for your next thing</p>
            <h2 className="mt-6 text-[38px] leading-[1.04] md:text-[54px]">
              Meet your
              <br />
              next <span className="font-serif italic font-normal">toolkit.</span>
            </h2>
          </div>

          <div className="max-w-[310px]">
            <p>From finding a collaborator to getting feedback on your work.</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Some platform features are still coming soon. You can join the
              WhatsApp community today.
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
        {FEATURES.map((feature) => (
          <article
            key={feature.name}
            className={`feature-card flex min-h-[450px] w-[82vw] max-w-[365px] shrink-0 flex-col overflow-hidden rounded-md border border-ink ${feature.cardClass}`}
          >
            <div className="flex justify-between px-6 py-5 text-[10px] font-medium tracking-wider">
              <span>{feature.tag}</span>
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
    </section>
  );
}
