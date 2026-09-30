"use client";

import Link from 'next/link';
import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { useAlfred } from '@/context/AlfredContext';
import { ALFRED_STATES } from '@/lib/alfred';
import AlfredSprite from './AlfredSprite';
import styles from './AlfredCompanion.module.css';

type Point = { x: number; y: number };
const POSITION_KEY = 'tx_alfred_position';

export default function AlfredCompanion({ embedded = false }: { embedded?: boolean }) {
  const { state, message, consent, resolveConsent, wake, play, minimized, setMinimized, hidden, setHidden } = useAlfred();
  const host = useRef<HTMLElement>(null);
  const drag = useRef<{ origin: Point; pointer: Point; moved: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [menu, setMenu] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const positionRef = useRef(position);
  positionRef.current = position;

  const constrain = (point: Point) => {
    const height = host.current?.getBoundingClientRect().height ?? 270;
    return { x: Math.max(8, Math.min(window.innerWidth - 280, point.x)), y: Math.max(8, Math.min(window.innerHeight - height - 12, point.y)) };
  };
  useEffect(() => {
    setMounted(true);
    if (embedded) return;
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY) ?? 'null');
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) setPosition(constrain(saved));
    } catch {}
    const resize = () => setPosition(point => point ? constrain(point) : point);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [embedded]);
  useEffect(() => {
    setSpeaking(true);
    const timer = window.setTimeout(() => setSpeaking(false), 6500);
    if (positionRef.current) setPosition(constrain(positionRef.current));
    return () => window.clearTimeout(timer);
  }, [state, message, consent]);

  const save = (point: Point) => { try { localStorage.setItem(POSITION_KEY, JSON.stringify(point)); } catch {} };
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (embedded || e.button !== 0) return;
    const rect = host.current!.getBoundingClientRect();
    drag.current = { origin: { x: rect.x, y: rect.y }, pointer: { x: e.clientX, y: e.clientY }, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const gesture = drag.current;
    if (!gesture) return;
    const dx = e.clientX - gesture.pointer.x, dy = e.clientY - gesture.pointer.y;
    if (Math.hypot(dx, dy) > 5) gesture.moved = true;
    if (gesture.moved) { setDragging(true); setPosition(constrain({ x: gesture.origin.x + dx, y: gesture.origin.y + dy })); }
  };
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (drag.current?.moved && positionRef.current) save(positionRef.current);
    setDragging(false);
    // The click handler consumes the movement flag so dragging never triggers play.
  };
  const interact = () => {
    if (drag.current?.moved) { drag.current = null; return; }
    drag.current = null;
    if (state === 'resting') wake(); else play();
    setSpeaking(true);
  };
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (embedded || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const rect = host.current!.getBoundingClientRect(), step = e.shiftKey ? 24 : 8;
    const next = constrain({ x: rect.x + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0), y: rect.y + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0) });
    setPosition(next); save(next);
  };
  if (!mounted) return null;
  if ((hidden || minimized) && !consent) return <button type="button" className={`${styles.restore} ${embedded ? styles.restoreEmbedded : ''}`} onClick={() => { setHidden(false); setMinimized(false); wake(); }} aria-label="Bring Alfred back"><span aria-hidden="true">✦</span> Alfred</button>;
  const showSpeech = Boolean(consent || menu || speaking || ['operating', 'planning', 'thinking', 'alerting', 'failed', 'offline'].includes(state));
  return <aside ref={host} aria-label="Alfred companion" className={`${styles.companion} ${embedded ? styles.embedded : ''} ${dragging ? styles.dragging : ''}`} style={!embedded && position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined}>
    {showSpeech && <div className={styles.bubble}>
      <div className={styles.bubbleHeading}><span className={styles.dot} /><strong>{consent?.title ?? ALFRED_STATES[state].label}</strong></div>
      <p role="status" aria-live="polite">{consent?.message ?? message}</p>
      {consent && <div className={styles.choices} role="group" aria-label="Permission requested"><button type="button" onClick={() => resolveConsent(false)}>Not now</button><button type="button" onClick={() => resolveConsent(true)}>Allow</button></div>}
    </div>}
    <button type="button" className={styles.character} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; setDragging(false); }} onClick={interact} onKeyDown={key} aria-label={`Alfred is ${state}. ${state === 'resting' ? 'Wake Alfred' : 'Play with Alfred'}. ${embedded ? '' : 'Drag or use arrow keys to move.'}`}><AlfredSprite state={state} /><span className={styles.name}>Alfred <i /></span></button>
    <div className={`${styles.toolbar} ${menu || embedded ? styles.toolbarOpen : ''}`}>
      <button type="button" onClick={state === 'resting' ? wake : play}>{state === 'resting' ? 'Wake up' : 'Say hello'}</button>
      <Link href="/alfred" aria-label="Open Alfred studio">Expressions</Link>
      <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize Alfred">−</button>
      <button type="button" onClick={() => setHidden(true)} aria-label="Hide Alfred">×</button>
    </div>
    <button type="button" className={styles.menu} aria-label="Alfred controls" aria-expanded={menu} onClick={() => setMenu(value => !value)}>···</button>
  </aside>;
}
