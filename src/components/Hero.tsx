const STATS = [
  { value: "1,000", suffix: "+", label: "Active members" },
  { value: "50", suffix: "+", label: "Countries" },
  { value: "100", suffix: "%", label: "Free for teens" },
];

export default function Hero() {
  return (
    <section className="w-full">
      <div className="hero-canvas">
        <div className="mx-auto max-w-[820px] text-center">
          <p className="eyebrow mx-auto mb-8 max-w-[440px] text-[11px] font-medium normal-case tracking-[0.11em]">
            TeenovateX Labs · A community for young makers
          </p>

          <h1 className="text-[52px] leading-[1.13] tracking-[-0.05em] md:text-[91px]">
            What if you
            <br />
            actually{" "}
            <span className="whitespace-nowrap font-serif italic font-medium text-rose">
              built it?
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[485px] text-[15px] leading-[1.85] text-muted md:text-[17px]">
            A global, youth-led tech community for teenagers exploring
            coding, robotics, AI and more.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 md:flex-row md:gap-7">
            <a
              href="https://chat.whatsapp.com/HYphvnsGa4PAnoPxReTpHW"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Join the community <span>↗︎</span>
            </a>
            <a
              href="#explore"
              className="inline-flex items-center gap-3 border-0 py-3 text-[13px] hover:underline hover:underline-offset-4"
            >
              Explore the features <span>↓</span>
            </a>
          </div>

          <p className="mx-auto mt-5 max-w-[270px] text-[10px] text-muted md:max-w-none">
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
