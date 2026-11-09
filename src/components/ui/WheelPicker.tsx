"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Small label above the number, e.g. the question. */
  label?: string;
  /** Small text under the number, e.g. "years old". */
  unit?: string;
  /** A taller, labelled tick every this many steps. Defaults to 5. */
  majorEvery?: number;
  /** Click on every value (vibration where supported, plus a soft tick sound). */
  haptics?: boolean;
  className?: string;
};

const TICK_GAP = 14; // px between values
const FRICTION = 4.2; // higher = glides for less time
const SNAP_SPEED = 14; // how fast it settles on the nearest value

const ROLL = {
  enter: (d: number) => ({ y: 44 * d, rotateX: -80 * d, opacity: 0 }),
  center: { y: 0, rotateX: 0, opacity: 1 },
  exit: (d: number) => ({ y: -44 * d, rotateX: 80 * d, opacity: 0 }),
};

/** One odometer column. It only animates when its own digit changes. */
function Digit({ ch, dir, reduced }: { ch: string; dir: number; reduced: boolean }) {
  return (
    <span className="relative inline-block h-full w-[0.56em] text-center [perspective:700px]">
      <AnimatePresence initial={false} mode="popLayout" custom={dir}>
        <motion.span
          key={ch}
          custom={dir}
          variants={ROLL}
          initial="enter"
          animate="center"
          exit="exit"
          transition={reduced ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]"
        >
          {ch}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * A draggable ruler wheel: flick it and it glides, then snaps to the nearest value. The ruler bends like a
 * real wheel (ticks shrink, fade and bunch up toward both edges), the big number rolls like a drum as it changes, and
 * every value passed gives a small click. Arrow keys, Home/End and PageUp/PageDown work too.
 */
export default function WheelPicker({ value, onChange, min, max, step = 1, label, unit, majorEvery = 5, haptics = true, className = "" }: Props) {
  const reduced = useReducedMotion();
  const id = useId();
  const count = Math.floor((max - min) / step) + 1;
  const toIndex = useCallback((v: number) => clamp(Math.round((v - min) / step), 0, count - 1), [min, step, count]);

  const rootRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const audioRef = useRef<AudioContext | null>(null);

  // Everything that changes every frame lives in refs, so dragging never re-renders React.
  const pos = useRef(toIndex(value)); // fractional index of the value under the marker
  const vel = useRef(0); // indices per second
  const target = useRef<number | null>(null); // where a keyboard or external change is heading
  const dragging = useRef(false);
  const lastShown = useRef(toIndex(value));
  const width = useRef(320);
  const raf = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [shown, setShown] = useState(value);
  // Which way the number is travelling, so it can roll in from the right side like a drum.
  const prevShown = useRef(shown);
  const dir = shown >= prevShown.current ? 1 : -1;
  useEffect(() => {
    prevShown.current = shown;
  }, [shown]);

  const tick = useCallback(() => {
    if (!haptics) return;
    try {
      navigator.vibrate?.(4);
    } catch {}
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = (audioRef.current ??= new Ctx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1700;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }, [haptics]);

  const paint = useCallback(() => {
    const radius = Math.max(120, width.current * 0.55);
    for (let i = 0; i < count; i++) {
      const el = tickRefs.current[i];
      if (!el) continue;
      const angle = ((i - pos.current) * TICK_GAP) / radius;
      if (Math.abs(angle) >= Math.PI / 2) {
        el.style.opacity = "0";
        continue;
      }
      const c = Math.cos(angle);
      el.style.opacity = String(c * c * c);
      el.style.transform = `translateX(${radius * Math.sin(angle)}px) scaleY(${0.35 + 0.65 * c})`;
    }
  }, [count]);

  const commitIfChanged = useCallback(() => {
    const idx = clamp(Math.round(pos.current), 0, count - 1);
    if (idx !== lastShown.current) {
      lastShown.current = idx;
      const v = min + idx * step;
      setShown(v);
      onChangeRef.current(v);
      tick();
    }
  }, [count, min, step, tick]);

  const frameLoop = useCallback(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragging.current) {
        if (target.current !== null) {
          // A keyboard or outside change: ease toward it.
          const diff = target.current - pos.current;
          pos.current += diff * Math.min(1, SNAP_SPEED * dt);
          vel.current = diff * SNAP_SPEED;
          if (Math.abs(diff) < 0.002) {
            pos.current = target.current;
            target.current = null;
            vel.current = 0;
          }
        } else if (Math.abs(vel.current) > 0.6 && !reduced) {
          // Gliding after a flick.
          pos.current = clamp(pos.current + vel.current * dt, 0, count - 1);
          vel.current *= Math.exp(-FRICTION * dt);
          if (pos.current <= 0 || pos.current >= count - 1) vel.current = 0;
        } else {
          // Settle on the nearest value.
          const goal = clamp(Math.round(pos.current), 0, count - 1);
          const diff = goal - pos.current;
          pos.current = reduced ? goal : pos.current + diff * Math.min(1, SNAP_SPEED * dt);
          vel.current = reduced ? 0 : diff * SNAP_SPEED * 0.3;
          if (Math.abs(diff) < 0.002) {
            pos.current = goal;
            vel.current = 0;
          }
        }
      }
      commitIfChanged();
      paint();
      const idle = !dragging.current && target.current === null && vel.current === 0 && Math.abs(pos.current - Math.round(pos.current)) < 0.002;
      raf.current = idle ? 0 : requestAnimationFrame(loop);
    };
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  }, [commitIfChanged, count, paint, reduced]);

  // Measure the wheel so the curve fits any width.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      width.current = el.clientWidth;
      paint();
    });
    ro.observe(el);
    width.current = el.clientWidth;
    paint();
    return () => ro.disconnect();
  }, [paint]);

  // A value changed from outside (not by us): glide there.
  useEffect(() => {
    const idx = toIndex(value);
    if (idx !== lastShown.current && !dragging.current) {
      target.current = idx;
      lastShown.current = idx;
      setShown(value);
      frameLoop();
    }
  }, [value, toIndex, frameLoop]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // --- pointer dragging with a velocity estimate ---
  const drag = useRef({ x: 0, t: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    target.current = null;
    vel.current = 0;
    drag.current = { x: e.clientX, t: performance.now() };
    frameLoop();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const now = performance.now();
    const dx = e.clientX - drag.current.x;
    const dt = Math.max(1, now - drag.current.t) / 1000;
    pos.current = clamp(pos.current - dx / TICK_GAP, 0, count - 1);
    // Smooth the speed a little so one jittery event can't fling the wheel.
    vel.current = vel.current * 0.6 + (-dx / TICK_GAP / dt) * 0.4;
    drag.current = { x: e.clientX, t: now };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    // A pause before release means no flick.
    if (performance.now() - drag.current.t > 80) vel.current = 0;
    vel.current = clamp(vel.current, -90, 90);
    frameLoop();
  };

  const go = (idx: number) => {
    target.current = clamp(idx, 0, count - 1);
    frameLoop();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const here = clamp(Math.round(pos.current), 0, count - 1);
    const keys: Record<string, number> = {
      ArrowLeft: here - 1, ArrowDown: here - 1, ArrowRight: here + 1, ArrowUp: here + 1,
      PageDown: here - 10, PageUp: here + 10, Home: 0, End: count - 1,
    };
    if (e.key in keys) {
      e.preventDefault();
      go(keys[e.key]!);
    }
  };

  return (
    <div className={`select-none rounded-3xl border-2 border-ink bg-ink px-5 pb-6 pt-6 text-cream ${className}`}>
      {label && (
        <p id={`${id}-label`} className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-cream/70">
          {label}
        </p>
      )}
      <div className="text-center">
        {/* An odometer: each digit sits in its own column and only the digits that change roll. 2006 to 2007 turns the 6 into a 7 and leaves 2, 0 and 0 where they are. Columns are counted from the right, so 9 to 10 keeps the units column in place. */}
        <div aria-hidden className="mx-auto flex h-[4.5rem] items-center justify-center font-display text-7xl leading-none tabular-nums">
          {String(shown).split("").map((ch, i, all) => (
            <Digit key={all.length - i} ch={ch} dir={dir} reduced={!!reduced} />
          ))}
        </div>
        {unit && <p className="mt-2 text-sm text-cream/60">{unit}</p>}
      </div>

      <div
        ref={rootRef}
        role="slider"
        tabIndex={0}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={label ? undefined : unit ?? "Value"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={shown}
        aria-valuetext={unit ? `${shown} ${unit}` : String(shown)}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative mt-6 h-20 cursor-grab touch-pan-y overflow-hidden rounded-xl outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-yellow"
      >
        {/* The marker stays put; the ruler moves under it. */}
        <span aria-hidden className="absolute left-1/2 top-0 z-10 h-3 w-1 -translate-x-1/2 rounded-full bg-[#ff7a1a]" />
        <div className="absolute inset-x-0 bottom-0 top-4">
          {Array.from({ length: count }, (_, i) => {
            const v = min + i * step;
            const major = i % majorEvery === 0;
            return (
              <span
                key={v}
                ref={(el) => {
                  tickRefs.current[i] = el;
                }}
                aria-hidden
                className="absolute left-1/2 top-0 flex w-0 flex-col items-center whitespace-nowrap opacity-0 will-change-transform"
                style={{ transformOrigin: "top center" }}
              >
                <span className={`block w-0.5 rounded-full bg-cream ${major ? "h-9" : "h-5 opacity-60"}`} />
                {major && <span className="mt-1 text-xs tabular-nums text-cream/80">{v}</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
