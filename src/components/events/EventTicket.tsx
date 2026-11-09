"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { eventDay, eventTime } from "@/lib/dates";
import type { EventItem } from "@/lib/services";

// A reservation is the ticket. The detachable stub is visual; nothing about
// the animation changes the RSVP or produces a pretend admission credential.
export default function EventTicket({ event, celebrate, onClose }: { event: EventItem; celebrate: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(celebrate && !reduced ? 0 : 5);
  const close = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const buttons = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; before?.focus(); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  useEffect(() => {
    if (!celebrate || reduced) return;
    const times = [500, 1200, 2400, 3150, 4000];
    const timers = times.map((ms, index) => window.setTimeout(() => setPhase(index + 1), ms));
    return () => timers.forEach(window.clearTimeout);
  }, [celebrate, reduced]);

  const online = !!event.location && /^https?:\/\//.test(event.location);
  const format = (date: string) => `${eventDay(date)} · ${eventTime(date)}`;
  return createPortal(
    <div ref={dialog} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/80 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Ticket for ${event.title}`}>
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <motion.div initial={reduced ? false : { opacity: 0, y: 32, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", damping: 29, stiffness: 260 }} className="relative z-10 my-auto w-full max-w-[560px] overflow-hidden bg-cream p-5 shadow-[10px_10px_0_var(--pink)] sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div><p className="eyebrow text-rose">TeenovateX Labs · Events</p><h2 className="mt-2 text-[30px] leading-tight sm:text-[38px]">{phase < 5 ? ["A spot for you", "You're on the list!", "Printing your ticket…", "Here it comes", "One little tear…"][phase] : "Your event ticket"}</h2></div>
          <button ref={close} type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink text-2xl" aria-label="Close ticket">×</button>
        </div>

        <div className="relative mt-7 min-h-[410px] overflow-hidden bg-pink/30 px-3 py-7 sm:px-8">
          <AnimatePresence>{phase === 1 && <motion.div key="confirmed" initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-full bg-yellow px-5 py-2 text-sm font-bold shadow-[3px_3px_0_var(--ink)]">✓ RSVP confirmed</motion.div>}</AnimatePresence>
          {phase === 2 && <div className="absolute left-1/2 top-4 z-20 h-12 w-[min(85%,400px)] -translate-x-1/2 rounded-t-2xl bg-ink"><div className="mx-auto mt-6 h-2 w-4/5 rounded-full bg-cream/30" /></div>}
          <motion.div
            initial={phase < 5 ? { y: -370, opacity: 0 } : false}
            animate={{ y: phase < 2 ? -370 : phase === 2 ? -185 : 0, opacity: phase < 2 ? 0 : 1, rotate: phase === 4 ? -1 : 0, scale: phase === 5 && celebrate && !reduced ? 1.025 : 1 }}
            transition={{ duration: phase === 2 ? 1.1 : .65, ease: [0.22, 1, .36, 1] }}
            className="relative mx-auto flex max-w-[430px] drop-shadow-[5px_10px_6px_rgba(38,40,34,.19)]"
          >
            <div className="relative z-10 min-w-0 flex-1 border-2 border-ink bg-[#fffdf5] p-5 sm:p-7">
              <div className="absolute inset-x-0 top-0 h-2 bg-pink" />
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-rose">TeenovateX Labs / Admit one</p>
              <p className="mt-4 break-words font-serif text-[35px] font-bold leading-[.95] tracking-[-.04em] sm:text-[42px]">{event.title}</p>
              <div className="mt-5 h-[3px] w-16 bg-rose" />
              <dl className="mt-5 space-y-3 text-sm">
                <div><dt className="text-[10px] font-bold uppercase tracking-widest text-rose">When</dt><dd className="font-semibold">{format(event.starts_at)}{event.ends_at && ` – ${eventTime(event.ends_at)}`}</dd></div>
                <div><dt className="text-[10px] font-bold uppercase tracking-widest text-rose">Where</dt><dd className="font-semibold">{online ? "Online event" : event.location || "Details in event page"}</dd></div>
                <div><dt className="text-[10px] font-bold uppercase tracking-widest text-rose">Reserved for</dt><dd className="font-semibold">{user?.full_name || "You"}</dd></div>
              </dl>
              <p className="mt-5 border-t border-dashed border-ink/40 pt-3 text-xs text-rose">Your RSVP is your ticket. Keep this page handy.</p>
            </div>
            {celebrate && <motion.div animate={phase >= 4 && !reduced ? { x: 130, y: -90, rotate: 23, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }} transition={{ duration: .7, ease: [0.22, 1, .36, 1] }} className="relative flex w-[76px] shrink-0 flex-col items-center justify-center border-2 border-l-0 border-ink bg-yellow text-center [writing-mode:vertical-rl]">
              <span className="absolute inset-y-0 left-0 border-l-2 border-dashed border-rose" />
              <span className="text-[14px] font-black tracking-[.16em]">KEEP THIS MOMENT ✦</span>
            </motion.div>}
          </motion.div>
          {phase >= 4 && <motion.span initial={reduced ? false : { scale: .4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute bottom-2 right-5 text-5xl text-rose" aria-hidden="true">✦</motion.span>}
        </div>

        {phase >= 5 && celebrate && <motion.div initial={reduced ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", damping: 22 }} className="mt-4 flex items-center gap-3">
          <img src="/alfred/face.webp" alt="" className="h-12 w-12 rounded-full border border-ink bg-yellow object-cover" />
          <p className="rounded-2xl rounded-bl-sm bg-rose px-4 py-2 text-sm font-medium text-cream">You’re in. I’ll keep your ticket right here. <span className="sr-only">— Alfred</span></p>
        </motion.div>}

        {phase >= 5 ? <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/events/${event.id}`} onClick={onClose} className="btn">Event details</Link>
          {online && <a href={event.location!} target="_blank" rel="noopener noreferrer" className="btn-secondary">Join event ↗</a>}
          <button type="button" className="text-sm underline underline-offset-4" onClick={onClose}>Done</button>
        </div> : <button type="button" className="mt-5 text-sm underline underline-offset-4" onClick={() => setPhase(5)}>Skip animation</button>}
      </motion.div>
    </div>, document.body,
  );
}
