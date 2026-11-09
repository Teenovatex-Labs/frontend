"use client";

import { useState } from "react";
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
  onPreview,
}: {
  node: OrbitNode;
  radius: number;
  size: number;
  textClass: string;
  counterClass: string;
  duration: string;
  onSelect: (founder: Founder) => void;
  onPreview: (founder: Founder | null) => void;
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
        style={{ width: Math.max(size, 44), height: Math.max(size, 44), animationDuration: duration }}
      >
        <button
          type="button"
          onClick={() => onSelect(founder)}
          onPointerEnter={() => onPreview(founder)}
          onPointerLeave={() => onPreview(null)}
          onFocus={() => onPreview(founder)}
          onBlur={() => onPreview(null)}
          aria-label={`Open ${founder.name}, ${founder.role}`}
          className="group pointer-events-auto flex shrink-0 items-center justify-center rounded-full transition-transform hover:z-10 hover:scale-110 active:scale-95"
          style={{ width: Math.max(size, 44), height: Math.max(size, 44) }}
        >
          <span
            className={`flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink shadow-[2px_2px_0_var(--cream)] ${
              founder.photo ? "" : `${founder.bg} ${founder.fg ?? ""}`
            }`}
            style={{ width: size, height: size }}
          >
            {founder.photo ? (
              <Image
                src={founder.photo}
                alt=""
                width={size * 2}
                height={size * 2}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 18%" }}
              />
            ) : (
              <span className={`${textClass} font-medium leading-none tracking-tight`}>{founder.initials}</span>
            )}
          </span>
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
  const [preview, setPreview] = useState<Founder | null>(null);
  const ringA = zip(founders.slice(0, 3), RING_A_ANGLES);
  const ringB = zip(founders.slice(3, 8), RING_B_ANGLES);
  const ringC = zip(founders.slice(8, 13), RING_C_ANGLES);

  return (
    <div className="founders-orbit relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden">
      {/* The rotating rings are square divs; a rotated square's axis-aligned
          bounding box grows up to ~1.41x at 45 degrees, which — without this
          overflow-hidden — periodically pushed past the viewport edge and
          caused the whole page to scroll horizontally, even though the
          visible avatar content itself always stays within these bounds. */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="200" cy="200" r={RING_A.radius * 4} fill="none" stroke="var(--ink)" strokeOpacity="0.18" strokeDasharray="3 8" />
        <circle cx="200" cy="200" r={RING_B.radius * 4} fill="none" stroke="var(--ink)" strokeOpacity="0.16" strokeDasharray="3 8" />
        <circle cx="200" cy="200" r={RING_C.radius * 4} fill="none" stroke="var(--ink)" strokeOpacity="0.14" strokeDasharray="3 8" />
        <circle cx="200" cy="200" r="3" fill="var(--ink)" fillOpacity="0.4" />
      </svg>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[2] flex h-[62px] w-[100px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-ink bg-cream/95 px-2 text-center shadow-[3px_3px_0_var(--pink)] backdrop-blur-sm md:h-[82px] md:w-[142px] md:px-3">
        <strong className="max-w-full truncate text-[10px] leading-tight md:text-xs">
          {preview?.name ?? `${founders.length} people`}
        </strong>
        <span className="mt-1 max-w-full truncate text-[8px] leading-tight text-muted md:text-[10px]">
          {preview?.role ?? "One connected team"}
        </span>
      </div>

      <div className="orbit-ring orbit-ring-cw pointer-events-none" style={{ animationDuration: "42s" }}>
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
            onPreview={setPreview}
          />
        ))}
      </div>

      <div className="orbit-ring orbit-ring-ccw pointer-events-none" style={{ animationDuration: "58s" }}>
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
            onPreview={setPreview}
          />
        ))}
      </div>

      <div className="orbit-ring orbit-ring-cw pointer-events-none" style={{ animationDuration: "74s" }}>
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
            onPreview={setPreview}
          />
        ))}
      </div>
    </div>
  );
}
