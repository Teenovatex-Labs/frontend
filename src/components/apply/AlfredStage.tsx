"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AlfredSprite from "@/components/alfred/AlfredSprite";
import { MOOD_LABEL, poseFor, type AlfredMood } from "@/lib/alfred-expressions";

// A few harmless things he says if you poke him. Nothing here is saved or looked at by anyone.
const POKES = ["Yes? I am in the middle of something important. Looking at you.", "Careful, the suit is rented.", "That is five pokes. I am counting, and I am a little offended.", "If you are stalling, the question will still be there.", "I respect the curiosity. Now, about that answer."];

type Props = {
  mood: AlfredMood;
  /** Bump to replay the pose even when the mood is the same. */
  runKey: number;
  /** What he says. Always readable even when he is hidden. */
  say?: string | null;
  hidden: boolean;
  onHide: (hidden: boolean) => void;
  soundOn: boolean;
  onSound: (on: boolean) => void;
  size?: "sm" | "lg";
};

/**
 * Alfred next to the question card: the same painted character as in the dashboard, with a pose that follows what is
 * happening. He can be hidden, sound is off until asked for, and with reduced motion he stands still.
 */
export default function AlfredStage({ mood, runKey, say, hidden, onHide, soundOn, onSound, size = "lg" }: Props) {
  const reduced = useReducedMotion();
  const [pokes, setPokes] = useState(0);
  const [quip, setQuip] = useState<string | null>(null);
  const [pokeKey, setPokeKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const poke = () => {
    const n = pokes + 1;
    setPokes(n);
    setPokeKey((k) => k + 1);
    setQuip(POKES[Math.min(Math.floor((n - 1) / 2), POKES.length - 1)]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setQuip(null), 4000);
  };

  const showing = quip ?? say ?? null;
  const pose = quip ? "playful" : poseFor(mood);
  const width = size === "lg" ? "w-28 md:w-40" : "w-20 md:w-28";

  return (
    <aside aria-label="Alfred" className="flex items-start gap-3 md:flex-col md:items-center">
      {!hidden && (
        <button type="button" onClick={poke} aria-label={`${MOOD_LABEL[mood]}. Poke him.`} className={`${width} shrink-0 cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-rose`}>
          <AlfredSprite animation={pose} runKey={runKey + pokeKey} />
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 md:w-full md:flex-none">
        <div aria-live="polite" role="status" className="min-h-0">
          <AnimatePresence mode="wait">
            {showing && (
              <motion.p
                key={showing}
                initial={reduced ? false : { opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="relative rounded-xl rounded-tl-sm border border-ink bg-white px-3.5 py-2.5 text-sm shadow-[3px_3px_0_var(--ink)]"
              >
                {hidden && <span className="font-semibold">Alfred: </span>}
                {showing}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <button type="button" onClick={() => onHide(!hidden)} aria-pressed={hidden} className="underline underline-offset-4">
            {hidden ? "Show Alfred" : "Hide Alfred"}
          </button>
          <button type="button" onClick={() => onSound(!soundOn)} aria-pressed={soundOn} className="underline underline-offset-4">
            Sound {soundOn ? "on" : "off"}
          </button>
        </div>
      </div>
    </aside>
  );
}
