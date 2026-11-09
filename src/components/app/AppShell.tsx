"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { BellIcon } from "@animateicons/react/lucide/bell-icon";
import { SearchIcon } from "@animateicons/react/lucide/search-icon";
import { AlfredProvider } from "@/context/AlfredContext";
import Sidebar from "./Sidebar";
import MobileDock from "./MobileDock";
import AlfredCompanion from "@/components/alfred/AlfredCompanion";
import LiveUpdates from "./LiveUpdates";
import PromptHost from "./PromptHost";

const STORAGE_KEY = "tx_sidebar_collapsed";

export default function AppShell({ children }: { children: ReactNode }) {
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

  return (
    <AlfredProvider>
    <div className="min-h-screen" style={{ "--sb": collapsed ? "88px" : "296px" } as CSSProperties}>
      <div className="fixed inset-y-4 left-4 z-40 hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>

      <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-ink/10 bg-cream/95 px-4 text-ink backdrop-blur-xl lg:hidden">
        <Link href="/home" aria-label="TeenovateX home" className="flex min-h-11 items-center gap-2">
          <img src="/assets/logo-pink-nobg.svg" alt="" className="h-9 w-9 rounded-full border border-ink bg-ink p-1" />
          <span className="text-[17px] font-bold tracking-[-0.045em]">Teenovate<span className="text-rose">X</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="Search" className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 bg-white"><SearchIcon size={20} /></Link>
          <Link href="/notifications" aria-label="Notifications" className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 bg-pink"><BellIcon size={20} /></Link>
        </div>
      </header>
      <MobileDock />
      <div className="tx-mobile-app-shell pb-[calc(104px+env(safe-area-inset-bottom))] transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pb-0 lg:pl-[calc(var(--sb)+56px)]">
        {children}
      </div>
    </div>
    <LiveUpdates />
    <AlfredCompanion />
    <PromptHost />
    </AlfredProvider>
  );
}
