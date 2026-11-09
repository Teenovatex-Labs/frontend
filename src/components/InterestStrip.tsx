import Reveal from "./Reveal";
const INTERESTS = [
  "Software & coding",
  "AI & robotics",
  "Creative technology",
  "Youth-led research",
];

export default function InterestStrip() {
  return (
    <div className="bg-ink py-4 text-cream" aria-label="Community interests">
      <Reveal from="up" distance={40} className="wrap grid grid-cols-2 gap-3 text-center text-sm font-medium md:flex md:items-center md:justify-between md:text-left">
        {INTERESTS.map((interest, i) => (
          <span key={interest} className="flex items-center gap-5">
            {interest}
            {i < INTERESTS.length - 1 && (
              <b aria-hidden="true" className="hidden font-normal text-pink md:inline text-2xl">
                ✳
              </b>
            )}
          </span>
        ))}
      </Reveal>
    </div>
  );
}
