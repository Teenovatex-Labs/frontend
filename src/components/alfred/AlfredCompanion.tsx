"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useAlfred } from "@/context/AlfredContext";
import { ALFRED_STATES } from "@/lib/alfred";
import AlfredSprite from "./AlfredSprite";
import AlfredChat from "./AlfredChat";

type Point = { x: number; y: number };

const POSITION_KEY = "tx_alfred_position_v2";
const EDGE = 8; // never closer than this to the window edge
const TOOLBAR_ROOM = 48; // keeps the hover buttons under him on screen
const DRAG_THRESHOLD = 5; // px of movement before a press becomes a drag
const TOOLS_LINGER_MS = 1_400;
const PANEL_WIDTH = 284;

// He is small on purpose: a companion, not a mascot taking over the page.
const size = () => (typeof window !== "undefined" && window.innerWidth < 520 ? { w: 76, h: 95 } : { w: 96, h: 120 });

function clamp(p: Point): Point {
  const { w, h } = size();
  // Bounds depend only on his own body. The bubble, toolbar and chat float around him and
  // never change where he can stand, which is what used to make him jump.
  return {
    x: Math.round(Math.max(EDGE, Math.min(window.innerWidth - w - EDGE, p.x))),
    y: Math.round(Math.max(EDGE, Math.min(window.innerHeight - h - TOOLBAR_ROOM, p.y))),
  };
}

const home = (): Point => {
  const { w, h } = size();
  return clamp({ x: window.innerWidth - w - 20, y: window.innerHeight - h - TOOLBAR_ROOM });
};

function loadPosition(): Point {
  try {
    const raw = JSON.parse(window.localStorage.getItem(POSITION_KEY) ?? "null") as Point | null;
    if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y)) return clamp(raw);
  } catch {
    // fall through to the default corner
  }
  return home();
}

export default function AlfredCompanion() {
  const { state, animation, runKey, message, bubble, consent, minimized, chatOpen, setMinimized, setHover, setDragging, resolveConsent, yo } = useAlfred();

  const root = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const posRef = useRef(pos);
  const gesture = useRef<{ origin: Point; pointer: Point; moved: boolean } | null>(null);
  const frame = useRef(0);
  const [toolsVisible, setToolsVisible] = useState(false);
  const toolsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [viewport, setViewport] = useState({ w: 1024, h: 768 });

  const place = useCallback((p: Point) => {
    posRef.current = p;
    if (root.current) root.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  }, []);
  const commit = useCallback(
    (p: Point) => {
      const next = clamp(p);
      place(next);
      setPos(next);
      try {
        window.localStorage.setItem(POSITION_KEY, JSON.stringify(next));
      } catch {
        // Position just won't be remembered.
      }
    },
    [place]
  );

  useEffect(() => {
    const start = loadPosition();
    posRef.current = start;
    setPos(start);
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    setMounted(true);
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      const next = clamp(posRef.current);
      place(next);
      setPos(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [place]);

  // useLayoutEffect so the transform is right before the first paint (no flash in the corner).
  useLayoutEffect(() => {
    if (mounted) place(posRef.current);
  }, [mounted, place, minimized]);

  useEffect(() => () => clearTimeout(toolsTimer.current), []);

  // --- hover -----------------------------------------------------------------------------
  const enter = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    clearTimeout(toolsTimer.current);
    setToolsVisible(true);
    setHover(true);
  };
  const leave = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    setHover(false);
    clearTimeout(toolsTimer.current);
    toolsTimer.current = setTimeout(() => setToolsVisible(false), TOOLS_LINGER_MS);
  };

  // --- dragging --------------------------------------------------------------------------
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    gesture.current = { origin: { ...posRef.current }, pointer: { x: e.clientX, y: e.clientY }, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.pointer.x;
    const dy = e.clientY - g.pointer.y;
    if (!g.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      g.moved = true;
      setDragging(true);
    }
    if (g.moved) {
      // Move the element directly, once per frame. Going through React state on every pointer
      // event is what made dragging feel choppy.
      cancelAnimationFrame(frame.current);
      const target = clamp({ x: g.origin.x + dx, y: g.origin.y + dy });
      frame.current = requestAnimationFrame(() => place(target));
    }
  };
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    cancelAnimationFrame(frame.current);
    const g = gesture.current;
    if (g?.moved) {
      // Land exactly where the pointer was released. Relying on the last animation frame would
      // drop the final movement on a quick flick and leave him short of where you let go.
      commit({ x: g.origin.x + (e.clientX - g.pointer.x), y: g.origin.y + (e.clientY - g.pointer.y) });
      setDragging(false);
    }
    // `click` fires right after this; it reads `moved` to tell a tap from the end of a drag.
  };
  const click = () => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.moved) return;
    yo();
  };
  const cancel = () => {
    cancelAnimationFrame(frame.current);
    if (gesture.current?.moved) {
      commit(posRef.current);
      setDragging(false);
    }
    gesture.current = null;
  };
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 32 : 10;
    const delta: Record<string, Point> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    commit({ x: posRef.current.x + d.x, y: posRef.current.y + d.y });
  };

  if (!mounted) return null;

  if (minimized && !consent) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Bring Alfred back"
        title="Bring Alfred back"
        className="group fixed bottom-5 right-5 z-[45] grid h-14 w-14 place-items-center rounded-full border border-ink bg-yellow shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/alfred/face.webp" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
        <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-ink bg-cream text-[12px] font-bold leading-none">
          +
        </span>
      </button>
    );
  }

  const { w, h } = size();
  const below = pos.y < viewport.h / 2; // put panels on whichever side has more room
  const panelW = Math.min(PANEL_WIDTH, viewport.w - EDGE * 2);
  // Keep panels inside the window while staying centred on him as far as possible.
  const panelLeft = Math.max(EDGE, Math.min(viewport.w - panelW - EDGE, pos.x + w / 2 - panelW / 2)) - pos.x;
  const panelStyle = { width: panelW, left: panelLeft };

  const showTools = toolsVisible || chatOpen || Boolean(consent);
  const label = consent ? "Alfred needs your permission" : `Alfred: ${ALFRED_STATES[state].label}`;

  return (
    <aside
      ref={root}
      aria-label="Alfred, your companion"
      className="pointer-events-none fixed left-0 top-0 z-[45] font-sans text-ink"
      style={{ width: w, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, willChange: "transform" }}
    >
      {/* Everything that counts as "hovering Alfred": his body and the buttons under it. */}
      <div onPointerEnter={enter} onPointerLeave={leave} onFocus={() => setToolsVisible(true)} className="pointer-events-auto relative" style={{ width: w }}>
        <button
          type="button"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={cancel}
          onClick={click}
          onKeyDown={key}
          aria-label={`${label}. Press Enter to say yo. Drag, or use the arrow keys, to move him.`}
          className="block cursor-grab touch-none select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-rose active:cursor-grabbing"
          style={{ width: w, height: h }}
        >
          <AlfredSprite animation={animation} runKey={runKey} />
        </button>

        <div
          role="toolbar"
          aria-label="Alfred controls"
          className={`absolute left-1/2 top-full mt-1 flex -translate-x-1/2 items-center gap-1 rounded-full border border-ink bg-cream p-1 shadow-[2px_2px_0_var(--ink)] transition-[opacity,transform] duration-150 motion-reduce:transition-none ${
            showTools ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        >
          <button type="button" onClick={yo} tabIndex={showTools ? 0 : -1} className="rounded-full bg-pink px-3.5 py-1 text-xs font-semibold transition-colors hover:bg-yellow">
            Yo
          </button>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            tabIndex={showTools ? 0 : -1}
            aria-label="Minimize Alfred"
            title="Minimize"
            className="grid h-7 w-7 place-items-center rounded-full text-base leading-none transition-colors hover:bg-yellow"
          >
            −
          </button>
        </div>
      </div>

      {((bubble && message) || chatOpen) && (
        // One stack for everything that speaks, so the bubble and the chat never overlap.
        <div
          className={`pointer-events-none absolute flex flex-col gap-2 ${below ? "top-[calc(100%+44px)]" : "bottom-[calc(100%+8px)]"}`}
          style={panelStyle}
        >
          {bubble && message && (
            <div
              role={consent ? "alertdialog" : "status"}
              aria-live={consent ? undefined : "polite"}
              aria-label={consent?.title}
              className="pointer-events-auto border border-ink bg-white px-3.5 py-3 text-[13px] leading-snug shadow-[3px_3px_0_var(--ink)]"
            >
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-rose">
                <span className="h-1.5 w-1.5 rounded-full bg-rose" aria-hidden="true" />
                {consent?.title ?? ALFRED_STATES[state].label}
              </p>
              <p className="mt-1.5 whitespace-pre-line break-words">{message}</p>
              {consent && (
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Permission">
                  <button type="button" onClick={() => resolveConsent(false)} className="flex-1 rounded-md border border-ink px-3 py-1.5 text-xs font-semibold hover:bg-cream">
                    Not now
                  </button>
                  {consent.actionId && (
                    <button type="button" onClick={() => resolveConsent(true, true)} className="flex-1 rounded-md border border-ink px-3 py-1.5 text-xs font-semibold hover:bg-cream">
                      Always allow
                    </button>
                  )}
                  <button type="button" onClick={() => resolveConsent(true)} className="flex-1 rounded-md border border-ink bg-pink px-3 py-1.5 text-xs font-semibold hover:bg-yellow">
                    Allow
                  </button>
                </div>
              )}
            </div>
          )}
          {chatOpen && (
            <div className="pointer-events-auto">
              <AlfredChat />
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
