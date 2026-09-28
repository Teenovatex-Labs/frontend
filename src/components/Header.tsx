"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#about", label: "About us", dot: "bg-pink" },
  { href: "#explore", label: "What we do", dot: "bg-yellow" },
  { href: "#people", label: "Meet the team", dot: "bg-ink" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="wrap flex items-center justify-between border-b border-line py-7">
      <Link href="/" aria-label="TeenovateX home" className="flex items-center">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-8 w-auto md:h-9" />
      </Link>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="navigation"
        className="flex items-center gap-3 rounded-md border border-ink px-3.5 py-2 text-sm transition-colors hover:bg-pink md:hidden"
      >
        {open ? "Close" : "Menu"}
        <span
          className={`inline-block text-lg leading-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
            open ? "rotate-45" : "rotate-0"
          }`}
          aria-hidden="true"
        >
          ＋
        </span>
      </button>

      {/* Collapses via grid-template-rows (0fr → 1fr) instead of
          display/height so it can animate smoothly; on desktop the wrapper
          becomes `contents` and gets out of the way entirely, leaving the
          nav to lay out as a plain header child like before. */}
      <div
        className="absolute inset-x-0 top-[89px] z-10 grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,0.68,0,1.01)] md:static md:contents"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className={`min-h-0 overflow-hidden ${open ? "visible" : "invisible"} md:visible md:overflow-visible`}>
          <nav
            id="navigation"
            aria-label="Main navigation"
            className="relative flex flex-col items-stretch gap-1 overflow-hidden border border-ink bg-cream p-6 shadow-[4px_4px_0_var(--pink)] md:relative md:mt-0 md:flex md:flex-row md:items-center md:gap-8 md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:shadow-none"
          >
            {/* A little personality in the corner — only shows on the
                mobile panel, tucked behind the links. */}
            <img
              src="/doodles/notes.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -top-4 w-20 -rotate-6 opacity-25 md:hidden"
            />

            {/* Hand-drawn thread connecting the links, like the About
                section's chapters — loose dashes, not a rigid rule. */}
            <svg
              width="2"
              height="100%"
              className="pointer-events-none absolute left-[7px] top-8 -z-10 h-[calc(100%-64px)] md:hidden"
              aria-hidden="true"
            >
              <line x1="1" y1="0" x2="1" y2="100%" stroke="var(--pink)" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
            </svg>

            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={close}
                style={{ transitionDelay: open ? `${i * 60 + 80}ms` : "0ms" }}
                className={`group flex items-center gap-3 py-2 text-sm font-semibold transition-all duration-300 ease-out md:gap-2 md:py-0 md:transition-none ${
                  open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 md:translate-x-0 md:opacity-100"
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full border border-ink ${link.dot} md:hidden`} aria-hidden="true" />
                <span className="group-hover:text-rose group-hover:underline group-hover:underline-offset-8">
                  {link.label}
                </span>
              </a>
            ))}

            <Link
              href="/auth?mode=login"
              onClick={close}
              style={{ transitionDelay: open ? `${NAV_LINKS.length * 60 + 80}ms` : "0ms" }}
              className={`flex items-center gap-3 py-2 text-sm font-semibold transition-all duration-300 ease-out md:gap-2 md:py-0 md:transition-none ${
                open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 md:translate-x-0 md:opacity-100"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full border border-ink bg-line md:hidden" aria-hidden="true" />
              <span className="hover:underline hover:underline-offset-8">Log in</span>
            </Link>
            <Link
              href="/auth?mode=signup"
              onClick={close}
              style={{ transitionDelay: open ? `${(NAV_LINKS.length + 1) * 60 + 80}ms` : "0ms" }}
              className={`btn mt-3 gap-5 !px-[18px] !py-3 text-sm transition-all duration-300 ease-out md:mt-0 md:transition-none ${
                open ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-95 opacity-0 md:translate-y-0 md:scale-100 md:opacity-100"
              }`}
            >
              Sign up <span>↗︎</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
