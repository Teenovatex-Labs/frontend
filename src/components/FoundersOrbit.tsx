import Image from "next/image";
import type { Founder } from "./People";

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

type FillerNode = {
  kind: "filler";
  angle: number;
  bg: string;
  fg: string;
  border?: boolean;
};

type FounderNode = {
  kind: "founder";
  angle: number;
  founder: Founder;
};

type OrbitNode = FillerNode | FounderNode;

type FounderSlot = { kind: "founder"; angle: number };

const RING_A_SLOTS: (FounderSlot | FillerNode)[] = [
  { kind: "founder", angle: 15 },
  { kind: "founder", angle: 135 },
  { kind: "founder", angle: 255 },
  { kind: "filler", angle: 195, bg: "bg-ink", fg: "text-cream" },
];

const RING_B: FillerNode[] = [
  { kind: "filler", angle: 55, bg: "bg-cream", fg: "text-ink", border: true },
  { kind: "filler", angle: 175, bg: "bg-muted", fg: "text-cream" },
  { kind: "filler", angle: 295, bg: "bg-line", fg: "text-ink" },
];

function OrbitNodeView({
  node,
  radius,
  size,
  counterClass,
  duration,
  onSelect,
}: {
  node: OrbitNode;
  radius: number;
  size: number;
  counterClass: string;
  duration: string;
  onSelect?: (founder: Founder) => void;
}) {
  const rad = (node.angle * Math.PI) / 180;
  const top = 50 + radius * Math.sin(rad);
  const left = 50 + radius * Math.cos(rad);

  const isFounder = node.kind === "founder";
  const founder = isFounder ? node.founder : null;

  return (
    <div
      className="absolute"
      style={{ top: `${top}%`, left: `${left}%`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className={`${counterClass} flex items-center justify-center rounded-full`}
        style={{ width: size, height: size, animationDuration: duration }}
      >
        {isFounder && founder ? (
          <button
            type="button"
            onClick={() => onSelect?.(founder)}
            aria-label={`View ${founder.name}'s bio`}
            className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-ink transition-transform hover:scale-105 ${
              founder.photo ? "" : founder.bg
            }`}
          >
            {founder.photo ? (
              <Image
                src={founder.photo}
                alt={founder.name}
                width={size * 2}
                height={size * 2}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 18%" }}
              />
            ) : (
              <span className="text-sm font-medium">{founder.initials}</span>
            )}
          </button>
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center rounded-full ${
              (node as FillerNode).bg
            } ${(node as FillerNode).fg} ${(node as FillerNode).border ? "border border-ink" : ""}`}
          >
            <PersonGlyph className="h-1/2 w-1/2" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function FoundersOrbit({
  founders,
  onSelect,
}: {
  founders: Founder[];
  onSelect: (founder: Founder) => void;
}) {
  let founderIndex = 0;
  const ringA: OrbitNode[] = [];
  for (const slot of RING_A_SLOTS) {
    if (slot.kind === "filler") {
      ringA.push(slot);
      continue;
    }
    const founder = founders[founderIndex];
    founderIndex += 1;
    if (founder) ringA.push({ kind: "founder", angle: slot.angle, founder });
  }

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
        {ringA.map((node) => (
          <OrbitNodeView
            key={node.angle}
            node={node}
            radius={31}
            size={node.kind === "founder" ? 68 : 48}
            counterClass="orbit-avatar-ccw"
            duration="42s"
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="orbit-ring orbit-ring-ccw" style={{ animationDuration: "58s" }}>
        {RING_B.map((node) => (
          <OrbitNodeView
            key={node.angle}
            node={node}
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
