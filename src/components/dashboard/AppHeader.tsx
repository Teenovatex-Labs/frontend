"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LiquidGlassTabBar,
  LiquidGlassIconButton,
  type LiquidGlassTabItem,
} from "@ogtirth/liquid-glass-oss";
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
// solid-color) header background. Swap for an actual screenshot/backdrop of
// the header if one becomes available.
const GLASS_BG = "/assets/nav-glass-bg.png";

// The library's <LiquidGlassTabBar>/<LiquidGlassDock> both hardcode a
// 4-column layout in their shipped CSS (built for exactly 4 destinations),
// so Profile lives with Search/Settings in the icon-button cluster instead
// of forcing a 5th column into a component sized for 4.
const TAB_ITEMS: (LiquidGlassTabItem & { href: string })[] = [
  { id: "home", href: "/dashboard", label: "Home", icon: <NavIcon Icon={HouseIcon} /> },
  { id: "projects", href: "/dashboard/projects", label: "Projects", icon: <NavIcon Icon={RocketIcon} /> },
  { id: "community", href: "/dashboard/community", label: "Community", icon: <NavIcon Icon={UsersIcon} /> },
  { id: "chat", href: "/dashboard/chat", label: "Chat", icon: <NavIcon Icon={MessageCircleIcon} /> },
];

function NavIcon({ Icon }: { Icon: typeof HouseIcon }) {
  const hover = useIconHover();
  return (
    <span onMouseEnter={hover.onMouseEnter} onMouseLeave={hover.onMouseLeave}>
      <Icon ref={hover.ref} size={18} />
    </span>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = TAB_ITEMS.find((item) => item.href === pathname)?.id;

  return (
    <header className="sticky top-0 z-40 grid h-[76px] grid-cols-[1fr_auto_1fr] items-center bg-[#242821] px-6">
      <Link href="/dashboard" className="flex items-center gap-3 justify-self-start">
        <img src="/assets/logo-burgundy.svg" alt="" className="h-9 w-9" />
        <span className="text-[22px] font-bold text-white">Teenovator&rsquo;s Home</span>
      </Link>

      <div className="hidden md:block">
        <LiquidGlassTabBar
          backgroundImage={GLASS_BG}
          variant="dark"
          items={TAB_ITEMS}
          value={activeTab}
          onValueChange={(id) => {
            const item = TAB_ITEMS.find((i) => i.id === id);
            if (item) router.push(item.href);
          }}
          aria-label="Primary navigation"
        />
      </div>

      <div className="flex items-center gap-2 justify-self-end">
        <Link href="/dashboard/profile" aria-label="Profile">
          <LiquidGlassIconButton backgroundImage={GLASS_BG} variant="dark" shape="circle" aria-label="Profile">
            <NavIcon Icon={UserIcon} />
          </LiquidGlassIconButton>
        </Link>
        <LiquidGlassIconButton backgroundImage={GLASS_BG} variant="dark" shape="circle" aria-label="Search">
          <NavIcon Icon={SearchIcon} />
        </LiquidGlassIconButton>
        <Link href="/dashboard/settings" aria-label="Settings">
          <LiquidGlassIconButton backgroundImage={GLASS_BG} variant="dark" shape="circle" aria-label="Settings">
            <NavIcon Icon={SettingsIcon} />
          </LiquidGlassIconButton>
        </Link>
      </div>
    </header>
  );
}
