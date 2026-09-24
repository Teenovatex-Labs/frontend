export default function About() {
  return (
    <section id="about" className="wrap grid gap-8 py-16 md:grid-cols-2 md:gap-[70px] md:py-24">
      <div className="relative">
        <img
          src="/assets/illustration2-nobg.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 -top-14 -z-10 w-[260px] opacity-90 md:-top-20 md:w-[340px]"
        />
        <p className="eyebrow relative text-rose">01 / Why we exist</p>
        <h2 className="relative mt-6 text-[39px] leading-[1.12] tracking-[-0.03em] md:text-[54px]">
          Talent is everywhere.
          <br />
          <span className="pink-underline">Access should be too.</span>
        </h2>
      </div>

      <div className="flex flex-col gap-[22px] pt-0 md:pt-[70px]">
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
