function PersonGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Avatar = {
  angle: number;
  bg: string;
  fg: string;
  border?: boolean;
};

const RING_A: Avatar[] = [
  { angle: 15, bg: "bg-yellow", fg: "text-ink" },
  { angle: 105, bg: "bg-pink", fg: "text-ink" },
  { angle: 195, bg: "bg-ink", fg: "text-cream" },
  { angle: 285, bg: "bg-rose", fg: "text-cream" },
];

const RING_B: Avatar[] = [
  { angle: 55, bg: "bg-cream", fg: "text-ink", border: true },
  { angle: 175, bg: "bg-muted", fg: "text-cream" },
  { angle: 295, bg: "bg-line", fg: "text-ink" },
];

function OrbitAvatar({
  avatar,
  radius,
  size,
  counterClass,
  duration,
}: {
  avatar: Avatar;
  radius: number;
  size: number;
  counterClass: string;
  duration: string;
}) {
  const rad = (avatar.angle * Math.PI) / 180;
  const top = 50 + radius * Math.sin(rad);
  const left = 50 + radius * Math.cos(rad);

  return (
    <div
      className="absolute"
      style={{ top: `${top}%`, left: `${left}%`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className={`${counterClass} flex items-center justify-center rounded-full ${avatar.bg} ${avatar.fg} ${
          avatar.border ? "border border-ink" : ""
        }`}
        style={{ width: size, height: size, animationDuration: duration }}
      >
        <PersonGlyph className="h-1/2 w-1/2" />
      </div>
    </div>
  );
}

export default function FoundersOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="200" cy="200" r="124" fill="none" stroke="var(--ink)" strokeOpacity="0.22" strokeDasharray="3 8" />
        <circle cx="200" cy="200" r="168" fill="none" stroke="var(--ink)" strokeOpacity="0.14" strokeDasharray="3 8" />

        <g stroke="var(--ink)" strokeOpacity="0.32" strokeWidth="1.2">
          <line x1="120" y1="110" x2="280" y2="100" />
          <line x1="120" y1="110" x2="300" y2="290" />
          <line x1="120" y1="110" x2="110" y2="300" />
          <line x1="280" y1="100" x2="300" y2="290" />
          <line x1="280" y1="100" x2="110" y2="300" />
          <line x1="300" y1="290" x2="110" y2="300" />
        </g>

        <circle cx="120" cy="110" r="52" fill="var(--yellow)" fillOpacity="0.5" stroke="var(--ink)" strokeWidth="1.4" />
        <circle cx="280" cy="100" r="44" fill="var(--pink)" fillOpacity="0.45" stroke="var(--ink)" strokeWidth="1.4" />
        <circle cx="300" cy="290" r="56" fill="var(--ink)" fillOpacity="0.07" stroke="var(--ink)" strokeWidth="1.4" />
        <circle cx="110" cy="300" r="40" fill="var(--rose)" fillOpacity="0.14" stroke="var(--ink)" strokeWidth="1.4" />

        <g fill="var(--ink)">
          <circle cx="120" cy="110" r="3.2" />
          <circle cx="280" cy="100" r="3.2" />
          <circle cx="300" cy="290" r="3.2" />
          <circle cx="110" cy="300" r="3.2" />
        </g>
      </svg>

      <div className="orbit-ring orbit-ring-cw" style={{ animationDuration: "42s" }}>
        {RING_A.map((avatar) => (
          <OrbitAvatar
            key={avatar.angle}
            avatar={avatar}
            radius={31}
            size={52}
            counterClass="orbit-avatar-ccw"
            duration="42s"
          />
        ))}
      </div>

      <div className="orbit-ring orbit-ring-ccw" style={{ animationDuration: "58s" }}>
        {RING_B.map((avatar) => (
          <OrbitAvatar
            key={avatar.angle}
            avatar={avatar}
            radius={42}
            size={44}
            counterClass="orbit-avatar-cw"
            duration="58s"
          />
        ))}
      </div>
    </div>
  );
}
