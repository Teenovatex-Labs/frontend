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
              in the group.
            </span>
          </h2>
        </div>

        <div>
          <p className="max-w-[380px] text-lg">
            Your first step is simple: join the TeenovateX WhatsApp group.
            It&rsquo;s free for teens.
          </p>

          <a
            href="https://chat.whatsapp.com/HYphvnsGa4PAnoPxReTpHW"
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-6"
          >
            Join us on WhatsApp <span>↗︎</span>
          </a>

          <small className="mt-3.5 block text-xs text-muted">
            Opens the TeenovateX WhatsApp group.
          </small>
        </div>
      </div>
    </section>
  );
}
