"use client";

import { animate, motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const GHOST_BODY_PATH = "M476.164 0.968656C491.898 -1.27283 520.471 0.873386 536.031 2.4042C616.784 10.3498 694.933 49.2095 755.701 102.48C904.639 233.052 976.688 435.23 992.645 628.512C997.941 695.728 995.947 770.827 987.455 837.54C985.064 853.187 983.62 869.725 978.711 884.82C969.503 913.161 945.577 944.639 913.412 946.237C869.463 948.435 841.151 900.428 835.845 862.25C834.547 852.916 834.983 842.865 834.131 833.444C829.077 762.635 802.632 689.28 748.487 641.254C719.624 615.808 680.447 599.571 641.862 603.037C594.331 607.307 560.945 631.756 530.891 666.535C566.329 733.016 579.933 811.252 575.711 886.079C574.21 912.561 571.634 931.597 550.865 950.478C540.137 960.238 532.11 964.179 518.342 968.459C472.076 977.919 431.861 957.691 425.367 908.562C414.589 827.006 429.596 739.251 467.58 666.419C433.411 627.388 389.368 597.615 334.929 603.134C244.901 612.245 190.61 700.357 171.816 781.061C160.563 829.387 170.41 881.645 135.595 921.76C111.023 950.517 76.466 957.13 46.6534 931.151C18.3467 906.48 13.208 873.821 8.54009 838.596C6.29664 821.7 4.4704 804.745 3.06352 787.752C-14.0204 572.643 39.6199 327.574 182.294 160.769C259.698 70.274 355.785 10.4189 476.164 0.968656Z";
const GHOST_LOGO_PATH = `${GHOST_BODY_PATH}M498.715 718.656C476.794 763.303 468.436 816.703 468.675 866.064C468.798 891.365 467.988 922.301 502.201 922.436C531.433 915.523 528.857 900.67 529.632 875.689C530.745 840.27 527.328 805.994 518.856 771.572C516.735 762.935 504.37 722.713 498.715 718.656ZM707.889 144.851C648.902 98.4902 565.235 67.6531 489.536 70.6972C381.352 76.0914 294.913 125.194 223.082 204.617C93.7845 347.582 40.7821 563.377 50.6739 752.585C52.3064 781.342 55.152 810.022 59.2051 838.537C61.2171 853.158 63.1396 879.233 74.6983 887.986C94.2406 902.258 112.97 881.886 115.858 862.463C117.806 850.912 117.224 839.127 117.808 827.383C124.259 697.52 209.088 528.49 360.082 538.027C408.806 541.106 453.937 568.451 486.379 603.734C490.726 608.469 494.89 613.62 499.296 618.219C535.18 575.935 579.991 542.521 636.063 538.192C785.136 526.796 870.935 690.529 880.036 819.153C881.169 835.091 879.175 865.32 893.011 875.612C921.497 896.807 933.532 865.135 936.698 842.875C971.575 597.624 911.223 304.9 707.889 144.851ZM639.134 292.38C687.372 285.317 732.184 318.754 739.146 367.005C746.107 415.256 712.576 459.995 664.309 466.86C616.186 473.696 571.608 440.29 564.665 392.18C557.723 344.071 591.04 299.422 639.134 292.38ZM333.743 292.389C381.776 285.35 426.456 318.479 433.676 366.484C440.896 414.491 407.936 459.297 359.958 466.696C311.722 474.142 266.623 440.963 259.365 392.699C252.107 344.436 285.452 299.464 333.743 292.389Z`;

type PathToken = string | readonly [x: number, y: number];

function tokenizePath(path: string): PathToken[] {
  const raw = path.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const tokens: PathToken[] = [];

  for (let index = 0; index < raw.length;) {
    if (/^[A-Za-z]$/.test(raw[index])) {
      tokens.push(raw[index]);
      index += 1;
    } else {
      tokens.push([Number(raw[index]), Number(raw[index + 1])]);
      index += 2;
    }
  }

  return tokens;
}

const BODY_PATH_TOKENS = tokenizePath(GHOST_BODY_PATH);
const LOGO_PATH_TOKENS = tokenizePath(GHOST_LOGO_PATH);

function flapPath(tokens: PathToken[], phase: number, strength: number) {
  let path = "";

  for (const token of tokens) {
    if (typeof token === "string") {
      path += token;
      continue;
    }

    const [x, y] = token;
    const amount = Math.max(0, Math.min(1, (y - 500) / 440));
    const cloth = amount * amount * (3 - 2 * amount);
    const lateral = strength * cloth * (
      0.62 * Math.sin(phase + y * 0.015) +
      0.38 * Math.sin(phase * 1.55 + x * 0.012)
    );
    const lift = strength * 0.14 * cloth * Math.sin(phase * 1.3 + x * 0.014);
    path += ` ${Number(x + lateral).toFixed(3)} ${Number(y + lift).toFixed(3)}`;
  }

  return path;
}

const ARC_LOOKUP = (() => {
  const steps = 320;
  const entries = [{ theta: 0, length: 0 }];
  let total = 0;
  let previousX = 0;
  let previousY = 0;

  for (let index = 1; index <= steps; index += 1) {
    const theta = (index / steps) * Math.PI * 2;
    const x = Math.sin(theta);
    const y = -0.29 * Math.sin(theta * 2);
    total += Math.hypot(x - previousX, y - previousY);
    entries.push({ theta, length: total });
    previousX = x;
    previousY = y;
  }

  return entries.map((entry) => ({ ...entry, length: entry.length / total }));
})();

function thetaAtDistance(progress: number) {
  let low = 0;
  let high = ARC_LOOKUP.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (ARC_LOOKUP[middle].length < progress) low = middle + 1;
    else high = middle;
  }

  const next = ARC_LOOKUP[low];
  const previous = ARC_LOOKUP[Math.max(0, low - 1)];
  const span = next.length - previous.length || 1;
  const mix = (progress - previous.length) / span;
  return previous.theta + (next.theta - previous.theta) * mix;
}

function naturalFlightProgress(progress: number) {
  const ramp = 0.06;
  const speed = 1 / (1 - ramp);
  if (progress < ramp) return speed * progress * progress / (2 * ramp);
  if (progress > 1 - ramp) return 1 - speed * (1 - progress) * (1 - progress) / (2 * ramp);
  return speed * (progress - ramp / 2);
}

function GhostArtwork({ bodyPath, logoPath }: { bodyPath: MotionValue<string>; logoPath: MotionValue<string> }) {
  return (
    <>
      <motion.path d={bodyPath} fill="var(--ink)" />
      <motion.path d={logoPath} fill="var(--rose)" />
    </>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
}) {
  const reduce = useReducedMotion();
  const starts = {
    up: { opacity: 0, y: 52 },
    down: { opacity: 0, y: -52 },
    left: { opacity: 0, x: 62 },
    right: { opacity: 0, x: -62 },
    scale: { opacity: 0, scale: 0.88, y: 20 },
  };

  return (
    <motion.div
      className={className}
      initial={reduce ? false : starts[direction]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.85, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function DropIn({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: -90, rotate: -3, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 92, damping: 14, delay }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 1.7, ease });
    return controls.stop;
  }, [count, inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      <span className="text-rose">{suffix}</span>
    </span>
  );
}

export function GhostFlight({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const ghostRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number | null>(null);
  const previousHeading = useRef<number | null>(null);
  const flightX = useMotionValue(0);
  const flightY = useMotionValue(0);
  const flightRotation = useMotionValue(0);
  const flightOpacity = useMotionValue(reduce ? 1 : 0);
  const bodyPath = useMotionValue(GHOST_BODY_PATH);
  const logoPath = useMotionValue(GHOST_LOGO_PATH);

  useAnimationFrame((time) => {
    if (reduce) {
      flightX.set(0);
      flightY.set(0);
      flightRotation.set(0);
      flightOpacity.set(1);
      bodyPath.set(GHOST_BODY_PATH);
      logoPath.set(GHOST_LOGO_PATH);
      previousHeading.current = null;
      return;
    }

    if (startedAt.current === null) startedAt.current = time;

    const delay = 180;
    const twirlDuration = 1000;
    const flightDuration = 3000;
    const duration = twirlDuration + flightDuration;
    const elapsed = time - startedAt.current - delay;

    if (elapsed <= 0) {
      flightOpacity.set(0);
      bodyPath.set(GHOST_BODY_PATH);
      logoPath.set(GHOST_LOGO_PATH);
      return;
    }

    if (elapsed >= duration) {
      flightX.set(0);
      flightY.set(0);
      flightRotation.set(0);
      flightOpacity.set(1);
      bodyPath.set(GHOST_BODY_PATH);
      logoPath.set(GHOST_LOGO_PATH);
      previousHeading.current = null;
      return;
    }

    const stage = ghostRef.current?.parentElement;
    const ghostWidth = ghostRef.current?.offsetWidth ?? 255;
    const horizontalRadius = stage
      ? Math.min(260, Math.max(96, (stage.clientWidth - ghostWidth) / 2 - 10))
      : 260;
    const verticalRadius = Math.min(74, horizontalRadius * 0.29);
    const startHeading = (Math.atan2(-2 * verticalRadius, horizontalRadius) * 180) / Math.PI + 90;

    if (elapsed < twirlDuration) {
      const twirlProgress = elapsed / twirlDuration;
      const twirlEase = 1 - Math.pow(1 - twirlProgress, 3);
      const twirlRotation = (720 + startHeading) * twirlEase;
      flightX.set(0);
      flightY.set(0);
      flightRotation.set(twirlRotation);
      flightOpacity.set(Math.min(1, elapsed / 150));
      previousHeading.current = 720 + startHeading;

      const twirlFlap = Math.min(1, elapsed / 160);
      const flapPhase = elapsed * 0.013;
      const flapStrength = 52 * twirlFlap;
      bodyPath.set(flapPath(BODY_PATH_TOKENS, flapPhase, flapStrength));
      logoPath.set(flapPath(LOGO_PATH_TOKENS, flapPhase, flapStrength));
      return;
    }

    const flightElapsed = elapsed - twirlDuration;
    const rawProgress = flightElapsed / flightDuration;
    const theta = thetaAtDistance(naturalFlightProgress(rawProgress));

    // Gerono's lemniscate gives one continuous, mathematically smooth infinity loop.
    flightX.set(horizontalRadius * Math.sin(theta));
    flightY.set(-verticalRadius * Math.sin(theta * 2));

    // Point the mascot's head, its natural upward axis, along the curve tangent.
    const tangentX = horizontalRadius * Math.cos(theta);
    const tangentY = -2 * verticalRadius * Math.cos(theta * 2);
    const desiredHeading = (Math.atan2(tangentY, tangentX) * 180) / Math.PI + 90;
    const previous = previousHeading.current;
    const heading = previous === null
      ? desiredHeading
      : previous + ((((desiredHeading - previous) % 360) + 540) % 360 - 180);
    previousHeading.current = heading;

    const settleProgress = Math.max(0, (rawProgress - 0.92) / 0.08);
    const settleEase = settleProgress * settleProgress * (3 - 2 * settleProgress);
    const visibleHeading = ((((heading + 180) % 360) + 360) % 360) - 180;
    flightRotation.set(visibleHeading * (1 - settleEase));
    flightOpacity.set(Math.min(1, elapsed / 420));

    const flapIn = Math.min(1, flightElapsed / 120);
    const flapOut = Math.min(1, (flightDuration - flightElapsed) / 420);
    const flapEnvelope = Math.max(0, Math.min(flapIn, flapOut));
    const flapEase = flapEnvelope * flapEnvelope * (3 - 2 * flapEnvelope);
    const flapPhase = elapsed * 0.011;
    const flapStrength = 50 * flapEase;
    bodyPath.set(flapPath(BODY_PATH_TOKENS, flapPhase, flapStrength));
    logoPath.set(flapPath(LOGO_PATH_TOKENS, flapPhase, flapStrength));
  });

  return (
    <motion.div
      ref={ghostRef}
      className={className}
      style={{ x: flightX, y: flightY, rotate: flightRotation, opacity: flightOpacity }}
    >
      <div>
        <svg viewBox="0 0 996 971" className="h-auto w-full overflow-visible" role="img" aria-label="TeenovateX ghost mascot flying">
          <g>
            <GhostArtwork bodyPath={bodyPath} logoPath={logoPath} />
            <motion.ellipse
              cx="334"
              cy="380"
              rx="78"
              ry="84"
              fill="var(--cream)"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              animate={reduce ? undefined : {
                x: [0, -18, -18, -18, 18, 18, 18, 0, 0],
                scaleY: [1, 1, 0.08, 1, 1, 0.08, 1, 1, 1],
              }}
              transition={{
                x: { duration: 5.4, delay: 4.45, times: [0, 0.12, 0.2, 0.28, 0.43, 0.52, 0.6, 0.78, 1], repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" },
                scaleY: { duration: 5.4, delay: 4.45, times: [0, 0.12, 0.2, 0.28, 0.43, 0.52, 0.6, 0.78, 1], repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" },
              }}
            />
            <motion.ellipse
              cx="640"
              cy="380"
              rx="78"
              ry="84"
              fill="var(--cream)"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              animate={reduce ? undefined : {
                x: [0, -18, -18, -18, 18, 18, 18, 0, 0],
                scaleY: [1, 1, 0.08, 1, 1, 0.08, 1, 1, 1],
              }}
              transition={{
                x: { duration: 5.4, delay: 4.45, times: [0, 0.12, 0.2, 0.28, 0.43, 0.52, 0.6, 0.78, 1], repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" },
                scaleY: { duration: 5.4, delay: 4.45, times: [0, 0.12, 0.2, 0.28, 0.43, 0.52, 0.6, 0.78, 1], repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" },
              }}
            />
          </g>
        </svg>
      </div>
    </motion.div>
  );
}
