"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRightIcon } from "@animateicons/react/lucide/arrow-up-right-icon";
import { ChevronDownIcon } from "@animateicons/react/lucide/chevron-down-icon";
import { ChevronLeftIcon } from "@animateicons/react/lucide/chevron-left-icon";
import { ChevronRightIcon } from "@animateicons/react/lucide/chevron-right-icon";
import { LogOutIcon } from "@animateicons/react/lucide/log-out-icon";
import { SearchIcon } from "@animateicons/react/lucide/search-icon";
import { SettingsIcon } from "@animateicons/react/lucide/settings-icon";
import useIconHover from "@/lib/useIconHover";
import { useAuth } from "@/context/AuthContext";
import { siteUrl } from "@/lib/hosts";
import { LINKS, MAIN, type NavItem, type NavLeaf } from "./nav";

const OUT = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* ---------- hover panels (flyouts + tooltips) rendered in a portal ---------- */

function useHoverPanel<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const timer = useRef<number | undefined>(undefined);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const show = useCallback(() => {
    window.clearTimeout(timer.current);
    const row = ref.current?.getBoundingClientRect();
    if (!row) return;
    // Anchor to the sidebar's outer edge (not the padded row) so panels clear its shadow.
    const edge = ref.current?.closest("aside")?.getBoundingClientRect().right ?? row.right;
    setRect(new DOMRect(row.x, row.y, edge - row.x, row.height));
  }, []);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRect(null), 110);
  }, []);
  const keep = useCallback(() => window.clearTimeout(timer.current), []);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { ref, rect, show, hide, keep };
}

function Floating({
  rect,
  children,
  onEnter,
  onLeave,
}: {
  rect: DOMRect;
  children: ReactNode;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const reduce = useReducedMotion();
  return createPortal(
    <motion.div
      initial={reduce ? false : { opacity: 0, x: -6, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.16 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ position: "fixed", left: rect.right + 16, top: rect.top - 6, transformOrigin: "left top" }}
      className="z-[60]"
    >
      {children}
    </motion.div>,
    document.body
  );
}

function SoonChip() {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-cream/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cream/60">
      Soon
    </span>
  );
}

/* ---------- the dotted tree used by both the inline list and the flyout ---------- */

function Tree({
  items,
  isActive,
  onNavigate,
}: {
  items: NavLeaf[];
  isActive: (l: NavLeaf) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul className="relative">
      {items.map((leaf) => {
        const active = isActive(leaf);
        const inner = (
          <>
            <span
              aria-hidden="true"
              className="absolute -left-[22px] -top-[14px] h-[calc(50%+14px)] w-5 rounded-bl-[14px] border-b-2 border-l-2 border-dotted border-pink/60"
            />
            <span className="truncate">{leaf.label}</span>
            {leaf.soon && <SoonChip />}
          </>
        );
        const cls = `relative flex h-10 items-center gap-2 rounded-xl px-3 text-[14px] transition-colors ${
          active ? "bg-cream/[0.12] font-semibold text-cream" : "text-cream/65 hover:bg-cream/[0.07] hover:text-cream"
        }`;
        return (
          <li key={leaf.id} className="ml-[22px] pl-1.5">
            {leaf.href ? (
              <Link href={leaf.href} onClick={onNavigate} className={cls}>
                {inner}
              </Link>
            ) : (
              <span aria-disabled="true" title="Coming soon" className={`${cls} cursor-default`}>
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- one row of the nav ---------- */

function NavRow({
  item,
  collapsed,
  open,
  active,
  isLeafActive,
  onToggle,
  onExpandFor,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  open: boolean;
  active: boolean;
  isLeafActive: (l: NavLeaf) => boolean;
  onToggle: () => void;
  onExpandFor: () => void;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();
  const hover = useHoverPanel<HTMLDivElement>();
  const icon = useIconHover();
  const accessory = useIconHover();
  const hasChildren = Boolean(item.children?.length);
  const Icon = item.icon;

  const content = (
    <>
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
          className="absolute inset-0 rounded-2xl bg-yellow shadow-[2px_2px_0_var(--pink)]"
        />
      )}
      <span className="relative flex w-full items-center gap-3">
        <Icon ref={icon.ref} size={24} className="shrink-0" />
        <span
          className={`min-w-0 flex-1 truncate whitespace-nowrap text-left text-[15px] font-medium transition-opacity duration-200 ${
            collapsed ? "opacity-0" : "opacity-100 delay-75"
          }`}
        >
          {item.label}
        </span>
        {!collapsed && item.soon && !hasChildren && <SoonChip />}
        {hasChildren && (
          <span
            className={`inline-flex shrink-0 transition-all duration-300 ${collapsed ? "opacity-0" : "opacity-60"} ${open ? "rotate-180" : ""}`}
          >
            <ChevronDownIcon ref={accessory.ref} size={16} />
          </span>
        )}
      </span>
    </>
  );

  const rowCls = `relative flex h-12 w-full items-center overflow-hidden rounded-2xl px-4 transition-colors ${
    active ? "text-ink" : "text-cream/80 hover:bg-cream/[0.08] hover:text-cream"
  }`;

  let row: ReactNode;
  if (item.href) {
    row = (
      <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={rowCls}>
        {content}
      </Link>
    );
  } else if (item.external) {
    row = (
      <a href={item.external} target="_blank" rel="noopener noreferrer" className={rowCls}>
        {content}
        {!collapsed && (
          <span className="ml-2 inline-flex shrink-0 opacity-50">
            <ArrowUpRightIcon ref={accessory.ref} size={14} />
          </span>
        )}
      </a>
    );
  } else if (hasChildren) {
    row = (
      <button
        type="button"
        onClick={collapsed ? onExpandFor : onToggle}
        aria-expanded={collapsed ? undefined : open}
        className={rowCls}
      >
        {content}
      </button>
    );
  } else {
    row = (
      <span aria-disabled="true" title="Coming soon" className={`${rowCls} cursor-default`}>
        {content}
      </span>
    );
  }

  return (
    <li>
      <div
        ref={hover.ref}
        onMouseEnter={() => {
          icon.onMouseEnter();
          accessory.onMouseEnter();
          if (collapsed) hover.show();
        }}
        onMouseLeave={() => {
          icon.onMouseLeave();
          accessory.onMouseLeave();
          if (collapsed) hover.hide();
        }}
        onFocus={icon.onMouseEnter}
        onBlur={icon.onMouseLeave}
      >
        {row}
      </div>

      {collapsed && hover.rect && (
        <Floating rect={hover.rect} onEnter={hover.keep} onLeave={hover.hide}>
          {hasChildren ? (
            <div className="min-w-[210px] rounded-2xl border border-cream/10 bg-ink p-3 pl-4 text-cream shadow-[4px_4px_0_var(--rose)]">
              <p className="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream/50">
                {item.label}
              </p>
              <Tree items={item.children!} isActive={isLeafActive} onNavigate={onNavigate} />
            </div>
          ) : (
            <div className="whitespace-nowrap rounded-xl bg-ink px-3.5 py-2 text-[13px] font-medium text-cream shadow-[3px_3px_0_var(--rose)]">
              {item.label}
              {item.soon && <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-cream/50">Soon</span>}
            </div>
          )}
        </Floating>
      )}

      <AnimatePresence initial={false}>
        {!collapsed && hasChildren && open && (
          <motion.div
            key="tree"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-1 pl-[7px] pt-1">
              <Tree items={item.children!} isActive={isLeafActive} onNavigate={onNavigate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ---------- the sidebar ---------- */

export default function Sidebar({
  collapsed,
  onToggle,
  mobile = false,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isCollapsed = collapsed && !mobile;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>("community");
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const searchIcon = useIconHover();
  const toggleIcon = useIconHover();
  const settingsIcon = useIconHover();
  const backIcon = useIconHover();
  const logoutIcon = useIconHover();
  const cardChevron = useIconHover();
  const [mod, setMod] = useState("⌘");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLeafActive = useCallback(
    (l: NavLeaf) => Boolean(l.href && (pathname === l.href || pathname.startsWith(`${l.href}/`))),
    [pathname]
  );

  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) setMod("Ctrl");
  }, []);

  const focusSearch = useCallback(() => {
    if (isCollapsed) onToggle();
    window.setTimeout(() => inputRef.current?.focus(), isCollapsed ? 260 : 0);
  }, [isCollapsed, onToggle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSearch]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const q = query.trim().toLowerCase();
  const filter = (items: NavItem[]) =>
    !q
      ? items
      : items.flatMap((item) => {
          if (item.label.toLowerCase().includes(q)) return [item];
          const kids = item.children?.filter((c) => c.label.toLowerCase().includes(q));
          return kids?.length ? [{ ...item, children: kids }] : [];
        });
  const main = filter(MAIN);
  const links = filter(LINKS);
  const nothing = q && main.length === 0 && links.length === 0;

  const initials = (user?.full_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const section = (label: string) => (
    <p className="mb-1.5 mt-5 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-cream/40">{label}</p>
  );

  const renderRow = (item: NavItem) => (
    <NavRow
      key={item.id}
      item={item}
      collapsed={isCollapsed}
      open={Boolean(q) || open === item.id}
      active={isLeafActive(item) || Boolean(item.children?.some(isLeafActive))}
      isLeafActive={isLeafActive}
      onToggle={() => setOpen((o) => (o === item.id ? null : item.id))}
      onExpandFor={() => {
        setOpen(item.id);
        onToggle();
      }}
      onNavigate={onNavigate}
    />
  );

  return (
    <aside
      style={{ width: isCollapsed ? 88 : 296 }}
      className={`relative flex h-full flex-col rounded-[32px] bg-ink text-cream shadow-[6px_6px_0_var(--rose)] transition-[width] duration-300 ${OUT} ${
        reduce ? "!transition-none" : ""
      }`}
    >
      {/* brand */}
      <div className="flex h-[76px] shrink-0 items-center px-6 pt-2">
        <Link href="/home" onClick={onNavigate} aria-label="TeenovateX home" className="flex items-center gap-3">
          <img src="/assets/logo-pink-nobg.svg" alt="" className="h-10 w-10 shrink-0" />
          <span
            className={`whitespace-nowrap text-[19px] font-semibold tracking-[-0.03em] transition-opacity duration-200 ${
              isCollapsed ? "opacity-0" : "opacity-100 delay-75"
            }`}
          >
            Teenovate<span className="text-pink">X</span>
          </span>
        </Link>
      </div>

      {!mobile && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          onMouseEnter={toggleIcon.onMouseEnter}
          onMouseLeave={toggleIcon.onMouseLeave}
          className="absolute -right-3.5 top-[31px] z-20 flex h-7 w-7 items-center justify-center rounded-full border border-ink bg-pink text-ink shadow-[2px_2px_0_var(--ink)] transition-transform hover:scale-110 focus-visible:!outline-pink"
        >
          {isCollapsed ? <ChevronRightIcon ref={toggleIcon.ref} size={16} /> : <ChevronLeftIcon ref={toggleIcon.ref} size={16} />}
        </button>
      )}

      {/* search */}
      <div className="px-4">
        <label
          className={`relative flex h-12 cursor-text items-center overflow-hidden rounded-2xl border px-4 transition-colors ${
            isCollapsed ? "border-cream/25 hover:border-pink" : "border-cream/25 focus-within:border-pink"
          }`}
          onClick={isCollapsed ? focusSearch : undefined}
          onMouseEnter={searchIcon.onMouseEnter}
          onMouseLeave={searchIcon.onMouseLeave}
        >
          <SearchIcon ref={searchIcon.ref} size={22} className="shrink-0 text-cream/80" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
            placeholder="Search"
            aria-label="Search the app"
            tabIndex={isCollapsed ? -1 : 0}
            className={`ml-3 min-w-0 flex-1 bg-transparent text-[15px] text-cream placeholder:text-cream/45 focus:outline-none transition-opacity duration-200 ${
              isCollapsed ? "pointer-events-none opacity-0" : "opacity-100 delay-75"
            }`}
          />
          <span
            aria-hidden="true"
            className={`ml-2 flex shrink-0 gap-1 transition-opacity duration-200 ${isCollapsed ? "opacity-0" : "opacity-100 delay-75"}`}
          >
            <kbd className="rounded-md border border-cream/20 bg-cream/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-cream/70">{mod}</kbd>
            <kbd className="rounded-md border border-cream/20 bg-cream/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-cream/70">K</kbd>
          </span>
        </label>
      </div>

      {/* navigation */}
      <nav aria-label="App navigation" className="no-scrollbar mt-1 flex-1 overflow-y-auto px-4 pb-3">
        {main.length > 0 && (
          <>
            {section("Main")}
            <ul className="space-y-1">{main.map(renderRow)}</ul>
          </>
        )}
        {links.length > 0 && (
          <>
            {section("Links")}
            <ul className="space-y-1">{links.map(renderRow)}</ul>
          </>
        )}
        {nothing && (
          <p className="mt-8 px-4 text-sm text-cream/50">
            Nothing matches <span className="text-cream">&ldquo;{query}&rdquo;</span> yet.
          </p>
        )}
      </nav>

      {/* you */}
      <div ref={menuRef} className="relative shrink-0 border-t border-cream/10 p-4">
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="menu"
              initial={reduce ? false : { opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="absolute bottom-[calc(100%-6px)] left-4 z-30 w-[232px] origin-bottom-left rounded-2xl border border-cream/10 bg-ink p-2 shadow-[4px_4px_0_var(--pink)]"
            >
              <span
                role="menuitem"
                aria-disabled="true"
                onMouseEnter={settingsIcon.onMouseEnter}
                onMouseLeave={settingsIcon.onMouseLeave}
                className="flex h-10 cursor-default items-center gap-3 rounded-xl px-3 text-sm text-cream/60"
              >
                <SettingsIcon ref={settingsIcon.ref} size={18} />
                Settings
                <SoonChip />
              </span>
              <a
                role="menuitem"
                href={siteUrl("/")}
                onMouseEnter={backIcon.onMouseEnter}
                onMouseLeave={backIcon.onMouseLeave}
                className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-cream/80 hover:bg-cream/[0.08] hover:text-cream"
              >
                <ArrowUpRightIcon ref={backIcon.ref} size={18} />
                Back to teenovatex.org
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  await logout();
                  window.location.assign(siteUrl("/"));
                }}
                onMouseEnter={logoutIcon.onMouseEnter}
                onMouseLeave={logoutIcon.onMouseLeave}
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-pink hover:bg-pink/10"
              >
                <LogOutIcon ref={logoutIcon.ref} size={18} />
                Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onMouseEnter={cardChevron.onMouseEnter}
          onMouseLeave={cardChevron.onMouseLeave}
          className="flex h-14 w-full items-center overflow-hidden rounded-2xl border border-cream/15 bg-cream/[0.04] px-2 text-left transition-colors hover:border-pink/60"
        >
          {user?.avatar_url && !avatarFailed ? (
            <img
              src={user.avatar_url}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink text-[14px] font-bold text-ink">
              {initials}
            </span>
          )}
          <span
            className={`ml-3 min-w-0 flex-1 leading-tight transition-opacity duration-200 ${isCollapsed ? "opacity-0" : "opacity-100 delay-75"}`}
          >
            <span className="block truncate text-[14px] font-semibold">{user?.full_name}</span>
            <span className="block truncate text-[12px] text-cream/50">@{user?.username}</span>
          </span>
          <span
            className={`mr-1 inline-flex shrink-0 text-cream/50 transition-all duration-300 ${menuOpen ? "" : "rotate-180"} ${isCollapsed ? "opacity-0" : ""}`}
          >
            <ChevronDownIcon ref={cardChevron.ref} size={16} />
          </span>
        </button>
      </div>
    </aside>
  );
}
