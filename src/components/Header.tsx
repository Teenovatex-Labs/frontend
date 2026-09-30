"use client";

import { appUrl } from "@/lib/hosts";
import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#about", label: "About", dot: "bg-pink" },
  { href: "#explore", label: "What we do", dot: "bg-yellow" },
  { href: "#people", label: "Team", dot: "bg-ink" },
  { href: "#story", label: "Story", dot: "bg-rose" },
  { href: "#donate", label: "Donate", dot: "bg-yellow" },
  { href: "#contact", label: "Contact", dot: "bg-pink" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="wrap flex items-center justify-between border-b border-line py-7 lg:grid lg:grid-cols-[1fr_auto_1fr]">
      <Link href="/" aria-label="TeenovateX home" className="flex items-center">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-8 w-auto lg:h-9" />
      </Link>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="navigation"
        className="flex items-center gap-3 rounded-md border border-ink px-3.5 py-2 text-sm transition-colors hover:bg-pink lg:hidden"
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
          becomes `contents` and gets out of the way entirely, so the links
          nav and the auth buttons become separate columns of the header
          grid (links centred, auth on the right). */}
      <div
        className="absolute inset-x-0 top-[89px] z-10 grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,0.68,0,1.01)] lg:static lg:contents"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className={`min-h-0 overflow-hidden ${open ? "visible" : "invisible"} lg:visible lg:contents`}>
          <div className="relative flex flex-col items-stretch gap-1 overflow-hidden border border-ink bg-cream p-6 shadow-[4px_4px_0_var(--pink)] lg:contents">
            {/* A little personality in the corner — only shows on the
                mobile panel, tucked behind the links. */}
            <img
              src="/doodles/notes.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -top-4 w-20 -rotate-6 opacity-25 lg:hidden"
            />

            {/* Hand-drawn thread connecting the links, like the About
                section's chapters — loose dashes, not a rigid rule. */}
            <svg
              width="2"
              height="100%"
              className="pointer-events-none absolute left-[7px] top-8 -z-10 h-[calc(100%-64px)] lg:hidden"
              aria-hidden="true"
            >
              <line x1="1" y1="0" x2="1" y2="100%" stroke="var(--pink)" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
            </svg>

            <nav
              id="navigation"
              aria-label="Main navigation"
              className="flex flex-col items-stretch gap-1 lg:flex-row lg:items-center lg:gap-7 lg:justify-self-center xl:gap-10"
            >
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  style={{ transitionDelay: open ? `${i * 60 + 80}ms` : "0ms" }}
                  className={`group flex items-center gap-3 py-2 text-sm font-semibold transition-all duration-300 ease-out lg:gap-2 lg:py-0 lg:transition-none ${
                    open ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 lg:translate-x-0 lg:opacity-100"
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full border border-ink ${link.dot} lg:hidden`} aria-hidden="true" />
                  <span className="group-hover:text-rose group-hover:underline group-hover:underline-offset-8">
                    {link.label}
                  </span>
                </a>
              ))}
            </nav>

            <div className="flex flex-col items-stretch gap-1 lg:flex-row lg:items-center lg:gap-6 lg:justify-self-end">
              <Link
                href={appUrl("/auth?mode=login")}
                onClick={close}
                style={{ transitionDelay: open ? `${NAV_LINKS.length * 60 + 80}ms` : "0ms" }}
                className={`btn-secondary btn-sm mt-3 transition-all duration-300 ease-out lg:mt-0 ${
                  open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0 lg:translate-y-0 lg:opacity-100"
                }`}
              >
                Log in
              </Link>
              <Link
                href={appUrl("/auth?mode=signup")}
                onClick={close}
                style={{ transitionDelay: open ? `${(NAV_LINKS.length + 1) * 60 + 80}ms` : "0ms" }}
                className={`btn btn-sm mt-1 transition-all duration-300 ease-out lg:mt-0 ${
                  open ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-95 opacity-0 lg:translate-y-0 lg:scale-100 lg:opacity-100"
                }`}
              >
                Sign up <span>↗︎</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
