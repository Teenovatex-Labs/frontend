const FOUNDERS = [
  { name: "Anas", role: "Co-founder" },
  { name: "Sanni", role: "Co-founder" },
  { name: "Yasin", role: "Co-founder" },
];

export default function People() {
  return (
    <section id="people" className="wrap py-24 md:py-32">
      <p className="eyebrow text-rose">03 / The people behind it</p>
      <h2 className="mt-4 max-w-2xl text-4xl md:text-5xl">
        Built by teenagers, for teenagers.
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {FOUNDERS.map((founder) => (
          <div key={founder.name} className="flex flex-col gap-4">
            <div className="aspect-square w-full rounded-3xl bg-[linear-gradient(135deg,var(--yellow),var(--pink))]" />
            <div>
              <h3 className="text-xl">{founder.name}</h3>
              <p className="text-muted">{founder.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
