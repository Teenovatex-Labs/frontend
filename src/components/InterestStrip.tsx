const INTERESTS = [
  "Software & coding",
  "AI & robotics",
  "Creative technology",
  "Youth-led research",
];

export default function InterestStrip() {
  const items = [...INTERESTS, ...INTERESTS];

  return (
    <div className="overflow-hidden border-y border-line bg-yellow py-4">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-8 whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-8 text-sm font-semibold">
            {item}
            <span aria-hidden="true">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
}
