const STATS = [
  { value: "1000+", label: "members" },
  { value: "50+", label: "countries" },
  { value: "100%", label: "free" },
];

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat py-28 md:py-36"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(255,249,235,0.4) 0%, rgba(255,249,235,0.9) 100%), radial-gradient(circle at 50% 0%, var(--yellow) 0%, var(--cream) 60%)",
      }}
    >
      <div className="wrap flex flex-col items-center text-center">
        <p className="eyebrow mb-6 text-rose">A youth-led tech community</p>

        <h1 className="max-w-4xl text-5xl tracking-tight md:text-7xl">
          What if you actually{" "}
          <span className="font-serif italic text-rose">built it?</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted">
          Teenagers building software, AI, and hardware together — with the
          people, tools, and community to actually ship it.
        </p>

        <a
          href="#join"
          className="mt-10 rounded-full bg-rose px-8 py-4 text-sm font-semibold text-cream transition-transform hover:scale-105"
        >
          Join the community
        </a>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-semibold tracking-tight md:text-4xl">
                {stat.value}
              </div>
              <div className="eyebrow mt-1 text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
