import { appUrl } from "@/lib/hosts";
import Link from "next/link";
import { DropIn, Reveal } from "./Motion";

export default function Join() {
  return (
    <section id="join" className="relative overflow-hidden border-y border-ink bg-yellow py-14 md:py-[75px]">
      <img
        src="/assets/logo-long6.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.07] md:w-[130%]"
      />
      <div className="wrap relative grid gap-9 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-[100px]">
        <div>
          <DropIn>
            <h2 className="text-[44px] leading-[1.05] md:text-[70px]">
              Your next project starts inside TeenovateX.
            </h2>
          </DropIn>
        </div>

        <Reveal direction="left">
        <div>
          <p className="max-w-[430px] text-xl leading-relaxed">
            Create a free account, meet the community, and bring whatever idea has been waiting for your attention.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={appUrl("/auth?mode=signup")} className="btn">
              Become a Teenovator <span>↗︎</span>
            </Link>
            <Link href={appUrl("/auth?mode=login")} className="btn-secondary on-yellow">
              Log in
            </Link>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
