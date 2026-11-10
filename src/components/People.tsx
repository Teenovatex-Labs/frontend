"use client";

import { useState } from "react";
import Link from "next/link";
import FoundersOrbit from "./FoundersOrbit";
import FounderModal from "./FounderModal";
import Reveal from "./Reveal";

export type Founder = {
  initials: string;
  name: string;
  role: string;
  unit: string;
  bio: string;
  mandate: string;
  speciality: string;
  contribution: string;
  strengths: string[];
  focus: string[];
  worksWith: string[];
  success: string;
  href?: string;
  bg: string;
  fg?: string;
  photo?: string;
};

const FOUNDERS: Founder[] = [
  {
    initials: "AM",
    name: "Anas Abubakar Masama",
    role: "Founder",
    unit: "Executive leadership",
    href: "https://www.linkedin.com/in/anasmasama",
    bg: "bg-yellow",
    photo: "/founders/anas.jpg",
    bio: "Sets the direction, protects the mission and makes the final calls that keep TeenovateX moving as one organisation.",
    mandate: "Turn the community's vision into clear priorities, credible relationships and accountable leadership.",
    speciality: "Strategy, team, administration, partnerships, governance and final accountability.",
    contribution: "He aligns the system, removes blockers and makes sure every major commitment has an owner.",
    strengths: ["Strategic direction", "External relations", "Team alignment"],
    focus: ["Set the leadership rhythm", "Build supporter trust", "Keep every workstream accountable"],
    worksWith: ["Abdulbasit Fazazi", "Sanni Shazily", "Adeyemi Gabriel"],
    success: "The team knows what matters, who owns it and what must happen next without waiting for a crisis.",
  },
  {
    initials: "SS",
    name: "Sanni Shazily",
    role: "Co-founder",
    unit: "Innovation and programmes",
    href: "https://www.linkedin.com/in/sanni-shazily-bba942266",
    bg: "bg-pink",
    photo: "/founders/sanni-shazily.jpg",
    bio: "Shapes ambitious ideas into products, programmes and stories that teenagers can actually experience.",
    mandate: "Lead innovation from the first idea to a programme or product that members can use, test and improve.",
    speciality: "Programmes, product direction, technical quality and selected public representation.",
    contribution: "He turns possibility into things teenagers can join, use and build through.",
    strengths: ["Product thinking", "Programme design", "Public speaking"],
    focus: ["Define hands-on technical programmes", "Guide product decisions", "Represent the work clearly in public"],
    worksWith: ["Anas Abubakar Masama", "Quadri Lasisi", "David Uhumagho"],
    success: "TeenovateX consistently ships useful experiences instead of collecting unfinished ideas.",
  },
  {
    initials: "YL",
    name: "Yasin Lasisi",
    role: "Co-founder",
    unit: "Community and impact",
    href: "https://www.linkedin.com/in/yasin-lasisi-98626a289/",
    bg: "bg-cream",
    photo: "/founders/yasin.jpg",
    bio: "Keeps the organisation close to the teenagers it exists for and makes sure their reality changes the plan.",
    mandate: "Build a member experience where teenagers feel seen, find opportunities and keep moving forward.",
    speciality: "Onboarding, opportunities, community health, outreach and impact evidence.",
    contribution: "He brings member reality into decisions and tracks whether TeenovateX is creating direction.",
    strengths: ["Community trust", "Member advocacy", "Impact storytelling"],
    focus: ["Rebuild onboarding", "Create a member feedback loop", "Connect members to timely opportunities"],
    worksWith: ["Adam Lawal", "Aisha Onola", "Anas Abubakar Masama"],
    success: "Members can explain what TeenovateX helped them discover, build or become confident enough to attempt.",
  },
  {
    initials: "AF",
    name: "Abdulbasit Fazazi",
    role: "Chief Operating Officer",
    unit: "Operations",
    bg: "bg-line",
    bio: "Turns founder decisions into disciplined weekly execution across every team.",
    mandate: "Build the operating discipline that carries the organisation when motivation alone is not enough.",
    speciality: "Operating cadence, cross-team delivery, accountability and strategic ecosystem intelligence.",
    contribution: "He keeps the organisation moving forward smoothly and makes ambitious goals operationally believable.",
    strengths: ["Execution discipline", "Ecosystem intelligence", "Accountability"],
    focus: ["Run the weekly operating review", "Unblock cross-team delivery", "Turn relationships into practical leverage"],
    worksWith: ["Anas Abubakar Masama", "Adeyemi Gabriel", "Koded"],
    success: "Promises become finished work, missed commitments surface early and no important task becomes ownerless.",
  },
  {
    initials: "KO",
    name: "Koded",
    role: "Chief Technology Officer",
    unit: "Technology",
    bg: "bg-muted",
    photo: "/founders/koded.jpg",
    bio: "Owns platform architecture, engineering standards and the team that ships it.",
    mandate: "Build a dependable technical foundation for the website, member platform and future TeenovateX products.",
    speciality: "Architecture, security, releases, code quality and technical team development.",
    contribution: "He turns product intent into dependable technology and prevents the rebuild from becoming another fragile prototype.",
    strengths: ["Systems architecture", "Full-stack delivery", "Technical leadership"],
    focus: ["Set the platform architecture", "Define engineering standards", "Build a healthy release process"],
    worksWith: ["Wisdom Ofogba", "Ajolaye Dennis", "Aisha Onola"],
    success: "The platform is secure, maintainable and easy for the engineering team to improve without breaking member trust.",
  },
  {
    initials: "OM",
    name: "Oyebisi Muaz",
    role: "Brand and Design Lead",
    unit: "Brand",
    bg: "bg-rose",
    photo: "/founders/muaz.jpg",
    bio: "Gives the brand its coherent identity, from the logo system to the standards behind every public touchpoint.",
    mandate: "Create and protect a visual identity that feels youthful, credible and unmistakably TeenovateX.",
    speciality: "Brand identity direction, logo development, visual standards and quality control.",
    contribution: "He gives every initiative a shared visual language and a stronger signal of care.",
    strengths: ["Identity systems", "Visual direction", "Quality control"],
    focus: ["Refine the brand identity", "Build reusable design rules", "Direct campaigns and visual storytelling"],
    worksWith: ["Aisha Onola", "Anas Abubakar Masama", "Sanni Shazily"],
    success: "Every public touchpoint looks related, considered and recognisable without feeling too childish or too corporate.",
  },
  {
    initials: "AG",
    name: "Adeyemi Gabriel",
    role: "Partnerships and Finance Lead",
    unit: "Growth and resources",
    bg: "bg-ink",
    fg: "text-cream",
    photo: "/founders/gabriel.jpg",
    bio: "Builds partnerships and keeps budgets honest without letting promises drift.",
    mandate: "Secure and steward the money, partners and practical support required to deliver the mission responsibly.",
    speciality: "Budgets, financial records, sponsor proposals and partnership administration.",
    contribution: "He turns external support into transparent, mission-aligned resources the team can depend on.",
    strengths: ["Partnership operations", "Financial discipline", "Proposal support"],
    focus: ["Create a simple finance system", "Build the partner pipeline", "Budget and steward every initiative"],
    worksWith: ["Anas Abubakar Masama", "Abdulbasit Fazazi", "Adam Lawal"],
    success: "The organisation can fund its priorities, explain every expense and make promises it can afford to keep.",
  },
  {
    initials: "QL",
    name: "Quadri Lasisi",
    role: "Head of Labs and Technical Programmes",
    unit: "Labs",
    bg: "bg-yellow",
    bio: "Converts ambitious ideas into structured build challenges and technical programmes.",
    mandate: "Design hands-on environments where teenagers learn by solving, building, presenting and improving real work.",
    speciality: "Build challenges, workshops, mentors and programme delivery systems.",
    contribution: "He creates the environments where members learn by building rather than watching.",
    strengths: ["Rapid building", "Technical teaching", "Programme facilitation"],
    focus: ["Design the first Labs challenge", "Recruit mentors and reviewers", "Create a repeatable workshop format"],
    worksWith: ["Sanni Shazily", "David Uhumagho", "Yusuf Barika-Bodunrin"],
    success: "Members leave each programme with stronger judgment, visible proof of work and a clear next challenge.",
  },
  {
    initials: "DU",
    name: "David Uhumagho",
    role: "Venture and Project Incubation Lead",
    unit: "Project incubation",
    bg: "bg-pink",
    photo: "/founders/uyi.jpg",
    bio: "Helps promising member projects validate real problems and ship beyond a challenge.",
    mandate: "Help strong member projects survive beyond the event that created them and grow through evidence.",
    speciality: "Problem discovery, validation, build reviews and project showcases.",
    contribution: "He helps members move from exciting ideas to evidence that somebody needs what they built.",
    strengths: ["Problem validation", "Product critique", "Builder coaching"],
    focus: ["Create an incubation playbook", "Run project review sessions", "Prepare the first member showcase"],
    worksWith: ["Quadri Lasisi", "Sanni Shazily", "Adam Lawal"],
    success: "Promising projects gain users, feedback or a credible experiment instead of disappearing after demo day.",
  },
  {
    initials: "YB",
    name: "Yusuf Barika-Bodunrin",
    role: "Research and Deep Technology Lead",
    unit: "Deep technology",
    bg: "bg-line",
    bio: "Connects ambitious STEM interests to serious research in energy, hardware and machine learning.",
    mandate: "Give technically ambitious members a credible path into research, engineering depth and scientific communication.",
    speciality: "Research tracks, technical publications and engineering-led exploration.",
    contribution: "He helps technically ambitious members see research and deep engineering as futures they can begin exploring now.",
    strengths: ["Energy systems", "Machine learning", "Technical research"],
    focus: ["Define the first research track", "Create a reading and experiment culture", "Guide members toward publishable work"],
    worksWith: ["Quadri Lasisi", "Adam Lawal", "Koded"],
    success: "Members can move from curiosity to a researched question, a documented experiment and a stronger technical direction.",
  },
  {
    initials: "AL",
    name: "Adam Lawal",
    role: "Research, Data and Impact Lead",
    unit: "Evidence and learning",
    href: "https://ng.linkedin.com/in/adamlawal",
    bg: "bg-muted",
    photo: "/founders/adam-lawal.jpg",
    bio: "Owns the evidence behind every decision about the member experience.",
    mandate: "Make TeenovateX learn from evidence, not assumptions, and show whether its work is changing member outcomes.",
    speciality: "Member research, outcome measurement, learning reports and opportunity intelligence.",
    contribution: "He shows what is working, what is failing and where members need a better path.",
    strengths: ["Data analysis", "Applied research", "Impact measurement"],
    focus: ["Set the member baseline", "Build a lightweight outcomes system", "Publish useful opportunity intelligence"],
    worksWith: ["Yasin Lasisi", "Yusuf Barika-Bodunrin", "Adeyemi Gabriel"],
    success: "Leadership can point to credible evidence when improving programmes, reporting impact or asking partners for support.",
  },
  {
    initials: "WO",
    name: "Wisdom Ofogba",
    role: "Frontend Engineer",
    unit: "Product engineering",
    bg: "bg-rose",
    bio: "Makes the platform fast, accessible and faithful to the design on real devices.",
    mandate: "Turn the new product and brand direction into a frontend members can trust on any screen.",
    speciality: "Interface implementation, accessibility, performance and design-system consistency.",
    contribution: "He makes the member experience tangible while protecting quality between design and production.",
    strengths: ["Interface engineering", "Responsive systems", "Product polish"],
    focus: ["Rebuild the public website", "Create reusable UI foundations", "Protect accessibility and performance"],
    worksWith: ["Koded", "Ajolaye Dennis", "Aisha Onola"],
    success: "The interface feels considered on mobile and desktop, loads quickly and stays easy for the team to extend.",
  },
  {
    initials: "AO",
    name: "Aisha Onola",
    role: "Product and Editorial Designer",
    unit: "Product experience",
    bg: "bg-ink",
    fg: "text-cream",
    photo: "/founders/aisha.jpg",
    bio: "Translates the new direction into clear, human digital experiences.",
    mandate: "Design the member-facing website and TeenCoffee experience so the brand feels human, useful and easy to navigate.",
    speciality: "UI and UX for the website, plus design leadership for TeenCoffee.",
    contribution: "She makes the system usable and gives the brand a human digital expression.",
    strengths: ["UI and UX", "Editorial design", "Newsletter systems"],
    focus: ["Complete the website experience", "Design the TeenCoffee system", "Test key journeys with teenagers"],
    worksWith: ["Oyebisi Muaz", "Wisdom Ofogba", "Yasin Lasisi"],
    success: "A teenager can understand TeenovateX, find what matters and take the next step without needing a group chat explanation.",
  },
  {
    initials: "AD",
    name: "Ajolaye Dennis",
    role: "Backend Engineer",
    unit: "Product engineering",
    bg: "bg-yellow",
    photo: "/founders/dennis.jpg",
    bio: "Builds the server side of the platform: the APIs and data that members' accounts, projects and progress depend on.",
    mandate: "Keep the backend dependable, secure and easy to build on, so the rest of the product can move quickly.",
    speciality: "APIs, databases and server-side logic.",
    contribution: "He works beside Koded and Wisdom so that what members see on screen is backed by services that hold up.",
    strengths: ["Backend engineering", "APIs and data", "Reliability"],
    focus: ["Build and maintain the platform's APIs", "Keep member data safe and consistent", "Give the frontend what it needs to ship"],
    worksWith: ["Koded", "Wisdom Ofogba"],
    success: "Members never think about the backend, because everything they do just works.",
  },
];

export default function People() {
  const [active, setActive] = useState<Founder | null>(null);

  return (
    <section id="people" className="relative">
      <div className="wrap grid gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
        {/* Bottom padding reserves the height of the corner logo (54vw wide,
            1632x1109 aspect) so the text never runs into it. */}
        <Reveal from="left" className="lg:pb-[calc(min(37vw,585px)+32px)]">
          <p className="eyebrow text-rose">03 / The humans behind it</p>
          <h2 className="mt-6 max-w-2xl text-4xl md:text-5xl">
            Meet the people
            <br />
            bringing the mission to life.
          </h2>
          <p className="mt-5 max-w-md text-muted">
            A dedicated team of builders, operators and researchers. Each person champions a vital part of the global community.
          </p>
        </Reveal>
        <Reveal from="right" delay={0.12}>
          <FoundersOrbit founders={FOUNDERS} onSelect={setActive} />

          <p className="mt-8 text-sm text-muted md:mt-12 md:text-right">Tap anyone in the orbit to open their role in the system.</p>

          <div className="mt-8 flex flex-col items-start gap-4 border-t border-line pt-6 text-sm md:mt-10">
            <p>Want to help shape the community?</p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/story" className="btn-secondary btn-sm text-center">
                View the Teenovators and what they&rsquo;ve done <span aria-hidden="true">↗</span>
              </Link>
              <a
                href="https://teenovatex.fillout.com/cftm"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm text-center"
              >
                Apply to the core team <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
      {/* Flush in the section's bottom-left corner — on tablet and desktop it sits neatly in the reserved space */}
      <img
        src="/assets/logo-long-1.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none mt-6 block w-full max-w-[420px] lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:w-[46vw] lg:max-w-[720px] xl:w-[54vw] xl:max-w-[860px]"
      />

      {active && (
        <FounderModal
          founder={active}
          founders={FOUNDERS}
          onSelect={setActive}
          onClose={() => setActive(null)}
        />
      )}
    </section>
  );
}
