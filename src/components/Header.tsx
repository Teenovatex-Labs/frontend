"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#about", label: "About us" },
  { href: "#explore", label: "What we do" },
  { href: "#people", label: "Meet the team" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

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
        <Link
          href="/auth?mode=login"
          onClick={() => setOpen(false)}
          className="py-2 text-sm font-semibold hover:underline hover:underline-offset-8 md:py-0"
        >
          Log in
        </Link>
        <Link
          href="/auth?mode=signup"
          onClick={() => setOpen(false)}
          className="btn mt-2 gap-5 !px-[18px] !py-3 text-sm md:mt-0"
        >
          Sign up <span>↗︎</span>
        </Link>
      </nav>
    </header>
  );
}
