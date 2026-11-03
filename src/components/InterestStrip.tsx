import { Reveal } from "./Motion";

const INTERESTS = [
  "Software & coding",
  "AI & robotics",
  "Creative technology",
  "Youth-led research",
];

export default function InterestStrip() {
  return (
    <div className="bg-ink py-4 text-cream" aria-label="Community interests">
      <Reveal className="wrap">
        <div className="grid grid-cols-2 gap-3 text-center text-sm font-medium md:flex md:items-center md:justify-between md:text-left">
          {INTERESTS.map((interest, i) => (
            <span key={interest} className="flex items-center gap-5">
              {interest}
              {i < INTERESTS.length - 1 && (
                <b aria-hidden="true" className="hidden text-2xl font-normal text-pink md:inline">
                  ✳
                </b>
              )}
            </span>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
