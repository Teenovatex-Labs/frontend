import Image from "next/image";
import type { ReactNode } from "react";

const ACTION_WORDS = [
  { word: "Explore", rotate: "-rotate-3", bg: "bg-cream" },
  { word: "Learn", rotate: "rotate-2", bg: "bg-pink" },
  { word: "Build", rotate: "-rotate-2", bg: "bg-yellow" },
  { word: "Test", rotate: "rotate-3", bg: "bg-cream" },
  { word: "Share", rotate: "-rotate-1", bg: "bg-pink" },
];

// A texture suggesting "the community" rather than named people, so no
// initials here — just circles waiting for real member photos. Drop a
// `photo` path into any entry once one is ready and it swaps in automatically.
const PEOPLE_MARKS: { bg: string; fg: string; photo?: string }[] = [
  { bg: "bg-yellow", fg: "text-ink/40" },
  { bg: "bg-pink", fg: "text-ink/40" },
  { bg: "bg-ink", fg: "text-cream/50" },
];

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden py-16 md:py-24">
      <img
        src="/assets/illustration-nobg.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-[18%] top-0 w-[70%] max-w-none opacity-[0.06] md:-right-[8%] md:w-[46%]"
      />

      {/* Intro — the three questions this whole section answers. */}
      <div className="wrap mx-auto max-w-[680px] text-center">
        <p className="eyebrow text-rose">01 / Who. What. Why.</p>
        <h2 className="mt-6 text-[35px] leading-[1.12] tracking-[-0.03em] md:text-[52px]">
          Three simple questions.
          <br />
          <span className="pink-underline">One big reason to exist.</span>
        </h2>
        <p className="mt-6 text-[17px] leading-[1.7] text-muted">
          TeenovateX is easier to understand when you start with the people,
          follow what they create, and discover why any of it matters.
        </p>
      </div>

      {/* Who → What → Why: one connected story, not three identical cards. */}
      <div className="wrap mx-auto mt-16 max-w-[760px] md:mt-20">
        {/* 01 — Who. Alive and communal: a handwritten-style mark on
            "Teenovators" plus a scatter of member initials. */}
        <Chapter number="01">
          <Question>Who are we?</Question>
          <Answer>
            Young people who <em>refused to wait.</em>
          </Answer>
          <div className="mt-5 flex flex-col gap-4 text-[16px] leading-[1.75] text-muted md:flex-row md:items-start md:gap-10">
            <div className="flex-1">
              <p>
                We&rsquo;re a youth-led community of teenagers, builders,
                designers, researchers, storytellers&mdash;and the people who
                believe in them.
              </p>
              <p className="mt-4">
                We call our members <span className="pink-underline font-medium text-ink">Teenovators</span>.
                Not because they have everything figured out, but because
                they are curious enough to begin, brave enough to
                experiment, and generous enough to build with others.
              </p>
              <p className="mt-4 font-medium text-ink">
                We are not waiting to become &ldquo;the future.&rdquo; We are
                already here.
              </p>
            </div>
            <div className="flex shrink-0 -space-x-3 self-center md:mt-1 md:self-start" aria-hidden="true">
              {PEOPLE_MARKS.map((m, i) => (
                <span
                  key={i}
                  className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-ink ${m.bg} ${m.fg}`}
                >
                  {m.photo ? (
                    <Image src={m.photo} alt="" width={44} height={44} className="h-full w-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </div>
        </Chapter>

        <Connector variant="doodle" />

        {/* 02 — What. Active: the words that describe the work, scattered
            like sticky notes rather than laid out in a tidy list. */}
        <Chapter number="02">
          <Question>What do we do?</Question>
          <Answer>
            We turn curiosity into <em>something real.</em>
          </Answer>
          <div className="mt-5 text-[16px] leading-[1.75] text-muted">
            <p>
              We help teenagers explore technology, find their people, learn
              by doing, and build work they can proudly point to.
            </p>
            <p className="mt-4">
              That means hands-on Labs, meaningful projects, mentorship,
              research, opportunities, TeenCoffee, community conversations,
              and a digital home that keeps everything within reach.
            </p>
            <p className="mt-4">
              You can arrive with a huge idea, a strange question, a
              half-finished project&mdash;or absolutely no idea where to
              begin.
            </p>
            <p className="mt-4 font-medium text-ink">
              You bring the curiosity. We help you find the next step.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3" aria-hidden="true">
            {ACTION_WORDS.map(({ word, rotate, bg }) => (
              <span
                key={word}
                className={`inline-block rounded-md border border-ink px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide ${bg} ${rotate}`}
              >
                {word}
              </span>
            ))}
          </div>
        </Chapter>

        <Connector variant="path" />

        {/* 03 — Why. Quieter and more spacious: the point of everything
            above, given room to land. */}
        <Chapter number="03">
          <Question>Why do we exist?</Question>
          <Answer>
            Because potential should <em>not need permission.</em>
          </Answer>
          <div className="mt-5 max-w-[600px] text-[16px] leading-[1.75] text-muted">
            <p>
              Talent is everywhere. Access, confidence, guidance, and the
              right room are not.
            </p>
            <p className="mt-4">
              Too many teenagers are told to wait: wait until university,
              wait until they are older, wait until they know enough, wait
              until somebody finally chooses them.
            </p>
            <p className="mt-4">
              TeenovateX exists to shorten that distance&mdash;from:
            </p>
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
            <p className="text-lg text-muted">&ldquo;I wonder if I can&hellip;&rdquo;</p>
            <span className="text-2xl text-rose" aria-hidden="true">→</span>
            <p className="font-serif text-[28px] italic leading-tight text-rose md:text-[34px]">
              &ldquo;Look what we built.&rdquo;
            </p>
          </div>

          <p className="mt-10 max-w-[600px] text-[16px] leading-[1.8] text-muted">
            Because one opportunity can change a direction. One community
            can make somebody feel less alone. And one teenager who
            discovers what they are capable of can change far more than
            their own future.
          </p>
        </Chapter>
      </div>
    </section>
  );
}

function Chapter({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="relative pl-9 md:pl-12">
      <span
        className="absolute left-0 top-0 font-serif text-[13px] italic text-muted/70"
        aria-hidden="true"
      >
        {number}
      </span>
      {children}
    </div>
  );
}

function Question({ children }: { children: ReactNode }) {
  return <p className="eyebrow text-rose">{children}</p>;
}

function Answer({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-3 text-[26px] leading-[1.15] tracking-[-0.02em] text-ink md:text-[36px] [&_em]:font-serif [&_em]:font-normal [&_em]:not-italic md:[&_em]:italic">
      {children}
    </h3>
  );
}

/** The pink thread running through the section — loose and hand-drawn
 * between Who and What, then a single purposeful line into Why. */
function Connector({ variant }: { variant: "doodle" | "path" }) {
  return (
    <div className="flex h-16 items-center pl-9 md:h-20 md:pl-12" aria-hidden="true">
      {variant === "doodle" ? (
        <svg width="28" height="56" viewBox="0 0 28 56" fill="none">
          <path
            d="M14 2c-7 4-9 9-4 13s11 3 6 9-13 5-9 13 12 4 7 11"
            stroke="var(--pink)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 7"
          />
        </svg>
      ) : (
        <svg width="28" height="56" viewBox="0 0 28 56" fill="none">
          <path d="M14 0v44" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="14" cy="51" r="4.5" fill="var(--pink)" />
        </svg>
      )}
    </div>
  );
}
