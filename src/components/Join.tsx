import { appUrl } from "@/lib/hosts";
import Link from "next/link";
import Reveal from "./Reveal";

export default function Join() {
  return (
    <section id="join" className="relative py-8 md:py-[75px]">
      <div className="wrap relative grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-[100px]">
        <Reveal from="left">
          <p className="eyebrow text-rose">Ready when you are</p>
          <h2 className="mt-3 text-3xl leading-[1.1] sm:text-4xl md:mt-6 md:text-[70px] md:leading-[1.05]">
            See you
            <br />
            <span className="-ml-2 inline-block -rotate-2 bg-pink px-2.5 py-1 text-2xl sm:text-3xl md:-ml-3 md:px-3 md:pb-2 md:pt-0.5 md:text-[70px]">
              on the inside.
            </span>
          </h2>
        </Reveal>
        <Reveal from="right" delay={0.12}>
          <p className="max-w-[380px] text-base leading-relaxed md:text-lg">
            Your curiosity has somewhere to go. Start an application when
            the window is open. We&rsquo;d like to meet the person behind the idea.
          </p>
          <p className="mt-2 max-w-[380px] text-xs text-ink/70 sm:text-sm md:mt-3">
            Alfred helps us get to know you. People make every admissions decision.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/apply" className="btn btn-sm sm:btn-base">
              Apply to join <span>↗︎</span>
            </Link>
            <Link href={appUrl("/auth?mode=login")} className="btn-secondary btn-sm sm:btn-base on-yellow">
              Log in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
