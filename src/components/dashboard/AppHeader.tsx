"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home09Icon,
  Rocket01Icon,
  UserMultiple02Icon,
  BubbleChatIcon,
  UserIcon,
  Search01Icon,
  Setting07Icon,
} from "@hugeicons/core-free-icons";

// Layout ported from the Figma "MacBook Air - 1" home-screen design
// (node 19:3, https://www.figma.com/design/rStY9cqyzgvCBG2HfnrOfx), but the
// icon glyphs themselves are our own hugeicons set (matching every other
// icon in the app) rather than the one-off vectors from that file. The
// design's "AI" glyph (a small robot) is swapped for a chat icon per request.
const NAV_ITEMS = [
  { id: "home", href: "/dashboard", label: "Home", icon: Home09Icon },
  { id: "projects", href: "/dashboard/projects", label: "Projects", icon: Rocket01Icon },
  { id: "community", href: "/dashboard/community", label: "Community", icon: UserMultiple02Icon },
  { id: "chat", href: "/dashboard/chat", label: "Chat", icon: BubbleChatIcon },
  { id: "profile", href: "/dashboard/profile", label: "Profile", icon: UserIcon },
] as const;

const glassPill =
  "border border-white/35 bg-white/[0.07] backdrop-blur-[8.3px] [mix-blend-mode:plus-lighter] shadow-[-15.764px_-12.949px_48px_-12px_rgba(0,0,0,0.15),-2.627px_-2.158px_12px_-8px_rgba(0,0,0,0.15)]";

// Apple's fluid-interface defaults (WWDC 2018, "Designing Fluid Interfaces"):
// critically damped (no overshoot) for a highlight that's just moving to
// follow selection, not something the user flicked or dragged.
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.4 };
const TAP_SCALE = 0.88;

export default function AppHeader() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : SPRING;

  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between bg-[#242821] px-6">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <img src="/assets/logo-burgundy.svg" alt="" className="h-8 w-8" />
        <span className="text-[20px] font-bold text-white">Teenovator&rsquo;s Home</span>
      </Link>

      <nav className={`hidden items-center gap-1 rounded-full p-1 md:flex ${glassPill}`}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex h-[30px] w-[50px] items-center justify-center rounded-full text-white"
            >
              {active && (
                // A single shared element that springs from wherever it was
                // to the newly active item — the "segmented control" feel —
                // instead of each pill just popping its own highlight on/off.
                <motion.span
                  layoutId="nav-active-pill"
                  className={`absolute inset-0 rounded-full ${glassPill}`}
                  transition={transition}
                />
              )}
              <motion.span
                className="relative z-10 flex items-center justify-center"
                whileTap={reduceMotion ? undefined : { scale: TAP_SCALE }}
                whileHover={active ? undefined : { backgroundColor: "rgba(255,255,255,0.06)" }}
                style={{ width: "100%", height: "100%", borderRadius: 9999 }}
                transition={{ type: "spring", bounce: 0, duration: 0.15 }}
              >
                <HugeiconsIcon icon={item.icon} size={18} strokeWidth={2} />
              </motion.span>
            </Link>
          );
        })}
      </nav>

      <div className={`flex items-center gap-1 rounded-full p-1 ${glassPill}`}>
        <motion.button
          type="button"
          aria-label="Search"
          whileTap={reduceMotion ? undefined : { scale: TAP_SCALE }}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
          transition={{ type: "spring", bounce: 0, duration: 0.15 }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white"
        >
          <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={2} />
        </motion.button>
        <Link href="/dashboard/settings" aria-label="Settings" className="flex h-8 w-8 items-center justify-center rounded-full">
          <motion.span
            className="flex h-full w-full items-center justify-center rounded-full text-white"
            whileTap={reduceMotion ? undefined : { scale: TAP_SCALE }}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.15 }}
          >
            <HugeiconsIcon icon={Setting07Icon} size={18} strokeWidth={2} />
          </motion.span>
        </Link>
      </div>
    </header>
  );
}
