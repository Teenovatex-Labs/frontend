"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon } from "@animateicons/react/lucide/arrow-left-icon";
import { ArrowRightIcon } from "@animateicons/react/lucide/arrow-right-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import useIconHover from "@/lib/useIconHover";
import { KIND_LABEL, MOMENTS, type Moment, type StoryKind } from "@/lib/story";
import { openContact } from "@/lib/contactBus";

type Filter = "all" | StoryKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "milestone", label: "Milestones" },
  { id: "event", label: "Events" },
  { id: "teenovator", label: "Teenovators" },
];

const TILTS = [-2.4, 1.8, -1.2, 2.6, -1.8, 1.2];
const SHADOWS = ["var(--pink)", "var(--yellow)", "var(--ink)"];
const pad = (n: number) => String(n).padStart(2, "0");

function Photo({ moment, sizes }: { moment: Moment; sizes: string }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink bg-[#fef9ed]">
      {moment.photo ? (
        <Image src={moment.photo} alt={moment.alt ?? moment.title} fill sizes={sizes} className="object-cover" />
      ) : (
        <>
          <img
            src={`/doodles/${moment.doodle}.png`}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-[44%] w-[58%] -translate-x-1/2 -translate-y-1/2"
          />
          <p className="absolute inset-x-0 bottom-5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Developing&hellip;
          </p>
          <div className="photo-dev absolute inset-0" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

export default function Teenovators() {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false });
  const lastFocus = useRef<HTMLElement | null>(null);
  const prevIcon = useIconHover();
  const nextIcon = useIconHover();
  const modalPrevIcon = useIconHover();
  const modalNextIcon = useIconHover();
  const closeIcon = useIconHover();

  const items = filter === "all" ? MOMENTS : MOMENTS.filter((m) => m.kind === filter);
  const total = items.length + 1;
  const open = items.find((m) => m.id === openId) ?? null;

  const cardStep = useCallback(() => {
    const cards = scroller.current?.querySelectorAll<HTMLElement>("[data-card]");
    if (!cards || cards.length === 0) return 1;
    return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = scroller.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(total - 1, i));
      el.scrollTo({ left: clamped * cardStep(), behavior: reduce ? "auto" : "smooth" });
    },
    [total, cardStep, reduce]
  );

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / cardStep()))));
  };

  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    setActive(0);
  }, [filter]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      const el = scroller.current;
      if (!d.down || !el) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 5) d.moved = true;
      el.scrollLeft = d.startLeft - dx;
    };
    const up = () => {
      const el = scroller.current;
      if (!drag.current.down) return;
      drag.current.down = false;
      setDragging(false);
      if (el) el.style.scrollSnapType = "";
      // Let the click that follows a drag release be swallowed by the card.
      window.setTimeout(() => {
        drag.current.moved = false;
      }, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (e.pointerType !== "mouse" || e.button !== 0 || !el) return;
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    el.style.scrollSnapType = "none";
    setDragging(true);
  };

  const openMoment = (m: Moment, target: HTMLElement) => {
    if (drag.current.moved) return;
    lastFocus.current = target;
    setOpenId(m.id);
  };

  const closeModal = useCallback(() => {
    setOpenId(null);
    lastFocus.current?.focus();
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const idx = items.findIndex((m) => m.id === openId);
      if (idx === -1) return;
      const next = items[(idx + dir + items.length) % items.length];
      setOpenId(next.id);
    },
    [items, openId]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeModal, step]);

  return (
    <section id="story" className="relative overflow-x-clip border-t border-line py-16 md:py-24">
      <img
        src="/doodles/laptop.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 top-10 hidden w-44 rotate-6 opacity-[0.16] md:block"
      />

      <div className="wrap">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-16">
          <div>
            <p className="eyebrow text-rose">04 / The story so far</p>
            <h2 className="mt-6 text-[40px] leading-[1.05] md:text-[64px]">
              Receipts,
              <br />
              <span className="font-serif font-normal italic">
                in <span className="highlight">photographs.</span>
              </span>
            </h2>
          </div>
          <p className="max-w-md text-muted">
            Our first events, the day the founders finally shared a room, and the Teenovators who made
            it real. Drag through it, or tap any photo for the story behind it.
          </p>
        </div>

        <div role="group" aria-label="Filter the photo wall" className="mt-10 flex flex-wrap gap-2.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-full border border-ink px-4 py-1.5 text-sm font-semibold transition-all ${
                filter === f.id
                  ? "bg-ink text-cream shadow-[3px_3px_0_var(--pink)]"
                  : "bg-transparent hover:-translate-y-0.5 hover:bg-yellow"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <LayoutGroup>
        <div
          ref={scroller}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          role="region"
          aria-label="Photo wall"
          aria-roledescription="carousel"
          className={`no-scrollbar reel-gutter mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-10 pt-6 md:gap-8 ${
            dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((m, i) => (
              <motion.article
                key={m.id}
                data-card
                layout
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-[78vw] max-w-[340px] shrink-0 snap-start"
              >
                <button
                  type="button"
                  onClick={(e) => openMoment(m, e.currentTarget)}
                  aria-haspopup="dialog"
                  aria-label={`${m.title}. Open the story.`}
                  style={
                    {
                      "--tilt": `${TILTS[i % TILTS.length]}deg`,
                      boxShadow: `6px 6px 0 ${SHADOWS[i % SHADOWS.length]}`,
                    } as React.CSSProperties
                  }
                  className="relative block w-full border border-ink bg-[#fffdf6] p-3.5 pb-5 text-left transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] [transform:rotate(var(--tilt))] hover:z-10 hover:[transform:rotate(0deg)_translateY(-10px)] focus-visible:[transform:rotate(0deg)_translateY(-10px)]"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-3 left-1/2 block h-6 w-24 -translate-x-1/2 -rotate-2 bg-yellow/80 shadow-sm"
                  />
                  <motion.span layoutId={`photo-${m.id}`} className="block">
                    <Photo moment={m} sizes="(max-width: 768px) 78vw, 340px" />
                  </motion.span>
                  <span className="mt-4 block font-serif text-[22px] italic leading-tight">{m.caption}</span>
                  <span className="mt-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em]">
                    <span className="text-rose">
                      Nº {pad(i + 1)} &middot; {KIND_LABEL[m.kind]}
                    </span>
                    <span className="text-muted">Read ↗︎</span>
                  </span>
                </button>
              </motion.article>
            ))}

            <motion.article
              key="cta"
              data-card
              layout
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-[78vw] max-w-[340px] shrink-0 snap-start"
            >
              <div className="flex h-full min-h-[430px] flex-col justify-between border border-dashed border-ink bg-pink/40 p-6">
                <div>
                  <p className="eyebrow text-rose">Your turn</p>
                  <p className="mt-4 font-serif text-[30px] italic leading-[1.1]">Were you there?</p>
                  <p className="mt-3 text-sm text-muted">
                    Been to a TeenovateX event, or built something with us? Send us your photo and your story
                    and it could be the next one on this wall.
                  </p>
                </div>
                <button type="button" onClick={() => openContact("hello")} className="btn self-start">
                  Send us yours <span>↗︎</span>
                </button>
              </div>
            </motion.article>
          </AnimatePresence>
          <span aria-hidden="true" className="w-1 shrink-0" />
        </div>
      </LayoutGroup>

      <div className="wrap flex items-center gap-5">
        <p className="w-[74px] shrink-0 font-mono text-sm tabular-nums">
          {pad(active + 1)} / {pad(total)}
        </p>

        <nav aria-label="Photo wall timeline" className="relative flex flex-1 items-center justify-between">
          <span aria-hidden="true" className="absolute inset-x-1 top-1/2 -z-10 border-t-2 border-dotted border-pink" />
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to photo ${i + 1}`}
              aria-current={active === i}
              className="group flex h-6 w-6 items-center justify-center bg-cream"
            >
              <span
                className={`block rounded-full border border-ink transition-all duration-300 ${
                  active === i ? "h-4 w-4 bg-rose" : "h-2.5 w-2.5 bg-cream group-hover:bg-yellow"
                }`}
              />
            </button>
          ))}
        </nav>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous photo"
            onMouseEnter={prevIcon.onMouseEnter}
            onMouseLeave={prevIcon.onMouseLeave}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink transition-all hover:bg-yellow disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowLeftIcon ref={prevIcon.ref} size={20} />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active >= total - 1}
            aria-label="Next photo"
            onMouseEnter={nextIcon.onMouseEnter}
            onMouseLeave={nextIcon.onMouseLeave}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink bg-ink text-cream transition-all hover:bg-rose disabled:opacity-30 disabled:hover:bg-ink"
          >
            <ArrowRightIcon ref={nextIcon.ref} size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label={open.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative my-auto grid w-full max-w-[880px] gap-6 border border-ink bg-cream p-5 shadow-[8px_8px_0_var(--pink)] md:grid-cols-[minmax(0,340px)_1fr] md:gap-10 md:p-8"
            >
              <motion.div layoutId={`photo-${open.id}`} className="mx-auto w-full max-w-[260px] border border-ink bg-[#fffdf6] p-3 pb-6 md:max-w-none">
                <Photo moment={open} sizes="(max-width: 768px) 90vw, 340px" />
              </motion.div>

              <motion.div
                key={open.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                className="flex flex-col"
              >
                <p className="eyebrow text-rose">
                  {KIND_LABEL[open.kind]}
                  {open.when ? ` · ${open.when}` : ""}
                </p>
                <h3 className="mt-4 text-[32px] leading-[1.05] md:text-[42px]">
                  <span className="highlight">{open.title}</span>
                </h3>
                <p className="mt-4 font-serif text-xl italic">{open.caption}</p>
                <div className="mt-5 space-y-3 text-[15px] text-muted">
                  {open.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>

                <div className="mt-auto flex items-center gap-3 pt-8">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous story"
                    onMouseEnter={modalPrevIcon.onMouseEnter}
                    onMouseLeave={modalPrevIcon.onMouseLeave}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink hover:bg-yellow"
                  >
                    <ArrowLeftIcon ref={modalPrevIcon.ref} size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next story"
                    onMouseEnter={modalNextIcon.onMouseEnter}
                    onMouseLeave={modalNextIcon.onMouseLeave}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink bg-ink text-cream hover:bg-rose"
                  >
                    <ArrowRightIcon ref={modalNextIcon.ref} size={20} />
                  </button>
                  <span className="ml-auto text-xs text-muted">Esc to close</span>
                </div>
              </motion.div>

              <button
                type="button"
                onClick={closeModal}
                autoFocus
                aria-label="Close story"
                onMouseEnter={closeIcon.onMouseEnter}
                onMouseLeave={closeIcon.onMouseLeave}
                className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border border-ink bg-yellow shadow-[3px_3px_0_var(--ink)] transition-transform hover:rotate-90"
              >
                <XIcon ref={closeIcon.ref} size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
