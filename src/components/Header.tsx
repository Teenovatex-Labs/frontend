"use client";

import { appUrl } from "@/lib/hosts";
import { useState, type ComponentType, type RefAttributes } from "react";
import Link from "next/link";
import type { IconHandle } from "@animateicons/react";
import { InfoIcon } from "@animateicons/react/lucide/info-icon";
import { CompassIcon } from "@animateicons/react/lucide/compass-icon";
import { UsersIcon } from "@animateicons/react/lucide/users-icon";
import { BookOpenIcon } from "@animateicons/react/lucide/book-open-icon";
import { HeartIcon } from "@animateicons/react/lucide/heart-icon";
import { MailIcon } from "@animateicons/react/lucide/mail-icon";
import { LogInIcon } from "@animateicons/react/lucide/log-in-icon";
import { UserPlusIcon } from "@animateicons/react/lucide/user-plus-icon";
import useIconHover from "@/lib/useIconHover";

type AnimatedIconProps = { size?: number; className?: string };
type AnimatedIconComponent = ComponentType<AnimatedIconProps & RefAttributes<IconHandle>>;

type NavItem = {
  href: string;
  label: string;
  dot: string;
  iconBg: string;
  icon: AnimatedIconComponent;
  badge?: string;
};

const NAV_LINKS: NavItem[] = [
  { href: "/#about", label: "About", dot: "bg-pink", iconBg: "bg-pink/20 text-rose border-pink", icon: InfoIcon },
  { href: "/#explore", label: "What we do", dot: "bg-yellow", iconBg: "bg-yellow/30 text-ink border-yellow", icon: CompassIcon },
  { href: "/#people", label: "Team", dot: "bg-ink", iconBg: "bg-ink/10 text-ink border-line", icon: UsersIcon },
  { href: "/story", label: "Story", dot: "bg-rose", iconBg: "bg-rose/15 text-rose border-pink", icon: BookOpenIcon },
  { href: "/#donate", label: "Donate", dot: "bg-yellow", iconBg: "bg-yellow/30 text-rose border-yellow", icon: HeartIcon, badge: "Support" },
  { href: "/contact", label: "Contact", dot: "bg-pink", iconBg: "bg-pink/20 text-ink border-pink", icon: MailIcon },
];

function NavLinkItem({
  link,
  index,
  isOpen,
  onClose,
}: {
  link: NavItem;
  index: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover();
  const Icon = link.icon;

  return (
    <a
      href={link.href}
      onClick={onClose}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ transitionDelay: isOpen ? `${index * 50 + 60}ms` : "0ms" }}
      className={`group relative flex items-center justify-between rounded-xl border border-transparent p-2 text-sm font-semibold transition-all duration-300 ease-out hover:border-ink hover:bg-white/70 hover:shadow-[3px_3px_0_var(--ink)] lg:justify-start lg:rounded-none lg:border-none lg:p-0 lg:py-1 lg:hover:bg-transparent lg:hover:shadow-none ${
        isOpen ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0 lg:translate-x-0 lg:opacity-100"
      }`}
    >
      <div className="flex items-center gap-3 lg:gap-2">
        {/* Animated icon badge container for mobile view */}
        <span
          className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border shadow-[1px_1px_0_var(--ink)] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-[-4deg] group-active:scale-95 lg:hidden ${link.iconBg}`}
          aria-hidden="true"
        >
          <Icon ref={ref} size={18} />
          <span
            className={`absolute -right-1 -top-1 h-2 w-2 rounded-full border border-ink ${link.dot}`}
            aria-hidden="true"
          />
        </span>

        {/* Label & indicator */}
        <span className="relative text-ink transition-colors duration-200 group-hover:text-rose">
          {link.label}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 hidden h-[2px] w-full origin-left scale-x-0 rounded-full bg-rose transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 lg:block"
          />
        </span>
      </div>

      {/* Right accessory for mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        {link.badge && (
          <span className="rounded-full border border-ink bg-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow-[1px_1px_0_var(--ink)]">
            {link.badge}
          </span>
        )}
        <span
          aria-hidden="true"
          className="text-base text-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-rose"
        >
          →
        </span>
      </div>
    </a>
  );
}

function MobileAuthButton({
  href,
  label,
  icon: Icon,
  variant,
  delay,
  isOpen,
  onClose,
}: {
  href: string;
  label: string;
  icon: AnimatedIconComponent;
  variant: "primary" | "secondary";
  delay: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover();

  return (
    <Link
      href={href}
      onClick={onClose}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ transitionDelay: isOpen ? delay : "0ms" }}
      className={`${
        variant === "primary" ? "btn" : "btn-secondary"
      } btn-sm flex items-center justify-center gap-2 transition-all duration-300 ease-out ${
        isOpen
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 lg:translate-y-0 lg:opacity-100"
      }`}
    >
      <Icon ref={ref} size={15} />
      <span>{label}</span>
      {variant === "primary" && <span aria-hidden="true">↗︎</span>}
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-cream/90 backdrop-blur-md supports-[backdrop-filter]:bg-cream/80">
      <div className="wrap flex h-[var(--header-h)] items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]">
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
          className="absolute inset-x-0 top-[var(--header-h)] z-10 grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,0.68,0,1.01)] lg:static lg:contents"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className={`min-h-0 overflow-hidden ${open ? "visible" : "invisible"} lg:visible lg:contents`}>
            <div className="relative flex flex-col items-stretch gap-2 overflow-hidden border border-ink bg-cream p-5 shadow-[4px_4px_0_var(--pink)] lg:contents">
              {/* Personality doodled notes behind links */}
              <img
                src="/doodles/notes.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-4 -top-4 w-24 -rotate-6 opacity-25 lg:hidden"
              />

              {/* Hand-drawn thread connecting the links */}
              <svg
                width="2"
                height="100%"
                className="pointer-events-none absolute left-[26px] top-9 -z-10 h-[calc(100%-80px)] lg:hidden"
                aria-hidden="true"
              >
                <line
                  x1="1"
                  y1="0"
                  x2="1"
                  y2="100%"
                  stroke="var(--pink)"
                  strokeWidth="2"
                  strokeDasharray="2 6"
                  strokeLinecap="round"
                />
              </svg>

              <nav
                id="navigation"
                aria-label="Main navigation"
                className="flex flex-col items-stretch gap-1.5 lg:flex-row lg:items-center lg:gap-7 lg:justify-self-center xl:gap-10"
              >
                {NAV_LINKS.map((link, i) => (
                  <NavLinkItem
                    key={link.href}
                    link={link}
                    index={i}
                    isOpen={open}
                    onClose={close}
                  />
                ))}
              </nav>

              <div className="mt-2 flex flex-col items-stretch gap-2 border-t border-line/60 pt-3 lg:mt-0 lg:flex-row lg:items-center lg:gap-6 lg:border-t-0 lg:pt-0 lg:justify-self-end">
                <MobileAuthButton
                  href={appUrl("/auth?mode=login")}
                  label="Log in"
                  icon={LogInIcon}
                  variant="secondary"
                  delay={`${NAV_LINKS.length * 50 + 70}ms`}
                  isOpen={open}
                  onClose={close}
                />
                <MobileAuthButton
                  href="/apply"
                  label="Apply to join"
                  icon={UserPlusIcon}
                  variant="primary"
                  delay={`${(NAV_LINKS.length + 1) * 50 + 70}ms`}
                  isOpen={open}
                  onClose={close}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
