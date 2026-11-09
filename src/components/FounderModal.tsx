"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Founder } from "./People";

export default function FounderModal({
  founder,
  founders,
  onSelect,
  onClose,
}: {
  founder: Founder;
  founders: Founder[];
  onSelect: (founder: Founder) => void;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeIndex = founders.findIndex((member) => member.name === founder.name);
  const previous = founders[(activeIndex - 1 + founders.length) % founders.length];
  const next = founders[(activeIndex + 1) % founders.length];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onSelect(previous);
      if (event.key === "ArrowRight") onSelect(next);
    };

    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [next, onClose, onSelect, previous]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-profile-name"
      aria-describedby="team-profile-summary"
    >
      <div className="relative grid max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-ink bg-cream shadow-[7px_7px_0_var(--pink)] md:grid-cols-[280px_minmax(0,1fr)]">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg border border-ink bg-cream px-3 py-2 text-xs font-bold transition-colors hover:bg-pink active:translate-y-px md:right-5 md:top-5"
        >
          Close
        </button>

        <aside className="bg-ink p-6 pr-20 text-cream md:p-8 md:pr-8">
          <div
            className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-cream/50 ${
              founder.photo ? "" : `${founder.bg} ${founder.fg ?? "text-ink"}`
            }`}
          >
            {founder.photo ? (
              <Image
                src={founder.photo}
                alt={founder.name}
                width={180}
                height={180}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 18%" }}
              />
            ) : (
              <span className="text-2xl font-semibold tracking-tight">{founder.initials}</span>
            )}
          </div>

          <p className="mt-6 text-xs font-bold text-pink">{founder.unit}</p>
          <h3 id="team-profile-name" className="mt-2 max-w-[12ch] text-3xl tracking-tight">
            {founder.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">{founder.role}</p>

          <div className="mt-7 flex flex-wrap gap-2" aria-label="Core strengths">
            {founder.strengths.map((strength) => (
              <span key={strength} className="rounded-full border border-cream/25 px-3 py-1.5 text-[11px] leading-tight text-cream/85">
                {strength}
              </span>
            ))}
          </div>

          {founder.href && (
            <a
              href={founder.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-3 border-b border-pink pb-1 text-sm font-bold text-cream transition-colors hover:text-pink"
            >
              View public profile <span aria-hidden="true">↗</span>
            </a>
          )}
        </aside>

        <article className="min-w-0 p-6 sm:p-8 md:p-10 md:pt-16">
          <p id="team-profile-summary" className="max-w-2xl text-xl font-medium leading-snug tracking-tight sm:text-2xl">
            {founder.bio}
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <section className="rounded-2xl border border-line bg-white/45 p-5">
              <h4 className="text-sm font-bold text-rose">Mandate</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">{founder.mandate}</p>
            </section>
            <section className="rounded-2xl border border-line bg-white/45 p-5">
              <h4 className="text-sm font-bold text-rose">Success looks like</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">{founder.success}</p>
            </section>
          </div>

          <section className="mt-8">
            <h4 className="text-sm font-bold">Immediate focus</h4>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {founder.focus.map((item) => (
                <li key={item} className="border-l-2 border-rose pl-3 text-sm leading-relaxed text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 rounded-2xl border border-ink bg-yellow p-5">
            <h4 className="text-sm font-bold">What changes because they are here</h4>
            <p className="mt-2 text-sm leading-relaxed">{founder.contribution}</p>
            <p className="mt-3 border-t border-ink/15 pt-3 text-xs leading-relaxed text-muted">
              <strong className="text-ink">Working territory:</strong> {founder.speciality}
            </p>
          </section>

          <section className="mt-8">
            <h4 className="text-sm font-bold">Works closely with</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {founder.worksWith.map((name) => {
                const collaborator = founders.find((member) => member.name === name);
                if (!collaborator) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onSelect(collaborator)}
                    className="rounded-lg border border-line bg-cream px-3 py-2 text-left text-xs font-semibold transition-colors hover:border-ink hover:bg-pink active:translate-y-px"
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </section>

          <nav className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-5" aria-label="Browse team profiles">
            <button
              type="button"
              onClick={() => onSelect(previous)}
              className="rounded-lg border border-line px-4 py-3 text-left text-xs transition-colors hover:border-ink hover:bg-white/50 active:translate-y-px"
            >
              <span className="block text-muted">Previous</span>
              <strong className="mt-1 block leading-tight">{previous.name}</strong>
            </button>
            <button
              type="button"
              onClick={() => onSelect(next)}
              className="rounded-lg border border-line px-4 py-3 text-right text-xs transition-colors hover:border-ink hover:bg-white/50 active:translate-y-px"
            >
              <span className="block text-muted">Next</span>
              <strong className="mt-1 block leading-tight">{next.name}</strong>
            </button>
          </nav>
        </article>
      </div>
    </div>
  );
}
