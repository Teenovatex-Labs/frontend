"use client";

import { useEffect, useRef, useState } from "react";
import type { AlfredState } from "@/lib/alfred";

const MANIFEST_URL = "/alfred/animations.json";
const FRAME_WIDTH = 256;
const FRAME_HEIGHT = 320;
const COLUMNS = 4;

type Animation = { source: string; frames: number; fps: number; loop: boolean };
type AnimationManifest = {
  version: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  animations: Partial<Record<AlfredState, Animation>>;
};
type Playhead = { state: AlfredState; elapsed: number; lastTimestamp: number };

let manifestPromise: Promise<AnimationManifest> | undefined;
const sheetPromises = new Map<string, Promise<HTMLImageElement>>();

function loadManifest(): Promise<AnimationManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Alfred animations could not be loaded");
        return response.json() as Promise<AnimationManifest>;
      })
      .then((manifest) => {
        if (manifest.version !== 2 || manifest.cellWidth !== FRAME_WIDTH || manifest.cellHeight !== FRAME_HEIGHT || manifest.columns !== COLUMNS) {
          throw new Error("Alfred animation manifest is incompatible");
        }
        return manifest;
      })
      .catch((error) => {
        manifestPromise = undefined;
        throw error;
      });
  }
  return manifestPromise;
}

function loadSheet(source: string): Promise<HTMLImageElement> {
  const existing = sheetPromises.get(source);
  if (existing) return existing;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Alfred animation sheet could not be loaded"));
    image.src = source;
  }).catch((error) => {
    sheetPromises.delete(source);
    throw error;
  });
  sheetPromises.set(source, promise);
  return promise;
}

export type AlfredSpriteProps = {
  state: AlfredState;
  className?: string;
  paused?: boolean;
  reducedMotion?: boolean;
};

export default function AlfredSprite({ state, className, paused = false, reducedMotion = false }: AlfredSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playhead = useRef<Playhead>({ state, elapsed: 0, lastTimestamp: 0 });
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let disposed = false;
    let frameRequest = 0;
    let sheet: HTMLImageElement | undefined;
    let animation: Animation | undefined;
    let inViewport = !document.hidden;
    let lastWidth = 0;
    let lastHeight = 0;

    if (playhead.current.state !== state) {
      playhead.current = { state, elapsed: 0, lastTimestamp: 0 };
    } else {
      playhead.current.lastTimestamp = 0;
    }
    setError(false);

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(bounds.width * ratio);
      const height = Math.round(bounds.height * ratio);
      if (width !== lastWidth || height !== lastHeight) {
        canvas.width = width;
        canvas.height = height;
        lastWidth = width;
        lastHeight = height;
      }
    };

    const draw = (timestamp: number) => {
      if (disposed || !sheet || !animation) return;
      const head = playhead.current;
      const motionReduced = reducedMotion || media.matches;
      if (!paused && !motionReduced) {
        if (head.lastTimestamp) head.elapsed += Math.max(0, timestamp - head.lastTimestamp) / 1000;
      }
      head.lastTimestamp = timestamp;
      resizeCanvas();
      if (canvas.width && canvas.height) {
        const frame = motionReduced ? 0 : Math.floor(head.elapsed * animation.fps);
        const frameIndex = animation.loop
          ? frame % animation.frames
          : Math.min(animation.frames - 1, frame);
        const sourceX = (frameIndex % COLUMNS) * FRAME_WIDTH;
        const sourceY = Math.floor(frameIndex / COLUMNS) * FRAME_HEIGHT;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(sheet, sourceX, sourceY, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, canvas.width, canvas.height);
      }
      if (!paused && !motionReduced && inViewport && !document.hidden) {
        frameRequest = requestAnimationFrame(draw);
      } else {
        head.lastTimestamp = 0;
      }
    };

    const restart = () => {
      if (frameRequest) cancelAnimationFrame(frameRequest);
      frameRequest = 0;
      playhead.current.lastTimestamp = 0;
      if (sheet && animation && inViewport && !document.hidden) {
        draw(performance.now());
      }
    };

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onVisibilityChange = () => {
      restart();
    };
    const intersection = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          inViewport = entry.isIntersecting;
          restart();
        })
      : undefined;
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          resizeCanvas();
          restart();
        })
      : undefined;
    intersection?.observe(canvas);
    resizeObserver?.observe(canvas);
    document.addEventListener("visibilitychange", onVisibilityChange);
    media.addEventListener("change", restart);

    void loadManifest()
      .then((manifest) => {
        const selected = manifest.animations[state];
        if (!selected || selected.frames !== 16 || selected.fps <= 0) throw new Error(`Alfred animation is missing: ${state}`);
        animation = selected;
        return loadSheet(selected.source);
      })
      .then((image) => {
        if (disposed) return;
        sheet = image;
        resizeCanvas();
        restart();
      })
      .catch(() => {
        if (!disposed) setError(true);
      });

    return () => {
      disposed = true;
      if (frameRequest) cancelAnimationFrame(frameRequest);
      intersection?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      media.removeEventListener("change", restart);
    };
  }, [state, paused, reducedMotion]);

  return (
    <div className={className} style={{ position: "relative", width: "100%", aspectRatio: "4 / 5" }}>
    {error && <img src="/alfred/concept.png" alt="Alfred, your curly-haired companion in a charcoal suit" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />}
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Alfred is ${state === "consent" ? "asking for your permission" : state}`}
      data-alfred-state={state}
      style={{ display: "block", visibility: error ? "hidden" : "visible", width: "100%", height: "100%" }}
    />
    </div>
  );
}
