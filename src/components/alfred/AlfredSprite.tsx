"use client";

import { useEffect, useRef, useState } from "react";
import type { AlfredAnimation } from "@/lib/alfred";

const MANIFEST_URL = "/alfred/animations.json";
/** The still pose he holds when nothing is happening: the first frame of "curious". */
const STILL: AlfredAnimation = "curious";
const CROSSFADE_MS = 180;

type Animation = { source: string; frames: number; fps: number; loop: boolean; blend?: boolean };
type Manifest = {
  version: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  animations: Partial<Record<AlfredAnimation, Animation>>;
};

let manifestPromise: Promise<Manifest> | undefined;
const sheets = new Map<string, Promise<HTMLImageElement>>();

function loadManifest(): Promise<Manifest> {
  manifestPromise ??= fetch(MANIFEST_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Alfred animations could not be loaded");
      return r.json() as Promise<Manifest>;
    })
    .then((m) => {
      if (m.version !== 3) throw new Error("Alfred animation manifest is incompatible");
      return m;
    })
    .catch((e) => {
      manifestPromise = undefined;
      throw e;
    });
  return manifestPromise;
}

function loadSheet(src: string): Promise<HTMLImageElement> {
  let p = sheets.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Alfred sheet could not be loaded"));
      img.src = src;
    }).catch((e) => {
      sheets.delete(src);
      throw e;
    });
    sheets.set(src, p);
  }
  return p;
}

export type AlfredSpriteProps = {
  /** Which animation to play, or null for the still pose. */
  animation: AlfredAnimation | null;
  /** Bump this to restart the animation from its first frame. */
  runKey: number;
  className?: string;
};

/**
 * Draws Alfred on a canvas. While he is still, one frame is painted and then NOTHING runs, so an
 * idle Alfred costs no CPU. While he animates, neighbouring frames are blended together (the
 * frames are separate paintings, so stepping between them would look like a flicker), and a
 * change of pose crossfades instead of cutting.
 */
export default function AlfredSprite({ animation, runKey, className }: AlfredSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previous = useRef<HTMLCanvasElement | null>(null); // the last picture, kept for crossfades
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let disposed = false;
    let raf = 0;
    let running = false; // true while a frame is scheduled, so handlers never start a second loop
    let cleanup: (() => void) | undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const fit = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(box.width * dpr);
      const h = Math.round(box.height * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    const snapshot = () => {
      const copy = previous.current ?? document.createElement("canvas");
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext("2d")?.drawImage(canvas, 0, 0);
      previous.current = copy;
    };

    (async () => {
      try {
        const manifest = await loadManifest();
        const wanted = animation ?? STILL;
        const anim = manifest.animations[wanted];
        if (!anim) throw new Error(`Alfred animation is missing: ${wanted}`);
        const sheet = await loadSheet(anim.source);
        if (disposed) return;

        const { cellWidth: cw, cellHeight: ch, columns } = manifest;
        const still = animation === null || reduced.matches;
        const cell = (i: number) => ({ x: (i % columns) * cw, y: Math.floor(i / columns) * ch });
        const paint = (i: number, alpha: number) => {
          const { x, y } = cell(i);
          ctx.globalAlpha = alpha;
          ctx.drawImage(sheet, x, y, cw, ch, 0, 0, canvas.width, canvas.height);
        };

        fit();
        const hadPicture = previous.current !== null && canvas.width > 0;
        const start = performance.now();

        const draw = (now: number) => {
          if (disposed) return;
          fit();
          const t = (now - start) / 1000;
          let index = 0;
          let blendTo = -1;
          let blendAmount = 0;
          let finished = false;

          if (!still) {
            const position = t * anim.fps;
            const whole = Math.floor(position);
            if (anim.loop) {
              index = whole % anim.frames;
              blendTo = (index + 1) % anim.frames;
            } else if (whole >= anim.frames - 1) {
              index = anim.frames - 1;
              finished = true;
            } else {
              index = whole;
              blendTo = index + 1;
            }
            blendAmount = anim.blend && blendTo >= 0 ? position - whole : 0;
          }

          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Ease in from whatever was on screen so a change of pose never pops.
          const fade = hadPicture ? Math.min(1, (now - start) / CROSSFADE_MS) : 1;
          if (fade < 1 && previous.current) {
            ctx.globalAlpha = 1 - fade;
            ctx.drawImage(previous.current, 0, 0);
          }
          paint(index, fade);
          if (blendAmount > 0.02) paint(blendTo, blendAmount * fade);
          ctx.globalAlpha = 1;

          const settling = fade < 1;
          running = false;
          if (still && !settling) return; // painted once; nothing more runs
          if (finished && !settling) return; // one-shot animations hold their last frame
          if (document.hidden) return;
          schedule();
        };
        const schedule = () => {
          if (running || disposed) return;
          running = true;
          raf = requestAnimationFrame(draw);
        };

        // Keep a copy of what is showing so the NEXT change can crossfade from it.
        const remember = () => snapshot();
        schedule();
        const onVisible = () => {
          if (!document.hidden) schedule();
        };
        document.addEventListener("visibilitychange", onVisible);
        const onResize = () => schedule();
        window.addEventListener("resize", onResize);
        cleanup = () => {
          remember();
          document.removeEventListener("visibilitychange", onVisible);
          window.removeEventListener("resize", onResize);
        };
      } catch {
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [animation, runKey]);

  return (
    <div className={className} style={{ position: "relative", width: "100%", aspectRatio: "4 / 5" }}>
      {failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/alfred/concept.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-alfred-animation={animation ?? "still"}
        style={{ display: "block", width: "100%", height: "100%", visibility: failed ? "hidden" : "visible" }}
      />
    </div>
  );
}
