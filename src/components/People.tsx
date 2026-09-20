"use client";

import { useState } from "react";
import Image from "next/image";
import FoundersOrbit from "./FoundersOrbit";
import FounderModal from "./FounderModal";

export type Founder = {
  initials: string;
  name: string;
  role: string;
  href: string;
  bg: string;
  bio: string;
  photo?: string;
};

const FOUNDERS: Founder[] = [
  {
    initials: "AM",
    name: "Anas Abubakar Masama",
    role: "Founder",
    href: "https://www.linkedin.com/in/anasmasama",
    bg: "bg-yellow",
    bio: "Visionary leader focused on bridging the gap between teen curiosity and professional tech.",
  },
  {
    initials: "SS",
    name: "Sanni Shazily",
    role: "Co-founder",
    href: "https://www.linkedin.com/in/sanni-shazily-bba942266",
    bg: "bg-pink",
    bio: "Passionate about building scalable systems and empowering youth through code.",
    photo: "/founders/sanni-shazily.jpg",
  },
  {
    initials: "YL",
    name: "Yasin Lasisi",
    role: "Co-founder",
    href: "https://www.linkedin.com/in/yasin-lasisi-98626a289/",
    bg: "bg-cream",
    bio: "Creative strategist ensuring our community remains vibrant, inclusive, and forward-thinking.",
  },
];

export default function People() {
  const [active, setActive] = useState<Founder | null>(null);

  return (
    <section id="people" className="wrap py-16 md:py-24">
      <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <p className="eyebrow text-rose">03 / The people behind it</p>
          <h2 className="mt-6 max-w-2xl text-4xl md:text-5xl">
            The people
            <br />
            behind the plans.
          </h2>
          <p className="mt-5 max-w-md text-muted">
            A growing network of builders, mentors and collaborators &mdash;
            connected the way good ideas actually spread.
          </p>
        </div>
        <FoundersOrbit founders={FOUNDERS} onSelect={setActive} />
      </div>

      <p className="mt-12 text-muted md:text-right">Tap a founder to read their story.</p>

      <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
        {FOUNDERS.map((founder) => (
          <button
            key={founder.name}
            type="button"
            onClick={() => setActive(founder)}
            className="group flex flex-col items-center gap-4 text-center"
          >
            <span
              className={`flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-ink transition-transform group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0_var(--pink)] md:h-40 md:w-40 ${
                founder.photo ? "" : founder.bg
              }`}
            >
              {founder.photo ? (
                <Image
                  src={founder.photo}
                  alt={founder.name}
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: "50% 18%" }}
                />
              ) : (
                <span className="text-3xl font-medium">{founder.initials}</span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-base font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
                {founder.name}
              </span>
              <span className="mt-1 block text-[13px] text-muted">{founder.role}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start gap-3 border-t border-line pt-6 text-sm md:flex-row md:items-center md:justify-between">
        <p>Want to help shape the community?</p>
        <a
          href="https://teenovatex.fillout.com/cftm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-4 border-b border-ink pb-1 font-bold hover:text-rose"
        >
          Apply to the core team <span>↗︎</span>
        </a>
      </div>

      {active && <FounderModal founder={active} onClose={() => setActive(null)} />}
    </section>
  );
}
