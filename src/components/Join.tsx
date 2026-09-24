import Link from "next/link";

export default function Join() {
  return (
    <section id="join" className="border-y border-ink bg-yellow py-14 md:py-[75px]">
      <div className="wrap grid gap-9 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-[100px]">
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
            Create your free account <span>↗︎</span>
          </Link>

          <small className="mt-3.5 block text-xs text-muted">
            Already a member?{" "}
            <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
              Log in
            </Link>
          </small>
        </div>
      </div>
    </section>
  );
}
