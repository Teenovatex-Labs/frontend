import Image from "next/image";
import { DropIn, Reveal } from "./Motion";

const STEPS = [
  {
    title: "Tell people who you are.",
    description:
      "Share where you are joining from and the part of technology you cannot stop thinking about.",
  },
  {
    title: "Bring one real thing.",
    description:
      "It can be a question, a useful link, or a project that needs another pair of eyes.",
  },
  {
    title: "Follow the conversation.",
    description:
      "Reply to someone whose interests overlap with yours and take it from there.",
  },
];

export default function FirstDay() {
  return (
    <section className="wrap grid gap-10 py-16 md:grid-cols-2 md:gap-[90px] md:py-24">
      <Reveal direction="right" className="mx-auto w-[90%] max-w-[500px] md:mx-0 md:w-full">
      <div className="depth-card -rotate-1 overflow-hidden rounded-[48%_48%_18px_18px] border-2 border-ink bg-[#f5d0df] p-[18px]">
        <Image
          src="/community.webp"
          alt="Hands sharing ideas, notes and a laptop around a table"
          width={1400}
          height={933}
          className="blend-multiply aspect-[1.2] w-full object-cover"
        />
        <p className="mt-3.5 border-t border-ink pt-3.5 text-center text-xs">
          A conversation is a good first step.
        </p>
      </div>
      </Reveal>

      <div>
        <DropIn>
          <h2 className="mb-8 text-[39px] leading-tight md:text-[52px]">
            Start with one honest hello.
          </h2>
        </DropIn>

        <ol className="first-steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-line py-[18px] text-[17px] text-muted">
              <Reveal delay={index * 0.1}>
                <strong className="mb-1.5 block font-semibold text-ink">{step.title}</strong>
                <p>{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
