import Image from "next/image";

const STEPS = [
  {
    title: "Introduce yourself.",
    description:
      "Tell the group where you're joining from and which part of tech interests you.",
  },
  {
    title: "Bring something to the conversation.",
    description:
      "A question, a useful resource or a project you'd like another pair of eyes on.",
  },
  {
    title: "See who you connect with.",
    description:
      "Reply to someone whose interests overlap with yours. That's a good place to start.",
  },
];

export default function FirstDay() {
  return (
    <section className="wrap grid gap-10 py-16 md:grid-cols-2 md:gap-[90px] md:py-24">
      <div className="mx-auto w-[90%] max-w-[500px] -rotate-1 overflow-hidden rounded-[50%_50%_7px_7px] border border-ink bg-[#f5d0df] p-[18px] md:mx-0 md:w-full">
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

      <div>
        <p className="eyebrow text-rose">Your first day</p>
        <h2 className="mb-6 mt-6 text-[37px] leading-tight md:text-[45px]">
          Joined?
          <br />
          <span className="highlight">Say a little hello.</span>
        </h2>

        <ol className="first-steps">
          {STEPS.map((step) => (
            <li key={step.title} className="grid grid-cols-[30px_1fr] gap-3 border-t border-line py-[18px] text-[15px] text-muted">
              <div>
                <strong className="mb-1.5 block font-semibold text-ink">{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
