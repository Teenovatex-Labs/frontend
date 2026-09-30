"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MenuIcon } from "@animateicons/react/lucide/menu-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import { AlfredProvider } from "@/context/AlfredContext";
import useIconHover from "@/lib/useIconHover";
import Sidebar from "./Sidebar";
import AlfredCompanion from "@/components/alfred/AlfredCompanion";

const STORAGE_KEY = "tx_sidebar_collapsed";

export default function AppShell({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const menuIcon = useIconHover();
  const closeIcon = useIconHover();

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

  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  return (
    <AlfredProvider>
    <div className="min-h-screen" style={{ "--sb": collapsed ? "88px" : "296px" } as CSSProperties}>
      <div className="fixed inset-y-4 left-4 z-40 hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-ink px-5 text-cream lg:hidden">
        <Link href="/home" aria-label="TeenovateX home" className="flex items-center gap-2.5">
          <img src="/assets/logo-pink-nobg.svg" alt="" className="h-8 w-8" />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">
            Teenovate<span className="text-pink">X</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open menu"
          aria-expanded={drawer}
          onMouseEnter={menuIcon.onMouseEnter}
          onMouseLeave={menuIcon.onMouseLeave}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cream/25 hover:border-pink"
        >
          <MenuIcon ref={menuIcon.ref} size={22} />
        </button>
      </header>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={reduce ? false : { x: "-105%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "-105%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-3 left-3 z-50 w-[min(320px,calc(100vw-24px))] lg:hidden"
            >
              <Sidebar collapsed={false} onToggle={toggle} mobile onNavigate={() => setDrawer(false)} />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                onMouseEnter={closeIcon.onMouseEnter}
                onMouseLeave={closeIcon.onMouseLeave}
                className="absolute -right-3 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-ink bg-pink text-ink"
              >
                <XIcon ref={closeIcon.ref} size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[calc(var(--sb)+56px)]">
        {children}
      </div>
    </div>
    <AlfredCompanion />
    </AlfredProvider>
  );
}
