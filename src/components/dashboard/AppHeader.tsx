"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { HouseIcon } from "@animateicons/react/lucide/house-icon";
import { RocketIcon } from "@animateicons/react/lucide/rocket-icon";
import { UsersIcon } from "@animateicons/react/lucide/users-icon";
import { MessageCircleIcon } from "@animateicons/react/lucide/message-circle-icon";
import { UserIcon } from "@animateicons/react/lucide/user-icon";
import { SearchIcon } from "@animateicons/react/lucide/search-icon";
import { SettingsIcon } from "@animateicons/react/lucide/settings-icon";
import { OPEN_GLASS_DEFAULTS, openGlassOverlayStyle, type OpenGlassMaterial } from "openglass";
import useIconHover from "@/lib/useIconHover";

// Layout ported from the Figma "MacBook Air - 1" home-screen design
// (node 19:3, https://www.figma.com/design/rStY9cqyzgvCBG2HfnrOfx), but the
// icon glyphs are our own animated set (@animateicons/react, matching every
// other icon in the app) instead of the one-off vectors from that file. The
// design's "AI" glyph (a small robot) is swapped for a chat icon per request.
const NAV_ITEMS = [
  { id: "home", href: "/dashboard", label: "Home", Icon: HouseIcon },
  { id: "projects", href: "/dashboard/projects", label: "Projects", Icon: RocketIcon },
  { id: "community", href: "/dashboard/community", label: "Community", Icon: UsersIcon },
  { id: "chat", href: "/dashboard/chat", label: "Chat", Icon: MessageCircleIcon },
  { id: "profile", href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
] as const;

// A shared glass "material" (see the openglass package) for every pill in
// this header — the rim ring + directional specular glare that reads as a
// real glass edge, not just a blurred tint. `width` only needs to be >=
// `height` for the pill radius clamp below; only `height` is size-specific.
// Reuse this helper for any future toggle/slider glass surfaces too.
function glassMaterial(height: number, overrides: Partial<OpenGlassMaterial> = {}): OpenGlassMaterial {
  return { ...OPEN_GLASS_DEFAULTS, width: 9999, height, borderRadius: 9999, ...overrides };
}

const glassBase = "border border-white/35 bg-white/[0.07] backdrop-blur-[10px] [mix-blend-mode:plus-lighter]";

function GlassOverlay({ height }: { height: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={openGlassOverlayStyle(glassMaterial(height))}
    />
  );
}

// Apple's fluid-interface defaults (WWDC 2018, "Designing Fluid Interfaces"):
// critically damped (no overshoot) for a highlight that's just moving to
// follow selection, not something the user flicked or dragged.
const SPRING = { type: "spring" as const, bounce: 0, duration: 0.4 };
const TAP_SCALE = 0.9;

function NavIcon({ Icon, size }: { Icon: typeof HouseIcon; size: number }) {
  const hover = useIconHover();
  return (
    <motion.span
      className="relative z-10 flex h-full w-full items-center justify-center rounded-full"
      onMouseEnter={hover.onMouseEnter}
      onMouseLeave={hover.onMouseLeave}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
      transition={{ type: "spring", bounce: 0, duration: 0.15 }}
    >
      <Icon ref={hover.ref} size={size} />
    </motion.span>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : SPRING;

  return (
    <header className="sticky top-0 z-40 grid h-[76px] grid-cols-[1fr_auto_1fr] items-center bg-[#242821] px-6">
      <Link href="/dashboard" className="flex items-center gap-3 justify-self-start">
        <img src="/assets/logo-burgundy.svg" alt="" className="h-9 w-9" />
        <span className="text-[22px] font-bold text-white">Teenovator&rsquo;s Home</span>
      </Link>

      <nav className={`relative hidden items-center gap-1.5 rounded-full p-1.5 md:flex ${glassBase}`}>
        <GlassOverlay height={44} />
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex h-11 w-16 items-center justify-center rounded-full text-white"
            >
              {active && (
                // A single shared element that springs from wherever it was
                // to the newly active item — the "segmented control" feel —
                // instead of each pill just popping its own highlight on/off.
                <motion.span
                  layoutId="nav-active-pill"
                  className={`absolute inset-0 overflow-hidden rounded-full ${glassBase}`}
                  transition={transition}
                >
                  <GlassOverlay height={44} />
                </motion.span>
              )}
              <motion.span
                whileTap={reduceMotion ? undefined : { scale: TAP_SCALE }}
                className="relative z-10 flex h-full w-full items-center justify-center"
              >
                <NavIcon Icon={item.Icon} size={22} />
              </motion.span>
            </Link>
          );
        })}
      </nav>

      <div className={`relative flex items-center gap-1.5 rounded-full p-1.5 justify-self-end ${glassBase}`}>
        <GlassOverlay height={44} />
        <motion.button
          type="button"
          aria-label="Search"
          whileTap={reduceMotion ? undefined : { scale: TAP_SCALE }}
          className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full text-white"
        >
          <NavIcon Icon={SearchIcon} size={20} />
        </motion.button>
        <Link href="/dashboard/settings" aria-label="Settings" className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full">
          <motion.span
            whileTap={reduceMotion ? undefined : { scale: TAP_SCALE }}
            className="flex h-full w-full items-center justify-center rounded-full text-white"
          >
            <NavIcon Icon={SettingsIcon} size={20} />
          </motion.span>
        </Link>
      </div>
    </header>
  );
}
