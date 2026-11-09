import { appUrl } from "@/lib/hosts";
import Link from "next/link";
import TrueFocus from "./TrueFocus";
import Reveal from "./Reveal";

export default function Hero() {
  return (
    <section className="w-full">
      <div className="hero-canvas">
        <Reveal from="right" distance={160} duration={1.3} delay={0.2} className="pointer-events-none absolute -bottom-10 -right-10 hidden w-[300px] md:block lg:w-[360px] xl:w-[540px]">
          <img src="/assets/logo-long.svg" alt="" aria-hidden="true" className="w-full -scale-x-100" />
        </Reveal>

        {/* Doodles live in the open gap between the text column and the mascot
            illustration, and the clear strip above it — never behind text or
            behind the big illustration. */}
        <Reveal from="down" delay={0.5} className="pointer-events-none absolute right-[6%] top-[8%] hidden w-[130px] lg:block xl:w-[150px]">
          <img src="/doodles/laptop.png" alt="" aria-hidden="true" className="w-full rotate-2" />
        </Reveal>
        <Reveal from="down" delay={0.35} className="pointer-events-none absolute right-[30%] top-[10%] hidden w-[110px] lg:block xl:w-[130px]">
          <img src="/doodles/robot.png" alt="" aria-hidden="true" className="w-full -rotate-3" />
        </Reveal>
        <Reveal from="left" delay={0.6} className="pointer-events-none absolute right-[44%] top-[32%] hidden w-[100px] lg:block xl:w-[115px]">
          <img src="/doodles/circuit.png" alt="" aria-hidden="true" className="w-full rotate-2" />
        </Reveal>
        <Reveal from="left" delay={0.7} className="pointer-events-none absolute right-[42%] top-[50%] hidden w-[125px] lg:block xl:w-[145px]">
          <img src="/doodles/notes.png" alt="" aria-hidden="true" className="w-full -rotate-2" />
        </Reveal>
        <div className="wrap relative z-10">
          <Reveal from="left" distance={120} className="max-w-[620px]">
            <h1 className="text-left text-[40px] leading-[1.13] tracking-[-0.05em] md:text-[72px]">
              <TrueFocus
                phrases={[
                  { text: "Build" },
                  { text: "The Technology" },
                  { text: "You wish Existed", className: "whitespace-nowrap font-serif italic font-medium text-rose" },
                ]}
              />
            </h1>

            <p className="mt-7 max-w-[485px] text-left text-[15px] leading-[1.85] text-muted md:text-[17px]">
              A youth-led home for teenagers turning curiosity into code,
              research, technology, stories, and things the world hasn&rsquo;t
              seen yet.
            </p>
          </Reveal>

          <Reveal from="up" delay={0.25} className="mx-auto mt-8 flex max-w-[820px] flex-col items-center justify-center gap-2.5 text-center md:flex-row md:gap-7">
            <Link href={appUrl("/auth?mode=signup")} className="btn">
              Become a Teenovator <span>↗︎</span>
            </Link>
            <a href="#explore" className="btn-secondary">
              See what happens here <span>↓</span>
            </a>
          </Reveal>

          <p className="mx-auto mt-5 max-w-[270px] text-center text-[10px] text-muted md:max-w-none">
            Your questions. Your experiments. Your next step.
          </p>
        </div>
      </div>
    </section>
  );
}
