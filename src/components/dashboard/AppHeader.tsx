"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function AppHeader() {
  const pathname = usePathname();

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
              className={`flex h-[30px] w-[50px] items-center justify-center rounded-full text-white transition-colors ${
                active ? glassPill : "hover:bg-white/[0.06]"
              }`}
            >
              <HugeiconsIcon icon={item.icon} size={18} strokeWidth={2} />
            </Link>
          );
        })}
      </nav>

      <div className={`flex items-center gap-1 rounded-full p-1 ${glassPill}`}>
        <button type="button" aria-label="Search" className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.06]">
          <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={2} />
        </button>
        <Link
          href="/dashboard/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.06]"
        >
          <HugeiconsIcon icon={Setting07Icon} size={18} strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
