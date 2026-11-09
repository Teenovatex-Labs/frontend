import { appUrl } from "@/lib/hosts";
import Link from "next/link";
import Reveal from "./Reveal";

export default function Join() {
  return (
    <section id="join" className="relative py-14 md:py-[75px]">
      <div className="wrap relative grid gap-9 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-[100px]">
        <Reveal from="left"><p className="eyebrow text-rose">Ready when you are</p>
          <h2 className="mt-6 text-[44px] leading-[1.05] md:text-[70px]">
            See you
            <br />
            <span className="-ml-3 inline-block -rotate-2 bg-pink px-3 pb-2 pt-0.5">
              on the inside.
            </span>
          </h2></Reveal><Reveal from="right" delay={0.12}><p className="max-w-[380px] text-lg">
            Your first step is simple: create your free account. It only
            takes a minute.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={appUrl("/auth?mode=signup")} className="btn">
              Become a Teenovator <span>↗︎</span>
            </Link>
            <Link href={appUrl("/auth?mode=login")} className="btn-secondary on-yellow">
              Log in
            </Link>
          </div></Reveal></div></section>
  );
}
