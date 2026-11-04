"use client";

import { useEffect, useRef, useState } from "react";
import { prefersLowMotion } from "@/lib/motion";

type Props = {
  /** Path to a Lottie JSON file under /public, e.g. "/lottie/success.json". */
  src: string;
  /** Accessible description. Pass "" only when the animation is purely decorative. */
  label: string;
  className?: string;
  loop?: boolean;
  /** Play once when it scrolls into view instead of looping. */
  autoplay?: boolean;
  /** Shown while loading and instead of the animation for reduced-motion / data-saver visitors. */
  poster?: string;
};

/**
 * Lazy, budgeted Lottie. The player library and the JSON are only fetched
 * when the slot nears the viewport, playback pauses when it scrolls away,
 * and visitors with reduced-motion, data-saver or a 2G connection get the
 * poster (or the first frame) with no animation download at all.
 */
export function LottieSlot({ src, label, className = "", loop = true, autoplay = true, poster }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [lowMotion, setLowMotion] = useState(true);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLowMotion(prefersLowMotion());
  }, []);

  useEffect(() => {
    const node = host.current;
    if (!node || lowMotion) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setNear(true)),
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [lowMotion]);

  useEffect(() => {
    const node = host.current;
    if (!node || !near || lowMotion) return;
    let cancelled = false;
    let anim: { destroy: () => void; play: () => void; pause: () => void } | undefined;
    let visibility: IntersectionObserver | undefined;

    (async () => {
      const [{ default: lottie }, data] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        fetch(src).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`lottie ${r.status}`)))),
      ]);
      if (cancelled) return;
      anim = lottie.loadAnimation({
        container: node,
        renderer: "svg",
        loop,
        autoplay,
        animationData: data,
        rendererSettings: { progressiveLoad: true },
      });
      visibility = new IntersectionObserver((entries) =>
        entries.forEach((e) => (e.isIntersecting ? anim?.play() : anim?.pause())),
      );
      visibility.observe(node);
      setReady(true);
    })().catch(() => {
      /* poster stays visible; a failed decoration must never break the page */
    });

    return () => {
      cancelled = true;
      visibility?.disconnect();
      anim?.destroy();
    };
  }, [near, lowMotion, src, loop, autoplay]);

  return (
    <div
      ref={host}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      style={poster && !ready ? { backgroundImage: `url(${poster})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" } : undefined}
    />
  );
}
