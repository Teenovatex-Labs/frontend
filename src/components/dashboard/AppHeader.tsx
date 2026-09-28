"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiquidGlassIconButton } from "@ogtirth/liquid-glass-oss";
import { HouseIcon } from "@animateicons/react/lucide/house-icon";
import { RocketIcon } from "@animateicons/react/lucide/rocket-icon";
import { UsersIcon } from "@animateicons/react/lucide/users-icon";
import { MessageCircleIcon } from "@animateicons/react/lucide/message-circle-icon";
import { UserIcon } from "@animateicons/react/lucide/user-icon";
import { SearchIcon } from "@animateicons/react/lucide/search-icon";
import { SettingsIcon } from "@animateicons/react/lucide/settings-icon";
import useIconHover from "@/lib/useIconHover";

// Every component from @ogtirth/liquid-glass-oss needs a real image behind
// it to refract — a flat brand-ink gradient standing in for our (currently
// solid-color) header background.
const GLASS_BG = "/assets/nav-glass-bg.png";

// LiquidGlassTabBar hardcodes its internal WebGL geometry to a fixed
// 420x72 box divided across exactly 4 columns (src/LiquidGlassTabBar.tsx:
// `BAR_WIDTH = 420`, `BAR_HEIGHT = 72`, both baked into the indicator's
// position math, not read from the DOM) — it cannot host a 5th item or a
// different size without the liquid selection indicator drifting out of
// alignment with the real buttons. LiquidGlassIconButton has no such
// constraint (no pointer-position math tied to a fixed size), so every nav
// destination — plus search and settings — is one, giving one consistent
// icon-only glass button throughout instead of two mismatched components.
const NAV_ITEMS = [
  { id: "home", href: "/dashboard", label: "Home", Icon: HouseIcon },
  { id: "projects", href: "/dashboard/projects", label: "Projects", Icon: RocketIcon },
  { id: "community", href: "/dashboard/community", label: "Community", Icon: UsersIcon },
  { id: "chat", href: "/dashboard/chat", label: "Chat", Icon: MessageCircleIcon },
  { id: "profile", href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
] as const;

// Sized to fill LiquidGlassIconButton's own hit area (see .app-nav-icon-btn
// in globals.css) so hover fires anywhere on the button, not just over the
// icon's own tiny glyph.
function NavIcon({ Icon }: { Icon: typeof HouseIcon }) {
  const hover = useIconHover();
  return (
    <span
      onMouseEnter={hover.onMouseEnter}
      onMouseLeave={hover.onMouseLeave}
      className="flex h-full w-full items-center justify-center"
    >
      <Icon ref={hover.ref} size={20} />
    </span>
  );
}

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 grid h-[76px] grid-cols-[1fr_auto_1fr] items-center bg-[#242821] px-6">
      <Link href="/dashboard" className="flex items-center gap-3 justify-self-start">
        <img src="/assets/logo-burgundy.svg" alt="" className="h-9 w-9" />
        <span className="text-[22px] font-bold text-white">Teenovator&rsquo;s Home</span>
      </Link>

      <nav className="flex items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.id} href={item.href} aria-label={item.label}>
            <LiquidGlassIconButton
              backgroundImage={GLASS_BG}
              variant="dark"
              shape="circle"
              className="app-nav-icon-btn"
              active={pathname === item.href}
              aria-label={item.label}
            >
              <NavIcon Icon={item.Icon} />
            </LiquidGlassIconButton>
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 justify-self-end">
        <LiquidGlassIconButton
          backgroundImage={GLASS_BG}
          variant="dark"
          shape="circle"
          className="app-nav-icon-btn"
          aria-label="Search"
        >
          <NavIcon Icon={SearchIcon} />
        </LiquidGlassIconButton>
        <Link href="/dashboard/settings" aria-label="Settings">
          <LiquidGlassIconButton
            backgroundImage={GLASS_BG}
            variant="dark"
            shape="circle"
            className="app-nav-icon-btn"
            active={pathname === "/dashboard/settings"}
            aria-label="Settings"
          >
            <NavIcon Icon={SettingsIcon} />
          </LiquidGlassIconButton>
        </Link>
      </div>
    </header>
  );
}
