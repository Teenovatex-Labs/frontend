const STEPS = [
  {
    number: "01",
    title: "Say hi",
    description: "Introduce yourself in the community and tell us what you're into.",
  },
  {
    number: "02",
    title: "Pick a room",
    description: "Join the channels for what you're building or want to learn.",
  },
  {
    number: "03",
    title: "Start building",
    description: "Post your first project, no matter how small. That's the whole point.",
  },
];

export default function FirstDay() {
  return (
    <section className="wrap grid gap-16 py-24 md:grid-cols-2 md:items-center md:py-32">
      <div>
        <h2 className="text-4xl md:text-5xl">
          Your <span className="pink-underline">first day</span>
        </h2>

        <ol className="mt-10 flex flex-col gap-8">
          {STEPS.map((step) => (
            <li key={step.number} className="flex gap-5">
              <span className="eyebrow text-rose">{step.number}</span>
              <div>
                <h3 className="text-xl">{step.title}</h3>
                <p className="mt-1 text-muted">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="aspect-[4/3] w-full rounded-3xl bg-[linear-gradient(135deg,var(--yellow),var(--pink))]" />
    </section>
  );
}
