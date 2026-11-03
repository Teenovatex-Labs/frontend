import CrowdCanvas from "@/components/about/CrowdCanvas";
import { DropIn, Reveal } from "./Motion";

const PILLARS = [
  {
    title: "Find your people.",
    text: "TeenovateX brings together teenagers who care about technology, research, design, stories, and the questions nobody around them seems to be asking yet.",
    color: "bg-pink",
    doodle: "/doodles/notes.png",
  },
  {
    title: "Turn curiosity into work.",
    text: "Bring the idea in your notes app, the code that will not run, or the project you have not started. You will find practical support to take the next honest step.",
    color: "bg-yellow",
    doodle: "/doodles/laptop.png",
  },
  {
    title: "Build before you feel ready.",
    text: "You do not need perfect skills or a polished plan. Start where you are, learn in public, and leave with something real that shows what you can do.",
    color: "bg-cream",
    doodle: "/doodles/robot.png",
  },
];

export default function About() {
  return (
    <section id="about" className="relative overflow-hidden py-20 md:py-32">
      <img
        src="/assets/illustration-nobg.svg"
        alt=""
        aria-hidden="true"
        className="doodle-float-delayed pointer-events-none absolute -right-[12%] top-[3%] w-[48%] max-w-none opacity-[0.07]"
      />
      <CrowdCanvas
        src="/assets/crowd-sprite.png"
        className="pointer-events-none absolute bottom-0 left-1/2 h-[340px] w-full max-w-[1040px] -translate-x-1/2 opacity-[0.12] [filter:invert(1)] [mask-image:linear-gradient(to_top,black_10%,transparent_90%)]"
      />

      <div className="wrap relative">
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.7fr] lg:gap-24">
          <DropIn>
            <h2 className="max-w-[800px] text-[42px] leading-[1.05] md:text-[68px]">
              This is where teenage ideas become real work.
            </h2>
          </DropIn>
          <Reveal delay={0.12} direction="left">
            <p className="max-w-[510px] text-[19px] leading-[1.7] text-muted">
              TeenovateX is a place to meet capable people, try ambitious things, and keep moving when a project gets difficult.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-6 lg:mt-20 lg:gap-9">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.12} direction={index === 1 ? "down" : "up"}>
              <article className={`depth-card relative min-h-[390px] overflow-hidden rounded-[18px] border-2 border-ink p-7 md:p-8 ${pillar.color}`}>
                <img
                  src={pillar.doodle}
                  alt=""
                  aria-hidden="true"
                  className={`blend-multiply pointer-events-none mb-12 h-24 w-28 object-contain ${index === 1 ? "doodle-float-delayed" : "doodle-float"}`}
                />
                <h3 className="text-[27px] leading-[1.12] md:text-[31px]">{pillar.title}</h3>
                <p className="mt-5 text-[17px] leading-[1.65] text-muted">{pillar.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-20 max-w-[820px] text-center text-[24px] leading-[1.55] md:text-[31px]">
            You bring the question. We help you find the people, practice, and confidence to build the answer.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
