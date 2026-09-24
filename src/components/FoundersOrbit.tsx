import Image from "next/image";
import type { Founder } from "./People";

type OrbitNode = {
  angle: number;
  founder: Founder;
};

const RING_A_ANGLES = [15, 135, 255];
const RING_B_ANGLES = [0, 72, 144, 216, 288];
const RING_C_ANGLES = [36, 108, 180, 252, 324];

function zip(founders: Founder[], angles: number[]): OrbitNode[] {
  return founders.map((founder, i) => ({ angle: angles[i], founder }));
}

function OrbitNodeView({
  node,
  radius,
  size,
  textClass,
  counterClass,
  duration,
  onSelect,
}: {
  node: OrbitNode;
  radius: number;
  size: number;
  textClass: string;
  counterClass: string;
  duration: string;
  onSelect: (founder: Founder) => void;
}) {
  const rad = (node.angle * Math.PI) / 180;
  const top = (50 + radius * Math.sin(rad)).toFixed(4);
  const left = (50 + radius * Math.cos(rad)).toFixed(4);
  const founder = node.founder;

  return (
    <div
      className="absolute"
      style={{ top: `${top}%`, left: `${left}%`, transform: "translate(-50%, -50%)" }}
    >
      <div
        className={`${counterClass} flex items-center justify-center rounded-full`}
        style={{ width: size, height: size, animationDuration: duration }}
      >
        <button
          type="button"
          onClick={() => onSelect(founder)}
          aria-label={`View ${founder.name}'s bio`}
          className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-ink transition-transform hover:scale-105 hover:z-10 ${
            founder.photo ? "" : `${founder.bg} ${founder.fg ?? ""}`
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
            <span className={`${textClass} font-medium leading-none tracking-tight`}>{founder.initials}</span>
          )}
        </button>
      </div>
    </div>
  );
}

// Ring radii/sizes are solved (not eyeballed) so that adjacent rings never collide.
// Two rings spin at different speeds, so their relative angle sweeps through zero
// periodically — at that moment two nodes sit at the same angle, radius apart. The
// radius gap between rings must exceed the sum of their avatar radii at all times,
// checked against the narrowest real container width (~335px on mobile).
const RING_A = { radius: 20, size: 50, textClass: "text-sm" };
const RING_B = { radius: 36, size: 34, textClass: "text-xs" };
const RING_C = { radius: 46, size: 24, textClass: "text-[9px]" };

export default function FoundersOrbit({
  founders,
  onSelect,
}: {
  founders: Founder[];
  onSelect: (founder: Founder) => void;
}) {
  const ringA = zip(founders.slice(0, 3), RING_A_ANGLES);
  const ringB = zip(founders.slice(3, 8), RING_B_ANGLES);
  const ringC = zip(founders.slice(8, 13), RING_C_ANGLES);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px]">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="200" cy="200" r={RING_A.radius * 4} fill="none" stroke="var(--ink)" strokeOpacity="0.18" strokeDasharray="3 8" />
        <circle cx="200" cy="200" r={RING_B.radius * 4} fill="none" stroke="var(--ink)" strokeOpacity="0.16" strokeDasharray="3 8" />
        <circle cx="200" cy="200" r={RING_C.radius * 4} fill="none" stroke="var(--ink)" strokeOpacity="0.14" strokeDasharray="3 8" />
        <circle cx="200" cy="200" r="3" fill="var(--ink)" fillOpacity="0.4" />
      </svg>

      <div className="orbit-ring orbit-ring-cw" style={{ animationDuration: "42s" }}>
        {ringA.map((node) => (
          <OrbitNodeView
            key={node.founder.name}
            node={node}
            radius={RING_A.radius}
            size={RING_A.size}
            textClass={RING_A.textClass}
            counterClass="orbit-avatar-ccw"
            duration="42s"
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="orbit-ring orbit-ring-ccw" style={{ animationDuration: "58s" }}>
        {ringB.map((node) => (
          <OrbitNodeView
            key={node.founder.name}
            node={node}
            radius={RING_B.radius}
            size={RING_B.size}
            textClass={RING_B.textClass}
            counterClass="orbit-avatar-cw"
            duration="58s"
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="orbit-ring orbit-ring-cw" style={{ animationDuration: "74s" }}>
        {ringC.map((node) => (
          <OrbitNodeView
            key={node.founder.name}
            node={node}
            radius={RING_C.radius}
            size={RING_C.size}
            textClass={RING_C.textClass}
            counterClass="orbit-avatar-ccw"
            duration="74s"
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
