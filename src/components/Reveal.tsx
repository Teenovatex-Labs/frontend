"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

export type RevealFrom = "left" | "right" | "up" | "down" | "scale";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll reveal: the content glides in from a chosen side of the screen the first time it enters the
 * viewport. Opacity and transform only (GPU-composited), eased out over ~1s, and skipped entirely for
 * visitors who prefer reduced motion.
 */
export default function Reveal({
  children,
  from = "up",
  delay = 0,
  distance = 72,
  duration = 1,
  className,
  style,
}: {
  children: ReactNode;
  from?: RevealFrom;
  delay?: number;
  distance?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} style={style}>{children}</div>;

  const hidden = {
    opacity: 0,
    x: from === "left" ? -distance : from === "right" ? distance : 0,
    y: from === "up" ? distance * 0.5 : from === "down" ? -distance * 0.5 : 0,
    scale: from === "scale" ? 0.92 : 1,
  };

  return (
    <motion.div
      className={className}
      style={style}
      initial={hidden}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -6% 0px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
