import Link from "next/link";

const STATS = [
  { value: "1,000", suffix: "+", label: "Active members" },
  { value: "Global", suffix: "", label: "Reach" },
  { value: "100", suffix: "%", label: "Free for teens" },
];

export default function Hero() {
  return (
    <section className="w-full">
      <div className="hero-canvas">
        <img
          src="/assets/logo-long.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -right-10 hidden w-[300px] -scale-x-100 md:block lg:w-[360px] xl:w-[540px]"
        />

        {/* Doodles live in the open gap between the text column and the mascot
            illustration, and the clear strip above it — never behind text or
            behind the big illustration. */}
        <img
          src="/doodles/laptop.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[6%] top-[8%] hidden w-[130px] rotate-2 lg:block xl:w-[150px]"
        />
        <img
          src="/doodles/robot.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[30%] top-[10%] hidden w-[110px] -rotate-3 lg:block xl:w-[130px]"
        />
        <img
          src="/doodles/circuit.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[44%] top-[32%] hidden w-[100px] rotate-2 lg:block xl:w-[115px]"
        />
        <img
          src="/doodles/notes.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[42%] top-[60%] hidden w-[125px] -rotate-2 lg:block xl:w-[145px]"
        />
        <div className="wrap">
          <div className="max-w-[560px]">
            <h1 className="text-left text-[52px] leading-[1.13] tracking-[-0.05em] md:text-[91px]">
              What if you
              <br />
              actually{" "}
              <span className="whitespace-nowrap font-serif italic font-medium text-rose">
                built it?
              </span>
            </h1>

            <p className="mt-7 max-w-[485px] text-left text-[15px] leading-[1.85] text-muted md:text-[17px]">
              A youth-led home for teenagers turning curiosity into code,
              research, technology, stories, and things the world hasn&rsquo;t
              seen yet.
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-[820px] flex-col items-center justify-center gap-2.5 text-center md:flex-row md:gap-7">
            <Link href="/auth?mode=signup" className="btn">
              Become a Teenovator <span>↗︎</span>
            </Link>
            <a
              href="#explore"
              className="inline-flex items-center gap-3 border-0 py-3 text-[13px] hover:underline hover:underline-offset-4"
            >
              See what happens here <span>↓</span>
            </a>
          </div>

          <p className="mx-auto mt-5 max-w-[270px] text-center text-[10px] text-muted md:max-w-none">
            Your questions. Your experiments. Your next step.
          </p>
        </div>
      </div>

      <div className="wrap">
        <div className="grid grid-cols-3 gap-0 border-t border-line py-6 text-center md:py-9">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-2 ${i > 0 ? "border-l border-line" : ""}`}
            >
              <strong className="text-[27px] tracking-[-0.03em] md:text-[42px]">
                {stat.value}
                <span className="text-rose">{stat.suffix}</span>
              </strong>
              <span className="mt-2 block text-[10px] text-muted md:text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
