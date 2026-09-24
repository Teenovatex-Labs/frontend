"use client";

import { useState } from "react";
import Link from "next/link";
import FoundersOrbit from "./FoundersOrbit";
import FounderModal from "./FounderModal";

export type Founder = {
  initials: string;
  name: string;
  role: string;
  speciality: string;
  contribution: string;
  href?: string;
  bg: string;
  fg?: string;
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
    speciality: "Strategy, team, administration, partnerships, governance and final accountability.",
    contribution: "He aligns the system, removes blockers and makes sure every major commitment has an owner.",
  },
  {
    initials: "SS",
    name: "Sanni Shazily",
    role: "Co-founder",
    href: "https://www.linkedin.com/in/sanni-shazily-bba942266",
    bg: "bg-pink",
    bio: "Passionate about building scalable systems and empowering youth through code.",
    photo: "/founders/sanni-shazily.jpg",
    speciality: "Programmes, product direction, technical quality and selected public representation.",
    contribution: "He turns possibility into things teenagers can join, use and build through.",
  },
  {
    initials: "YL",
    name: "Yasin Lasisi",
    role: "Co-founder",
    href: "https://www.linkedin.com/in/yasin-lasisi-98626a289/",
    bg: "bg-cream",
    bio: "Creative strategist ensuring our community remains vibrant, inclusive, and forward-thinking.",
    speciality: "Onboarding, opportunities, community health, outreach and impact evidence.",
    contribution: "He brings member reality into decisions and tracks whether TeenovateX is creating direction.",
  },
  {
    initials: "AF",
    name: "Abdulbasit Fazazi",
    role: "Chief Operating Officer",
    bg: "bg-line",
    bio: "Turns founder decisions into disciplined weekly execution across every team.",
    speciality: "Operating cadence, cross-team delivery, accountability and strategic ecosystem intelligence.",
    contribution: "He keeps the organisation moving when enthusiasm fades and makes the comeback operationally believable.",
  },
  {
    initials: "RA",
    name: "Raufu Abdulrahman",
    role: "Chief Technology Officer",
    bg: "bg-muted",
    bio: "Owns platform architecture, engineering standards and the team that ships it.",
    speciality: "Architecture, security, releases, code quality and technical team development.",
    contribution: "He turns product intent into dependable technology and prevents the rebuild from becoming another fragile prototype.",
  },
  {
    initials: "MU",
    name: "Muaz",
    role: "Brand and Design Lead",
    bg: "bg-rose",
    bio: "Gave the rebrand its coherent identity, from logo system to visual standards.",
    speciality: "Brand identity direction, logo development, visual standards and quality control.",
    contribution: "He gives every initiative a shared visual language and a stronger signal of care.",
  },
  {
    initials: "AG",
    name: "Adeyemi Gabriel",
    role: "Partnerships and Finance Lead",
    bg: "bg-ink",
    fg: "text-cream",
    bio: "Builds partnerships and keeps budgets honest without letting promises drift.",
    speciality: "Budgets, financial records, sponsor proposals and partnership administration.",
    contribution: "He turns external support into transparent, mission-aligned resources the team can depend on.",
  },
  {
    initials: "QL",
    name: "Quadri Lasisi",
    role: "Head of Labs and Technical Programmes",
    bg: "bg-yellow",
    bio: "Converts ambitious ideas into structured build challenges and technical programmes.",
    speciality: "Build challenges, workshops, mentors and programme delivery systems.",
    contribution: "He creates the environments where members learn by building rather than watching.",
  },
  {
    initials: "DU",
    name: "David Uhumagho",
    role: "Venture and Project Incubation Lead",
    bg: "bg-pink",
    bio: "Helps promising member projects validate real problems and ship beyond a challenge.",
    speciality: "Problem discovery, validation, build reviews and project showcases.",
    contribution: "He helps members move from exciting ideas to evidence that somebody needs what they built.",
  },
  {
    initials: "YB",
    name: "Yusuf Barika-Bodunrin",
    role: "Research and Deep Technology Lead",
    bg: "bg-line",
    bio: "Connects ambitious STEM interests to serious research in energy, hardware and ML.",
    speciality: "Research tracks, technical publications and engineering-led exploration.",
    contribution: "He helps technically ambitious members see research and deep engineering as futures they can begin exploring now.",
  },
  {
    initials: "AL",
    name: "Adam Lawal",
    role: "Research, Data and Impact Lead",
    bg: "bg-muted",
    bio: "Owns the evidence behind every decision about the member experience.",
    speciality: "Member research, outcome measurement, learning reports and opportunity intelligence.",
    contribution: "He shows what is working, what is failing and where members need a better path.",
  },
  {
    initials: "WO",
    name: "Wisdom Ofogba",
    role: "Frontend Engineer",
    bg: "bg-rose",
    bio: "Makes the platform fast, accessible and faithful to the design on real devices.",
    speciality: "Interface implementation, accessibility, performance and design-system consistency.",
    contribution: "He makes the member experience tangible while protecting quality between design and production.",
  },
  {
    initials: "AI",
    name: "Aisha",
    role: "Product and Editorial Designer",
    bg: "bg-ink",
    fg: "text-cream",
    bio: "Translates the new direction into clear, human digital experiences.",
    speciality: "UI and UX for the website, plus design leadership for TeenCoffee.",
    contribution: "She makes the system usable and gives the brand a human digital expression.",
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
          <div className="mt-6 inline-block overflow-hidden rounded-2xl border border-ink bg-pink shadow-[6px_6px_0_var(--ink)]">
            <img src="/assets/logo-long-1.svg" alt="" aria-hidden="true" className="block w-[220px]" />
          </div>
        </div>
        <FoundersOrbit founders={FOUNDERS} onSelect={setActive} />
      </div>

      <p className="mt-12 text-muted md:text-right">Tap anyone in the orbit to read their story.</p>

      <div className="mt-10 flex flex-col items-start gap-4 border-t border-line pt-6 text-sm md:flex-row md:items-center md:justify-between">
        <p>Want to help shape the community?</p>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href="/teenovators"
            className="inline-flex items-center gap-4 border-b border-ink pb-1 font-bold hover:text-rose"
          >
            View the Teenovators and what they&rsquo;ve done <span>↗︎</span>
          </Link>
          <a
            href="https://teenovatex.fillout.com/cftm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 border-b border-ink pb-1 font-bold hover:text-rose"
          >
            Apply to the core team <span>↗︎</span>
          </a>
        </div>
      </div>

      {active && <FounderModal founder={active} onClose={() => setActive(null)} />}
    </section>
  );
}
