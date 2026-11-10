import Image from "next/image";
import type { ReactNode } from "react";
import CrowdCanvas from "@/components/about/CrowdCanvas";
import PinnedSlider from "@/components/PinnedSlider";

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
    <section id="about" className="relative">
      <PinnedSlider
        label="Who we are, what we do and why we exist. Scroll horizontally."
        background={
          <>
            <img
              src="/assets/illustration-nobg.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-[18%] top-0 w-[70%] max-w-none opacity-[0.06] md:-right-[8%] md:w-[46%]"
            />
            {/* A crowd of tiny figures walking along the bottom edge: a literal "community" texture. */}
            <CrowdCanvas
              src="/assets/crowd-sprite.png"
              className="pointer-events-none absolute bottom-0 left-1/2 h-[260px] w-full max-w-[820px] -translate-x-1/2 opacity-[0.14] [filter:invert(1)] [mask-image:linear-gradient(to_top,black_15%,transparent_88%)] md:h-[340px] md:max-w-[960px]"
            />
          </>
        }
        header={
          <>
            <p className="eyebrow text-rose">01 / Who. What. Why.</p>
            <h2 className="mt-5 text-[35px] leading-[1.12] tracking-[-0.03em] md:text-[42px]">
              Three simple questions.
              <br />
              <span className="pink-underline">One big reason to exist.</span>
            </h2>
          </>
        }
        blurb={
          <p className="text-[16px] leading-[1.65] text-muted">
            TeenovateX is easier to understand when you start with the people,
            follow what they create, and discover why any of it matters.
          </p>
        }
      >
        <Chapter tone="bg-yellow/40">
          <Question>Who are we?</Question>
          <Answer>
            Young people who <em>refused to wait.</em>
          </Answer>
          <div className="mt-5 flex flex-col gap-4 text-[16px] leading-[1.75] text-muted">
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
            <div className="flex shrink-0 -space-x-3 self-start" aria-hidden="true">
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

        <Chapter tone="bg-pink/30">
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
              That means hands-on Labs, meaningful projects, research,
              opportunities, TeenCoffee, community conversations,
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

        <Chapter tone="bg-white">
          <Question>Why do we exist?</Question>
          <Answer>
            Because potential should <em>not need permission.</em>
          </Answer>
          <div className="mt-5 text-[16px] leading-[1.75] text-muted">
            <p>
              Talent is everywhere. Access, confidence, guidance, and the
              right room are not.
            </p>
            <p className="mt-4">
              Too many teenagers are told to wait: wait until university,
              wait until they are older, wait until they know enough, wait
              until somebody finally chooses them.
            </p>
            <p className="mt-4 font-medium text-ink">You do not need a portfolio, expensive equipment, or a head start to belong here.</p>
            <p className="mt-4">
              TeenovateX exists to shorten that distance&mdash;from:
            </p>
          </div>

          <div className="mt-8 flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-5">
            <p className="text-lg text-muted">&ldquo;I wonder if I can&hellip;&rdquo;</p>
            <span className="text-2xl text-rose" aria-hidden="true"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></span>
            <p className="font-serif text-[28px] italic leading-tight text-rose md:text-[34px]">
              &ldquo;Look what we built.&rdquo;
            </p>
          </div>

          <p className="mt-8 text-[16px] leading-[1.8] text-muted">
            Because one opportunity can change a direction. One community
            can make somebody feel less alone. And one teenager who
            discovers what they are capable of can change far more than
            their own future.
          </p>
        </Chapter>
      </PinnedSlider>
    </section>
  );
}

/** One slide: a full card with the whole answer readable at once. */
function Chapter({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <article className={`flex w-[88vw] max-w-[640px] shrink-0 flex-col rounded-md border border-ink p-6 md:p-7 ${tone}`}>
      {children}
    </article>
  );
}

function Question({ children }: { children: ReactNode }) {
  return <p className="eyebrow text-rose">{children}</p>;
}

function Answer({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-3 text-[26px] leading-[1.15] tracking-[-0.02em] text-ink md:text-[32px] [&_em]:font-serif [&_em]:font-normal [&_em]:not-italic md:[&_em]:italic">
      {children}
    </h3>
  );
}
