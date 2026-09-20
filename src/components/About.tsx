export default function About() {
  return (
    <section id="about" className="wrap grid gap-10 py-24 md:grid-cols-2 md:gap-16 md:py-32">
      <div>
        <p className="eyebrow text-rose">01 / Why we exist</p>
        <h2 className="mt-4 text-4xl md:text-5xl">
          Talent is{" "}
          <span className="highlight">everywhere</span>. Access should be
          too.
        </h2>
      </div>

      <div className="flex flex-col gap-6 text-lg text-muted">
        <p>
          Most teenagers with the drive to build something never get the
          room to try — no mentors, no peers who get it, no place to ship a
          first project without judgment.
        </p>
        <p>
          TeenovateX Labs is a free, youth-led community where teenagers
          learn by building alongside each other — in software, AI, robotics,
          and whatever they're curious about next.
        </p>
      </div>
    </section>
  );
}
