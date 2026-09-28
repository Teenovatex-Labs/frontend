"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Phrase = {
  text: string;
  /** Extra classes for this line only — e.g. the italic/rose treatment on
   * the last beat of a headline. */
  className?: string;
};

type FocusRect = { x: number; y: number; width: number; height: number };

/** Cycles through a headline's lines one at a time — the current line
 * sharpens while the rest blur, and a glowing corner-bracket frame glides
 * to track whichever one is active. Adapted from the reference-site
 * "TrueFocus" component (single-word, horizontal) into a line-by-line,
 * left-aligned version that fits a real headline instead of a word chip
 * row, and re-themed from its purple glow to the site's rose. */
export default function TrueFocus({
  phrases,
  blurAmount = 6,
  color = "var(--rose)",
  glowColor = "rgba(141, 53, 91, 0.55)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1.4,
  className = "",
}: {
  phrases: Phrase[];
  blurAmount?: number;
  color?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const interval = setInterval(
      () => setCurrentIndex((i) => (i + 1) % phrases.length),
      (animationDuration + pauseBetweenAnimations) * 1000
    );
    return () => clearInterval(interval);
  }, [reduced, animationDuration, pauseBetweenAnimations, phrases.length]);

  useEffect(() => {
    const parent = containerRef.current;
    const line = lineRefs.current[currentIndex];
    if (!parent || !line) return;
    const parentRect = parent.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    setFocusRect({
      x: lineRect.left - parentRect.left,
      y: lineRect.top - parentRect.top,
      width: lineRect.width,
      height: lineRect.height,
    });
  }, [currentIndex]);

  return (
    <div ref={containerRef} className={`relative flex flex-col items-start ${className}`} role="text" aria-label={phrases.map((p) => p.text).join(" ")}>
      {phrases.map((phrase, i) => (
        <span
          key={i}
          ref={(el) => {
            lineRefs.current[i] = el;
          }}
          className={phrase.className}
          style={
            reduced
              ? undefined
              : {
                  filter: i === currentIndex ? "blur(0px)" : `blur(${blurAmount}px)`,
                  opacity: i === currentIndex ? 1 : 0.5,
                  transition: `filter ${animationDuration}s ease, opacity ${animationDuration}s ease`,
                }
          }
        >
          {phrase.text}
        </span>
      ))}

      {!reduced && (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 box-border"
          animate={{ x: focusRect.x, y: focusRect.y, width: focusRect.width, height: focusRect.height }}
          transition={{ duration: animationDuration }}
          style={{ "--tf-border": color, "--tf-glow": glowColor } as React.CSSProperties}
        >
          <span className="absolute left-[-14px] top-[-14px] h-5 w-5 rounded-[3px] border-[3px] border-b-0 border-r-0" style={{ borderColor: "var(--tf-border)", filter: "drop-shadow(0 0 5px var(--tf-glow))" }} />
          <span className="absolute right-[-14px] top-[-14px] h-5 w-5 rounded-[3px] border-[3px] border-b-0 border-l-0" style={{ borderColor: "var(--tf-border)", filter: "drop-shadow(0 0 5px var(--tf-glow))" }} />
          <span className="absolute bottom-[-14px] left-[-14px] h-5 w-5 rounded-[3px] border-[3px] border-r-0 border-t-0" style={{ borderColor: "var(--tf-border)", filter: "drop-shadow(0 0 5px var(--tf-glow))" }} />
          <span className="absolute bottom-[-14px] right-[-14px] h-5 w-5 rounded-[3px] border-[3px] border-l-0 border-t-0" style={{ borderColor: "var(--tf-border)", filter: "drop-shadow(0 0 5px var(--tf-glow))" }} />
        </motion.div>
      )}
    </div>
  );
}
