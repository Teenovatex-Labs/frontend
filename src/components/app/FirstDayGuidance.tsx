import Image from "next/image";

const STEPS = [
  {
    title: "Introduce yourself.",
    description: "Tell the group where you're joining from and which part of tech interests you.",
  },
  {
    title: "Bring something to the conversation.",
    description: "A question, a useful resource or a project you'd like another pair of eyes on.",
  },
  {
    title: "See who you connect with.",
    description: "Reply to someone whose interests overlap with yours. That's a good place to start.",
  },
];

export default function FirstDayGuidance() {
  return (
    <section aria-labelledby="first-day-title" className="mt-3 rounded-[18px] border border-ink bg-pink/20 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-full shrink-0 overflow-hidden rounded-[45%_45%_8px_8px] border border-ink bg-[#f5d0df] p-2 sm:w-[138px]">
          <Image
            src="/community.webp"
            alt="Hands sharing ideas, notes and a laptop around a table"
            width={1400}
            height={933}
            className="aspect-[1.6] w-full object-cover sm:aspect-square"
          />
        </div>
        <div>
          <p className="eyebrow text-rose">Your first day</p>
          <h3 id="first-day-title" className="mt-1 text-[23px] leading-tight">
            Joined? <span className="font-serif font-normal italic">Say a little hello.</span>
          </h3>
          <p className="mt-1 text-sm text-muted">A conversation is a good first step.</p>
        </div>
      </div>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[22px_1fr] gap-2.5 border-t border-ink/20 pt-3 text-sm">
            <span className="font-semibold text-rose">{String(index + 1).padStart(2, "0")}</span>
            <div><strong className="block font-semibold text-ink">{step.title}</strong><p className="mt-0.5 text-muted">{step.description}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}
