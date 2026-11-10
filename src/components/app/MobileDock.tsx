"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
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

type Tray = "labs" | "discover" | "inbox" | "more" | "quick";

const groups: Record<Tray, { title: string; intro: string; items: NavLeaf[] }> = {
  quick: {
    title: "Where to?",
    intro: "Your shortcuts, one gesture away.",
    items: [
      { id: "quick-lab", label: "Start a lab", href: "/labs/new", icon: FolderPlusIcon },
      { id: "quick-search", label: "Find anything", href: "/search", icon: SearchIcon },
      { id: "quick-events", label: "Upcoming events", href: "/events", icon: CalendarIcon },
      { id: "quick-messages", label: "Your messages", href: "/messages", icon: MessageCircleIcon },
    ],
  },
  labs: {
    title: "Make something.",
    intro: "Your ideas have a place to grow.",
    items: [
      { id: "showcase", label: "Showcase", href: "/labs", icon: TelescopeIcon },
      { id: "my-labs", label: "My labs", href: "/labs/mine", icon: FolderHeartIcon },
      { id: "start-lab", label: "Start a lab", href: "/labs/new", icon: FolderPlusIcon },
      { id: "collabs", label: "Collabs", soon: true, icon: UsersRoundIcon },
    ],
  },
  discover: {
    title: "Find your people.",
    intro: "Explore what's happening around TX.",
    items: [
      { id: "spaces", label: "Spaces", href: "/community", icon: UsersIcon },
      { id: "events", label: "Events", href: "/events", icon: CalendarIcon },
      { id: "learn", label: "Learn", href: "/learn", icon: BookOpenIcon },
      { id: "challenges", label: "Challenges", href: "/challenges", icon: FlagIcon },
      { id: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: ChartBarIncreasingIcon },
      { id: "pairing", label: "My pairing", href: "/pairing", icon: UsersRoundIcon },
      { id: "mentorship", label: "Mentorship", soon: true, icon: UsersIcon },
    ],
  },
  inbox: {
    title: "Stay in the loop.",
    intro: "Conversations and updates in one place.",
    items: [
      { id: "messages", label: "Messages", href: "/messages", icon: MessageCircleIcon },
      { id: "notifications", label: "Notifications", href: "/notifications", icon: BellIcon },
    ],
  },
  more: {
    title: "Your corner of TX.",
    intro: "Everything else, right where you need it.",
    items: [
      { id: "search", label: "Search", href: "/search", icon: SearchIcon },
      { id: "profile", label: "Profile", href: "/profile", icon: UserIcon },
      { id: "settings", label: "Settings", href: "/settings", icon: SettingsIcon },
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

function DockItemCard({
  item,
  index,
  onClose,
}: {
  item: NavLeaf;
  index: number;
  onClose: () => void;
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover();
  const Icon = item.icon;
  const palette = [
    { bg: "bg-yellow", iconBox: "bg-white/80 border-ink/40 text-ink", dot: "bg-pink" },
    { bg: "bg-white", iconBox: "bg-pink/20 border-pink text-rose", dot: "bg-yellow" },
    { bg: "bg-pink", iconBox: "bg-white/80 border-ink/40 text-ink", dot: "bg-ink" },
    { bg: "bg-[#e9e8df]", iconBox: "bg-white/80 border-ink/30 text-ink", dot: "bg-rose" },
  ];
  const color = palette[index % 4];

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-xl border shadow-[1px_1px_0_var(--ink)] transition-transform duration-200 group-hover:scale-110 group-active:scale-95 ${color.iconBox}`}
        >
          {Icon ? <Icon ref={ref} size={16} /> : <span className={`h-2 w-2 rounded-full ${color.dot}`} />}
        </span>
        <span
          aria-hidden="true"
          className="text-base font-bold leading-none text-ink/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:translate-y-[-1px] group-hover:text-ink"
        >
          ↗
        </span>
      </div>
      <span className="mt-2 block truncate text-[14px] font-bold tracking-tight text-ink">
        {item.label}
      </span>
    </>
  );

  const baseClass = `group flex min-h-[78px] flex-col justify-between rounded-[20px] border-2 border-ink p-3 text-left transition-all duration-200 active:scale-[.96] shadow-[2px_2px_0_var(--ink)] hover:shadow-[3px_3px_0_var(--ink)] ${color.bg}`;

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={baseClass}
      >
        {content}
      </Link>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.external}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={baseClass}
      >
        {content}
      </a>
    );
  }

  return (
    <div aria-disabled="true" className={`${baseClass} opacity-60 cursor-not-allowed`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-xl border ${color.iconBox}`}>
          {Icon ? <Icon ref={ref} size={16} /> : <span className={`h-2 w-2 rounded-full ${color.dot}`} />}
        </span>
        <span className="rounded-full border border-ink bg-white/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink">
          Soon
        </span>
      </div>
      <span className="mt-2 block truncate text-[14px] font-semibold text-ink">
        {item.label}
      </span>
    </div>
  );
}

function DockTabButton({
  tab,
  selected,
  expanded,
  onOpen,
  onQuick,
}: {
  tab: (typeof tabs)[number];
  selected: boolean;
  expanded: boolean;
  onOpen: () => void;
  onQuick: () => void;
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover();
  const hold = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const Icon = tab.icon;
  useEffect(() => () => window.clearTimeout(hold.current), []);
  const startHold = () => {
    held.current = false;
    window.clearTimeout(hold.current);
    hold.current = window.setTimeout(() => { held.current = true; onQuick(); }, 480);
  };
  const stopHold = () => window.clearTimeout(hold.current);
  const onTap = (event: MouseEvent) => {
    if (held.current) { event.preventDefault(); held.current = false; return; }
    onOpen();
  };

  const content = (
    <>
      <Icon ref={ref} size={22} />
      <span className="mt-0.5 text-[10px] font-bold tracking-tight leading-none">{tab.label}</span>
      {selected && (
        <span
          aria-hidden="true"
          className="absolute -top-1 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-rose shadow-[0_0_6px_var(--rose)]"
        />
      )}
    </>
  );

  const cls = `relative flex h-[56px] min-w-0 flex-col items-center justify-center rounded-[18px] transition-all duration-200 active:scale-95 ${
    selected
      ? "bg-yellow text-ink shadow-[2px_2px_0_var(--ink)] font-bold"
      : "text-cream hover:bg-white/10 hover:text-white"
  }`;

  if (tab.id === "home") {
    return (
      <Link
        href="/home"
        aria-current={selected ? "page" : undefined}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => { if (held.current) { event.preventDefault(); held.current = false; } }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={cls}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onTap}
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={`Open ${tab.label}`}
      aria-expanded={expanded}
      aria-controls="mobile-navigation-sheet"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cls}
    >
      {content}
    </button>
  );
}

export default function MobileDock() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [tray, setTray] = useState<Tray | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const dockTouch = useRef<{ x: number; y: number } | null>(null);

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
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); (dockRef.current?.querySelector<HTMLElement>('[aria-expanded="true"]') ?? dockRef.current?.querySelector<HTMLElement>('[aria-current="page"]'))?.focus(); };
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
            <button type="button" aria-label="Swipe down or tap to close navigation" onClick={() => setTray(null)} onTouchStart={(event) => { dockTouch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={(event) => { if (dockTouch.current && event.changedTouches[0].clientY - dockTouch.current.y > 35) setTray(null); dockTouch.current = null; }} className="mx-auto mb-4 block h-2 w-14 rounded-full bg-ink/25" />
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow text-rose">Explore TeenovateX</p><h2 className="mt-2 font-serif text-[31px] italic leading-none">{groups[tray].title}</h2><p className="mt-2 text-sm text-muted">{groups[tray].intro}</p></div>
              <button ref={closeRef} type="button" onClick={() => setTray(null)} aria-label="Close navigation" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink bg-pink"><XIcon size={20} /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {groups[tray].items.map((item, index) => (
                <DockItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  onClose={() => setTray(null)}
                />
              ))}
            </div>
          </motion.section>
        </>}
      </AnimatePresence>
      <nav ref={dockRef} aria-label="Primary mobile navigation" onTouchStart={(event) => { dockTouch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={(event) => { if (dockTouch.current && dockTouch.current.y - event.changedTouches[0].clientY > 40 && Math.abs(dockTouch.current.x - event.changedTouches[0].clientX) < 80) { event.preventDefault(); setTray("quick"); } dockTouch.current = null; }} className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-[60] grid h-[70px] grid-cols-5 items-center rounded-[25px] border-2 border-ink bg-ink px-1.5 shadow-[0_10px_30px_#26282240] lg:hidden">
        {tabs.map((tab) => (
          <DockTabButton
            key={tab.id}
            tab={tab}
            selected={tray ? tray === tab.id : current === tab.id}
            expanded={tray === tab.id}
            onOpen={() => setTray(tray === tab.id ? null : (tab.id as Tray))}
            onQuick={() => setTray("quick")}
          />
        ))}
      </nav>
    </>
  );
}
