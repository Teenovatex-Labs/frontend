"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  /** Modal art should begin loading as soon as it opens, without waiting for an intersection callback. */
  eager?: boolean;
  /** For tiny assets where loading is useful even if the browser reports a slow connection. */
  allowSlowConnection?: boolean;
  /** Visible until the SVG is actually mounted, and for visitors who prefer less motion. */
  fallback?: ReactNode;
};

/**
 * Lazy, budgeted Lottie. The player library and the JSON are only fetched
 * when the slot nears the viewport, playback pauses when it scrolls away,
 * and visitors with reduced-motion, data-saver or a 2G connection get the
 * poster (or the first frame) with no animation download at all.
 */
export function LottieSlot({ src, label, className = "", loop = true, autoplay = true, poster, eager = false, allowSlowConnection = false, fallback }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const [lowMotion, setLowMotion] = useState(true);
  const [near, setNear] = useState(eager);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLowMotion(prefersLowMotion({ allowSlowConnection }));
  }, [allowSlowConnection]);

  useEffect(() => {
    const node = host.current;
    if (!node || lowMotion || eager) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setNear(true)),
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [lowMotion, eager]);

  useEffect(() => {
    const node = player.current;
    if (!node || !near || lowMotion) return;
    let cancelled = false;
    let anim: { destroy: () => void; play: () => void; pause: () => void } | undefined;
    let visibility: IntersectionObserver | undefined;
    let mounted: MutationObserver | undefined;

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
      // loadAnimation can return before its first SVG frame exists. Keep the
      // fallback visible until there is actual artwork in the player.
      mounted = new MutationObserver(() => {
        if (node.querySelector("svg")) {
          setReady(true);
          mounted?.disconnect();
        }
      });
      mounted.observe(node, { childList: true, subtree: true });
      if (node.querySelector("svg")) {
        setReady(true);
        mounted.disconnect();
      }
      visibility = new IntersectionObserver((entries) =>
        entries.forEach((e) => (e.isIntersecting ? anim?.play() : anim?.pause())),
      );
      visibility.observe(host.current ?? node);
    })().catch(() => {
      /* poster stays visible; a failed decoration must never break the page */
    });

    return () => {
      cancelled = true;
      visibility?.disconnect();
      mounted?.disconnect();
      anim?.destroy();
    };
  }, [near, lowMotion, src, loop, autoplay]);

  return (
    <div
      ref={host}
      className={`relative ${className}`}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      style={poster && !ready ? { backgroundImage: `url(${poster})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" } : undefined}
    >
      <div ref={player} className={`absolute inset-0 ${ready ? "opacity-100" : "opacity-0"}`} />
      {!ready && fallback && <div className="absolute inset-0 grid place-items-center">{fallback}</div>}
    </div>
  );
}
