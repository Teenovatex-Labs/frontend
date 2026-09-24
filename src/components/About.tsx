export default function About() {
  return (
    <section
      id="about"
      className="wrap grid gap-8 pb-16 pt-16 md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-[70px] md:gap-y-10 md:pb-0 md:pt-24"
    >
      <div className="md:col-start-1 md:row-start-1">
        <p className="eyebrow text-rose">01 / Why we exist</p>
        <h2 className="mt-6 text-[39px] leading-[1.12] tracking-[-0.03em] md:text-[54px]">
          Talent is everywhere.
          <br />
          <span className="pink-underline">Access should be too.</span>
        </h2>
      </div>

      {/* Sits flush on the section's bottom edge on desktop so the arches
          read as rising out of the next section. */}
      <img
        src="/assets/illustration2-nobg.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none block w-full max-w-[520px] md:col-start-1 md:row-start-2 md:self-end"
      />

      {/* pb-24 mirrors the section's top padding, so self-center lands the
          text on the section's true vertical middle. */}
      <div className="flex flex-col gap-[22px] md:col-start-2 md:row-span-2 md:row-start-1 md:self-center md:pb-24">
        <p className="text-[22px] leading-[1.5] tracking-[-0.01em] md:text-[23px]">
          Age shouldn&rsquo;t decide who gets to work on meaningful technology.
        </p>
        <p className="text-muted">
          TeenovateX Labs exists to make tech education and mentorship more
          accessible to teenagers. We&rsquo;re building a space where young
          people can develop their skills and take on projects with support.
        </p>
        <p className="text-muted">
          Our focus spans software, creative technology and youth-led
          research, with a community that reaches beyond any one classroom or
          country.
        </p>
      </div>
    </section>
  );
}
