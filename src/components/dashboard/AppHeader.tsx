"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home09Icon, BubbleChatIcon } from "@hugeicons/core-free-icons";

// Ported from the Figma "MacBook Air - 1" home-screen design
// (node 19:3, https://www.figma.com/design/rStY9cqyzgvCBG2HfnrOfx). The
// rocket/community/profile/search/settings glyphs are the exact vector
// assets from that file (public/assets/nav/*.svg); the design's "AI"
// glyph (a small robot) is intentionally swapped for a chat icon here per
// request, and the home glyph — a bare SF Symbol placeholder in the
// source file with no real asset — uses a hugeicons house instead.
const NAV_ITEMS = [
  { id: "home", href: "/dashboard", label: "Home", render: () => <HugeiconsIcon icon={Home09Icon} size={18} strokeWidth={2} /> },
  { id: "projects", href: "/dashboard/projects", label: "Projects", render: () => <img src="/assets/nav/rocket.svg" alt="" className="h-[18px] w-[18px]" /> },
  { id: "community", href: "/dashboard/community", label: "Community", render: () => <img src="/assets/nav/community.svg" alt="" className="h-[17px] w-[21px]" /> },
  { id: "chat", href: "/dashboard/chat", label: "Chat", render: () => <HugeiconsIcon icon={BubbleChatIcon} size={18} strokeWidth={2} /> },
  { id: "profile", href: "/dashboard/profile", label: "Profile", render: () => <img src="/assets/nav/profile.svg" alt="" className="h-[17px] w-[16px]" /> },
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
              {item.render()}
            </Link>
          );
        })}
      </nav>

      <div className={`flex items-center gap-1 rounded-full p-1 ${glassPill}`}>
        <button type="button" aria-label="Search" className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.06]">
          <img src="/assets/nav/search.svg" alt="" className="h-[18px] w-[18px]" />
        </button>
        <Link
          href="/dashboard/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.06]"
        >
          <img src="/assets/nav/settings.svg" alt="" className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
