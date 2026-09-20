"use client";

import { useState } from "react";

const NAV_LINKS = [
  { href: "#about", label: "The community" },
  { href: "#explore", label: "The features" },
  { href: "#people", label: "Our people" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="wrap flex items-center justify-between border-b border-line py-7">
      <a href="#" aria-label="TeenovateX home" className="flex items-center gap-2.5">
        <span className="text-[42px] leading-none tracking-[-0.19em] pr-2">
          t<span className="text-[38px] text-rose">×</span>
        </span>
        <span className="font-bold text-2xl tracking-tight">
          teenovate<span className="text-rose">x</span>
          <small className="mt-0.5 block text-[10px] font-semibold tracking-[0.3em]">
            LABS
          </small>
        </span>
      </a>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="navigation"
        className="flex items-center gap-3 rounded-md border border-ink px-3.5 py-2 text-sm md:hidden"
      >
        Menu <span>＋</span>
      </button>

      <nav
        id="navigation"
        aria-label="Main navigation"
        className={`${
          open ? "flex" : "hidden"
        } absolute inset-x-0 top-[89px] z-10 flex-col items-stretch gap-1 border border-ink bg-cream p-6 shadow-[4px_4px_0_var(--pink)] md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="py-2 text-sm font-semibold hover:underline hover:underline-offset-8 md:py-0"
          >
            {link.label}
          </a>
        ))}
        <a href="#join" onClick={() => setOpen(false)} className="btn mt-2 gap-5 !px-[18px] !py-3 text-sm md:mt-0">
          Join us <span>↗︎</span>
        </a>
      </nav>
    </header>
  );
}
