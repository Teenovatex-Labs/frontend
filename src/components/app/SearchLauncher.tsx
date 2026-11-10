"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SearchIcon } from "@animateicons/react/lucide/search-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import { keys } from "@/lib/labs";
import type { Lab } from "@/lib/services";

const paths = [
  { label: "Home", href: "/home", detail: "Your space" },
  { label: "Labs", href: "/labs", detail: "Explore what members are making" },
  { label: "My labs", href: "/labs/mine", detail: "Your projects" },
  { label: "Start a lab", href: "/labs/new", detail: "Make something new" },
  { label: "Community", href: "/community", detail: "Find your people" },
  { label: "Events", href: "/events", detail: "What's coming up" },
  { label: "Learn", href: "/learn", detail: "Lessons and tracks" },
  { label: "Messages", href: "/messages", detail: "Conversations" },
  { label: "Notifications", href: "/notifications", detail: "Updates in your orbit" },
  { label: "Challenges", href: "/challenges", detail: "Put your work forward" },
  { label: "Leaderboard", href: "/leaderboard", detail: "See the builders" },
  { label: "My pairing", href: "/pairing", detail: "Build together" },
  { label: "Settings", href: "/settings", detail: "Make it yours" },
];

export default function SearchLauncher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [online, setOnline] = useState(true);
  const [mounted, setMounted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const qc = useQueryClient();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const focusable = document.querySelectorAll<HTMLElement>('#tx-search-launcher a[href], #tx-search-launcher button, #tx-search-launcher input');
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); trigger.current?.focus(); };
  }, [open]);

  const term = query.trim().toLowerCase();
  const destinations = paths.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(term)).slice(0, term ? 8 : 6);
  const cached = qc.getQueryData<{ projects: Lab[] }>(keys.myLabs)?.projects ?? [];
  const localLabs = term.length >= 2 ? cached.filter((lab) => `${lab.name} ${lab.short_description}`.toLowerCase().includes(term)).slice(0, 4) : [];
  const close = () => { setOpen(false); setQuery(""); };

  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Quick search" className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 bg-white shadow-[1px_1px_0_var(--ink)] active:scale-95"><SearchIcon size={20} /></button>
    {mounted && createPortal(<AnimatePresence>
      {open && <>
        <motion.button type="button" aria-label="Close quick search" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-ink/65 backdrop-blur-[4px]" />
        <motion.section id="tx-search-launcher" role="dialog" aria-modal="true" aria-label="Quick search" initial={reduce ? false : { opacity: 0, y: -16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: -12, scale: .98 }} transition={{ duration: .22, ease: [.22, 1, .36, 1] }} className="fixed inset-x-3 top-[calc(18px+env(safe-area-inset-top))] z-[71] mx-auto max-h-[min(82dvh,680px)] max-w-[620px] overflow-y-auto rounded-[26px] border-2 border-ink bg-cream p-4 shadow-[7px_7px_0_var(--pink)] sm:p-6">
          <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-rose">Find your way / TX</p><button type="button" onClick={close} aria-label="Close search" className="grid h-10 w-10 place-items-center rounded-full border border-ink bg-pink"><XIcon size={19} /></button></div>
          <div className="mt-4 flex items-center gap-3 rounded-[16px] border-2 border-ink bg-white px-4 shadow-[3px_3px_0_var(--ink)]"><SearchIcon size={20} /><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Where do you want to go?" aria-label="Search places in TeenovateX" className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none" /></div>
          {!online && <p className="mt-4 rounded-xl bg-yellow px-3 py-2 text-xs font-medium">You’re offline. Places and labs already loaded in this session can still be found here. Full search needs a connection.</p>}
          {localLabs.length > 0 && <div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-rose">Your loaded labs</p><div className="mt-2 space-y-1">{localLabs.map((lab) => <Link key={lab.id} href={`/labs/${lab.slug}`} onClick={close} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm hover:bg-yellow"><span className="truncate font-semibold">{lab.name}</span><span aria-hidden="true">↗</span></Link>)}</div></div>}
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.17em] text-rose">{term ? "Matching places" : "Quick paths"}</p>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">{destinations.map((item) => <Link key={item.href} href={item.href} onClick={close} className="group flex min-h-14 items-center justify-between gap-2 rounded-[13px] px-3 transition-colors hover:bg-yellow"><span><span className="block text-sm font-semibold">{item.label}</span><span className="block text-[11px] text-muted">{item.detail}</span></span><span aria-hidden="true" className="text-rose transition-transform group-hover:translate-x-1">↗</span></Link>)}</div>
          {term.length >= 2 && online && <Link href={`/search?q=${encodeURIComponent(query.trim())}`} onClick={close} className="mt-5 flex min-h-12 items-center justify-between rounded-[14px] border border-ink bg-ink px-4 text-sm font-semibold text-cream">Search all of TeenovateX for “{query.trim()}”<span aria-hidden="true">↗</span></Link>}
          {term && destinations.length === 0 && localLabs.length === 0 && !online && <p className="mt-4 text-sm text-muted">No loaded place matches that search.</p>}
        </motion.section>
      </>}
    </AnimatePresence>, document.body)}
  </>;
}
