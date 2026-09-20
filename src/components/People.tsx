const FOUNDERS = [
  {
    initials: "AM",
    name: "Anas Abubakar Masama",
    role: "Founder",
    href: "https://www.linkedin.com/in/anasmasama",
    bg: "bg-yellow",
  },
  {
    initials: "SS",
    name: "Sanni Shazily",
    role: "Co-founder",
    href: "https://www.linkedin.com/in/sanni-shazily-bba942266",
    bg: "bg-pink",
  },
  {
    initials: "YL",
    name: "Yasin Lasisi",
    role: "Co-founder",
    href: "https://www.linkedin.com/in/yasin-lasisi-98626a289/",
    bg: "bg-cream",
  },
];

export default function People() {
  return (
    <section id="people" className="wrap py-16 md:py-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-rose">03 / The people behind it</p>
          <h2 className="mt-6 max-w-2xl text-4xl md:text-5xl">
            The people
            <br />
            behind the plans.
          </h2>
        </div>
        <p className="text-muted md:text-right">Connect with the founders on LinkedIn.</p>
      </div>

      <div className="mt-8 grid border-y border-line md:grid-cols-3">
        {FOUNDERS.map((founder, i) => (
          <a
            key={founder.name}
            href={founder.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center gap-4 border-line py-6 md:py-[30px] md:px-5 ${
              i > 0 ? "border-t md:border-t-0 md:border-l" : ""
            } ${i === 0 ? "md:pl-0" : ""}`}
          >
            <span
              className={`avatar-arch flex h-[60px] min-w-[52px] items-center justify-center border border-ink text-[17px] font-medium ${founder.bg}`}
            >
              {founder.initials}
            </span>
            <div className="min-w-0">
              <h3 className="text-base tracking-tight group-hover:underline group-hover:underline-offset-4">
                {founder.name}
              </h3>
              <p className="mt-1 text-[13px] text-muted">{founder.role}</p>
            </div>
            <span aria-label="LinkedIn profile" className="ml-auto shrink-0">
              ↗︎
            </span>
          </a>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-start gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <p>Want to help shape the community?</p>
        <a
          href="https://teenovatex.fillout.com/cftm"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-4 border-b border-ink pb-1 font-bold hover:text-rose"
        >
          Apply to the core team <span>↗︎</span>
        </a>
      </div>
    </section>
  );
}
