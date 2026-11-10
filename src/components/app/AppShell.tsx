"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon } from "@animateicons/react/lucide/bell-icon";
import useIconHover from "@/lib/useIconHover";
import { AlfredProvider } from "@/context/AlfredContext";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import MobileDock from "./MobileDock";
import AlfredCompanion from "@/components/alfred/AlfredCompanion";
import LiveUpdates from "./LiveUpdates";
import PromptHost from "./PromptHost";
import SearchLauncher from "./SearchLauncher";

const STORAGE_KEY = "tx_sidebar_collapsed";
const routeNames: Record<string, string> = {
  home: "Your space", labs: "Labs", community: "Community", events: "Events",
  learn: "Learn", challenges: "Challenges", leaderboard: "Leaderboard",
  messages: "Messages", notifications: "Notifications", pairing: "My pairing",
  search: "Search", settings: "Settings", profile: "Your profile",
};

function HeaderIconLink({
  href,
  label,
  icon: Icon,
  className,
}: {
  href: string;
  label: string;
  icon: typeof BellIcon;
  className: string;
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover();
  return (
    <Link
      href={href}
      aria-label={label}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`grid h-11 w-11 place-items-center rounded-full border border-ink/20 shadow-[1px_1px_0_var(--ink)] transition-all active:scale-95 ${className}`}
    >
      <Icon ref={ref} size={20} />
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const section = routeNames[pathname.split("/")[1]] ?? "TeenovateX";
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Storage can be blocked; the sidebar just starts expanded.
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {
        // Not worth failing the toggle over.
      }
      return !c;
    });
  }, []);

  // Accepted applicants finish their first week before entering the member navigation.
  if (user?.membership_status === "onboarding") {
    return (
      <div className="min-h-screen bg-cream">
        <header className="border-b border-ink bg-white px-5 py-3">
          <Link href="/welcome" aria-label="TeenovateX welcome" className="inline-flex min-h-11 items-center gap-2 font-semibold">
            <img src="/assets/logo-pink-nobg.svg" alt="" className="h-9 w-9 rounded-full bg-ink p-1" />
            <span>Teenovate<span className="text-rose">X</span> <span className="font-serif font-normal italic">first week</span></span>
          </Link>
        </header>
        {children}
      </div>
    );
  }

  return (
    <AlfredProvider>
    <div className="min-h-screen" style={{ "--sb": collapsed ? "88px" : "296px" } as CSSProperties}>
      <div className="fixed inset-y-4 left-4 z-40 hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>

      <header className="tx-mobile-topbar sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-ink/10 bg-cream/95 px-4 text-ink backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/home" aria-label="TeenovateX home" className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border border-ink bg-ink shadow-[2px_2px_0_var(--pink)]">
            <img src="/assets/logo-pink-nobg.svg" alt="" className="h-8 w-8" />
          </Link>
          <div className="min-w-0 leading-tight"><p className="text-[9px] font-bold uppercase tracking-[.17em] text-rose">TeenovateX / Member</p><p className="truncate text-[17px] font-semibold tracking-[-.04em]">{section}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <SearchLauncher />
          <HeaderIconLink
            href="/notifications"
            label="Notifications"
            icon={BellIcon}
            className="bg-pink hover:scale-105 hover:border-ink"
          />
        </div>
      </header>
      <MobileDock />
      <div className="tx-mobile-app-shell pb-[calc(104px+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pb-0 lg:pl-[calc(var(--sb)+56px)]">
        <div className="tx-desktop-topbar hidden items-center justify-between gap-6 border-b border-ink/10 px-10 py-5 lg:flex">
          <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-rose" /><span className="text-[11px] font-bold uppercase tracking-[.18em] text-rose">Your world at TX</span><span className="text-ink/35">/</span><span className="text-sm font-semibold">{section}</span></div>
          <div className="flex items-center gap-3 text-sm"><span className="text-muted">{user?.full_name?.split(" ")[0] ? `Good to see you, ${user.full_name.split(" ")[0]}` : "Good to see you"}</span><Link href="/notifications" aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full border border-ink bg-pink transition-transform hover:-translate-y-0.5"><BellIcon size={19} /></Link></div>
        </div>
        {children}
      </div>
    </div>
    <LiveUpdates />
    <AlfredCompanion />
    <PromptHost />
    </AlfredProvider>
  );
}
