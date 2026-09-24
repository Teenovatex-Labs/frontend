import Link from "next/link";

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
          <p className="eyebrow text-rose">Ready when you are</p>
          <h2 className="mt-6 text-[44px] leading-[1.05] md:text-[70px]">
            See you
            <br />
            <span className="-ml-3 inline-block -rotate-2 bg-pink px-3 pb-2 pt-0.5">
              on the inside.
            </span>
          </h2>
        </div>

        <div>
          <p className="max-w-[380px] text-lg">
            Your first step is simple: create your free account. It only
            takes a minute.
          </p>

          <Link href="/signup" className="btn mt-6">
            Become a Teenovator <span>↗︎</span>
          </Link>

          <small className="mt-3.5 block text-xs text-muted">
            Already a Teenovator?{" "}
            <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
              Log in
            </Link>
          </small>
        </div>
      </div>
    </section>
  );
}
