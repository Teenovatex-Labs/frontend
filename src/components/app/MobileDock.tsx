"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HouseIcon } from "@animateicons/react/lucide/house-icon";
import { RocketIcon } from "@animateicons/react/lucide/rocket-icon";
import { CompassIcon } from "@animateicons/react/lucide/compass-icon";
import { MessageCircleIcon } from "@animateicons/react/lucide/message-circle-icon";
import { LayoutGridIcon } from "@animateicons/react/lucide/layout-grid-icon";
import { XIcon } from "@animateicons/react/lucide/x-icon";
import { TelescopeIcon } from "@animateicons/react/lucide/telescope-icon";
import { FolderPlusIcon } from "@animateicons/react/lucide/folder-plus-icon";
import { FolderHeartIcon } from "@animateicons/react/lucide/folder-heart-icon";
import { UsersRoundIcon } from "@animateicons/react/lucide/users-round-icon";
import { UsersIcon } from "@animateicons/react/lucide/users-icon";
import { CalendarIcon } from "@animateicons/react/lucide/calendar-icon";
import { BookOpenIcon } from "@animateicons/react/lucide/book-open-icon";
import { FlagIcon } from "@animateicons/react/lucide/flag-icon";
import { ChartBarIncreasingIcon } from "@animateicons/react/lucide/chart-bar-increasing-icon";
import { BellIcon } from "@animateicons/react/lucide/bell-icon";
import { SearchIcon } from "@animateicons/react/lucide/search-icon";
import { UserIcon } from "@animateicons/react/lucide/user-icon";
import { SettingsIcon } from "@animateicons/react/lucide/settings-icon";
import useIconHover from "@/lib/useIconHover";
import { MAIN, LINKS, type NavLeaf } from "./nav";

type Tray = "labs" | "discover" | "inbox" | "more";

const groups: Record<Tray, { title: string; intro: string; items: NavLeaf[] }> = {
  labs: {
    title: "Make something.",
    intro: "Your ideas have a place to grow.",
    items: [
      { id: "showcase", label: "Showcase", href: "/labs" },
      { id: "my-labs", label: "My labs", href: "/labs/mine" },
      { id: "start-lab", label: "Start a lab", href: "/labs/new" },
      { id: "collabs", label: "Collabs", soon: true },
    ],
  },
  discover: {
    title: "Find your people.",
    intro: "Explore what's happening around TX.",
    items: [
      { id: "spaces", label: "Spaces", href: "/community" },
      { id: "events", label: "Events", href: "/events" },
      { id: "learn", label: "Learn", href: "/learn" },
      { id: "challenges", label: "Challenges", href: "/challenges" },
      { id: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
      { id: "pairing", label: "My pairing", href: "/pairing" },
      { id: "mentorship", label: "Mentorship", soon: true },
    ],
  },
  inbox: {
    title: "Stay in the loop.",
    intro: "Conversations and updates in one place.",
    items: [
      { id: "messages", label: "Messages", href: "/messages" },
      { id: "notifications", label: "Notifications", href: "/notifications" },
    ],
  },
  more: {
    title: "Your corner of TX.",
    intro: "Everything else, right where you need it.",
    items: [
      { id: "search", label: "Search", href: "/search" },
      { id: "profile", label: "Profile", href: "/profile" },
      { id: "settings", label: "Settings", href: "/settings" },
      ...LINKS,
    ],
  },
};

const tabs = [
  { id: "home", label: "Home", icon: HouseIcon },
  { id: "labs", label: "Labs", icon: RocketIcon },
  { id: "discover", label: "Discover", icon: CompassIcon },
  { id: "inbox", label: "Inbox", icon: MessageCircleIcon },
  { id: "more", label: "More", icon: LayoutGridIcon },
] as const;

function activeTab(pathname: string): string {
  if (pathname === "/home") return "home";
  if (pathname.startsWith("/labs")) return "labs";
  if (pathname.startsWith("/messages") || pathname.startsWith("/notifications")) return "inbox";
  if (MAIN.some((item) => item.id !== "home" && item.id !== "projects" && item.id !== "messages" && item.id !== "notifications" && (item.href && pathname.startsWith(item.href) || item.children?.some((child) => child.href && pathname.startsWith(child.href))))) return "discover";
  return "more";
}

export default function MobileDock() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [tray, setTray] = useState<Tray | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLElement>(null);

  useEffect(() => setTray(null), [pathname]);
  useEffect(() => {
    if (!tray) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setTray(null);
      if (event.key !== "Tab") return;
      const sheet = document.getElementById("mobile-navigation-sheet");
      const focusable = sheet?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); dockRef.current?.querySelector<HTMLElement>('[aria-expanded="true"]')?.focus(); };
  }, [tray]);

  const current = activeTab(pathname);
  return (
    <>
      <AnimatePresence>
        {tray && <>
          <motion.button
            type="button" aria-label="Close navigation" onClick={() => setTray(null)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-[3px] lg:hidden"
          />
          <motion.section
            id="mobile-navigation-sheet" role="dialog" aria-modal="true" aria-label={`${groups[tray].title} navigation`}
            initial={reduce ? false : { y: "105%", opacity: .7 }}
            animate={{ y: 0, opacity: 1 }} exit={reduce ? undefined : { y: "105%", opacity: .7 }}
            transition={{ type: "spring", stiffness: 360, damping: 35, mass: .9 }}
            className="fixed inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-50 max-h-[min(68vh,580px)] overflow-y-auto rounded-[28px] border-2 border-ink bg-cream p-5 shadow-[6px_7px_0_var(--ink)] lg:hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow text-rose">Explore TeenovateX</p><h2 className="mt-2 font-serif text-[31px] italic leading-none">{groups[tray].title}</h2><p className="mt-2 text-sm text-muted">{groups[tray].intro}</p></div>
              <button ref={closeRef} type="button" onClick={() => setTray(null)} aria-label="Close navigation" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink bg-pink"><XIcon size={20} /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {groups[tray].items.map((item, index) => {
                const className = `flex min-h-[68px] flex-col justify-between rounded-[17px] border border-ink p-3.5 text-left text-[15px] font-semibold transition-transform active:scale-[.97] ${index % 4 === 0 ? "bg-yellow" : index % 4 === 1 ? "bg-white" : index % 4 === 2 ? "bg-pink" : "bg-[#e9e8df]"}`;
                return item.href ? <Link key={item.id} href={item.href} onClick={() => setTray(null)} className={className}><span>{item.label}</span><span aria-hidden="true" className="self-end text-lg leading-none">↗</span></Link>
                  : item.external ? <a key={item.id} href={item.external} target="_blank" rel="noopener noreferrer" className={className}><span>{item.label}</span><span aria-hidden="true" className="self-end text-lg leading-none">↗</span></a>
                  : <div key={item.id} aria-disabled="true" className={`${className} opacity-55`}><span>{item.label}</span><span className="self-end text-[10px] uppercase tracking-wider">Soon</span></div>;
              })}
            </div>
          </motion.section>
        </>}
      </AnimatePresence>
      <nav ref={dockRef} aria-label="Primary mobile navigation" className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-[60] grid h-[70px] grid-cols-5 items-center rounded-[25px] border-2 border-ink bg-ink px-1.5 shadow-[0_10px_30px_#26282240] lg:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tray ? tray === tab.id : current === tab.id;
          const content = <><Icon size={23} /><span className="mt-0.5 text-[10px] font-semibold leading-none">{tab.label}</span></>;
          const cls = `relative flex h-[56px] min-w-0 flex-col items-center justify-center rounded-[18px] transition-colors ${selected ? "bg-yellow text-ink" : "text-cream hover:bg-white/10"}`;
          return tab.id === "home" ? <Link key={tab.id} href="/home" aria-current={selected ? "page" : undefined} className={cls}>{content}</Link> : <button key={tab.id} type="button" onClick={() => setTray(tray === tab.id ? null : tab.id as Tray)} aria-label={`Open ${tab.label}`} aria-expanded={tray === tab.id} aria-controls="mobile-navigation-sheet" className={cls}>{content}</button>;
        })}
      </nav>
    </>
  );
}
