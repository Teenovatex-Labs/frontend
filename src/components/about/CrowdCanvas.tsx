"use client";

import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";

type Peep = {
  image: HTMLImageElement;
  rect: [number, number, number, number];
  width: number;
  height: number;
  x: number;
  y: number;
  anchorY: number;
  scaleX: number;
  walk: gsap.core.Timeline | null;
  render: (ctx: CanvasRenderingContext2D) => void;
};

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
const randomIndex = (array: unknown[]) => (randomRange(0, array.length) | 0);
const removeFromArray = <T,>(array: T[], i: number) => array.splice(i, 1)[0];
const removeRandomFromArray = <T,>(array: T[]) => removeFromArray(array, randomIndex(array));

/** A parade of tiny line-art figures walking across a canvas — self-paced,
 * looping forever, each on its own random timing so the crowd never
 * feels mechanical. Ported from the classic codepen "crowd" sketch
 * (openpeeps.com sprite sheet) and trimmed to just the one walk cycle
 * this site actually uses. */
export default function CrowdCanvas({
  src,
  cols = 15,
  rows = 7,
  tint,
  className,
}: {
  src: string;
  /** Sprite sheet grid — characters across (cols) by characters down (rows). */
  cols?: number;
  rows?: number;
  /** Recolors every drawn (opaque) pixel to this CSS color, so the crowd
   * reads as a brand tint instead of the sprite sheet's native white. */
  tint?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  // Mounting the canvas + sprite sheet only once this section is close to
  // view keeps it off the critical path entirely, so the rest of the page
  // paints and becomes interactive first — this is what makes it feel
  // instant instead of the sluggish load a naive "just render it" version
  // would have.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const stage = { width: 0, height: 0 };
    const allPeeps: Peep[] = [];
    const availablePeeps: Peep[] = [];
    const crowd: Peep[] = [];

    const createPeep = (image: HTMLImageElement, rect: [number, number, number, number]): Peep => {
      const [, , w, h] = rect;
      const peep: Peep = {
        image,
        rect,
        width: w,
        height: h,
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,
        render(c) {
          c.save();
          c.translate(peep.x, peep.y);
          c.scale(peep.scaleX, 1);
          c.drawImage(peep.image, rect[0], rect[1], rect[2], rect[3], 0, 0, peep.width, peep.height);
          c.restore();
        },
      };
      return peep;
    };

    const resetPeep = (peep: Peep) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const offsetY = 40 - 90 * (Math.random() * Math.random());
      const startY = stage.height - peep.height + offsetY;
      let startX: number;
      let endX: number;

      if (direction === 1) {
        startX = -peep.width;
        endX = stage.width;
        peep.scaleX = 1;
      } else {
        startX = stage.width + peep.width;
        endX = 0;
        peep.scaleX = -1;
      }

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;
      return { startY, endX };
    };

    const walk = (peep: Peep, props: { startY: number; endX: number }) => {
      const { startY, endX } = props;
      const xDuration = randomRange(14, 22);
      const yDuration = 0.25;
      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.6, 1.3));
      tl.to(peep, { duration: xDuration, x: endX, ease: "none" }, 0);
      tl.to(
        peep,
        { duration: yDuration, repeat: Math.round(xDuration / yDuration), yoyo: true, y: startY - 8 },
        0
      );
      return tl;
    };

    const addPeepToCrowd = () => {
      const peep = removeRandomFromArray(availablePeeps);
      const props = resetPeep(peep);
      const tl = walk(peep, props).eventCallback("onComplete", () => {
        removeFromArray(crowd, crowd.indexOf(peep));
        availablePeeps.push(peep);
        addPeepToCrowd();
      });
      peep.walk = tl;
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const initCrowd = () => {
      while (availablePeeps.length) addPeepToCrowd().walk?.progress(Math.random());
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);
      crowd.forEach((peep) => peep.render(ctx));
      ctx.restore();

      // Recolor every opaque pixel just drawn to the tint color, keeping
      // each pixel's original alpha (anti-aliased edges stay smooth).
      if (tint) {
        ctx.save();
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    };

    const resize = () => {
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      canvas.width = stage.width * devicePixelRatio;
      canvas.height = stage.height * devicePixelRatio;
      crowd.forEach((peep) => peep.walk?.kill());
      crowd.length = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);
      initCrowd();
    };

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const rectW = img.naturalWidth / cols;
      const rectH = img.naturalHeight / rows;
      for (let i = 0; i < cols * rows; i++) {
        allPeeps.push(createPeep(img, [(i % cols) * rectW, ((i / cols) | 0) * rectH, rectW, rectH]));
      }
      resize();
      gsap.ticker.add(render);
    };
    img.src = src;

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(render);
      crowd.forEach((peep) => peep.walk?.kill());
    };
  }, [visible, src, cols, rows]);

  return <canvas ref={canvasRef} className={className} />;
}
