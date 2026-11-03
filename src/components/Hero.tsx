import { appUrl } from "@/lib/hosts";
import Link from "next/link";
import { CountUp, DropIn, GhostFlight, Reveal } from "./Motion";

const STATS = [
  { value: 1000, suffix: "+", label: "members and growing" },
  { value: 100, suffix: "%", label: "free for teenagers" },
];

export default function Hero() {
  return (
    <section className="w-full overflow-hidden">
      <div className="hero-canvas !block px-0 py-10 md:py-12 lg:py-10">
        <div className="wrap grid min-h-[560px] items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] lg:gap-4">
          <div className="relative z-10 pt-4 lg:pt-0">
            <DropIn>
              <p className="display-clean mb-5 text-[11px] text-rose md:text-sm">
                A global community where teenagers build together.
              </p>
            </DropIn>

            <Reveal delay={0.08}>
              <h1 className="max-w-[760px] text-left text-[48px] leading-[1.03] md:text-[72px] lg:text-[78px] xl:text-[92px]">
                Build the technology you wish existed.
              </h1>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="mt-7 max-w-[610px] text-left text-[18px] leading-[1.65] text-muted md:text-[21px]">
                Meet teenagers who take ideas seriously, learn by making, and help each other turn rough experiments into work they are proud to share.
              </p>
            </Reveal>

            <Reveal delay={0.28}>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href={appUrl("/auth?mode=signup")} className="btn">
                  Join TeenovateX <span aria-hidden="true">↗</span>
                </Link>
                <a href="#explore" className="btn-secondary">
                  Explore the community <span aria-hidden="true">↓</span>
                </a>
              </div>
            </Reveal>
          </div>

          <div className="relative mx-auto aspect-[1.35] w-full max-w-[780px] overflow-hidden lg:mx-0 lg:self-start lg:justify-self-center">
            <img src="/doodles/robot.png" alt="" aria-hidden="true" className="doodle-float blend-multiply pointer-events-none absolute left-[1%] top-[1%] z-20 w-[13%]" />
            <img src="/doodles/laptop.png" alt="" aria-hidden="true" className="doodle-float-delayed blend-multiply pointer-events-none absolute right-[1%] top-[1%] z-20 w-[15%]" />
            <img src="/doodles/circuit.png" alt="" aria-hidden="true" className="doodle-float-delayed blend-multiply pointer-events-none absolute bottom-[1%] left-[1%] z-20 w-[12%]" />
            <div className="absolute inset-y-[5%] left-0 right-0 flex -translate-y-8 items-center justify-center lg:-translate-y-16">
              <GhostFlight className="w-[34%] max-w-[265px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="wrap">
        <Reveal>
          <div className="grid grid-cols-2 border-y border-line py-7 text-center md:py-9">
            {STATS.map((stat, index) => (
              <div key={stat.label} className={`px-4 ${index ? "border-l border-line" : ""}`}>
                <CountUp value={stat.value} suffix={stat.suffix} className="block text-[34px] font-semibold tabular-nums md:text-[50px]" />
                <span className="mt-2 block text-[14px] text-muted md:text-base">{stat.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
