"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon, ArrowRight01Icon, Award01Icon, BellIcon, Calendar03Icon,
  CheckmarkCircle02Icon, Clock01Icon, Delete02Icon, FireIcon, Flag01Icon,
  HeartIcon, InformationCircleIcon, Message02Icon, ShieldIcon, SparklesIcon,
  Task01Icon, UserAdd01Icon, UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inboxApi, type Notification } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const kinds = {
  badge: { label: "A new badge", icon: Award01Icon, color: "bg-yellow" },
  message: { label: "A conversation", icon: Message02Icon, color: "bg-pink" },
  mention: { label: "You were mentioned", icon: Message02Icon, color: "bg-pink" },
  comment: { label: "A reply", icon: Message02Icon, color: "bg-pink" },
  application: { label: "Admissions", icon: SparklesIcon, color: "bg-[#d9d6f2]" },
  event: { label: "An event", icon: Calendar03Icon, color: "bg-[#d7ead8]" },
  deadline: { label: "A heads-up", icon: Clock01Icon, color: "bg-yellow" },
  vote: { label: "Your work got love", icon: HeartIcon, color: "bg-pink" },
  streak: { label: "Your streak", icon: FireIcon, color: "bg-yellow" },
  milestone: { label: "A milestone", icon: Flag01Icon, color: "bg-[#d7ead8]" },
  task: { label: "A task", icon: Task01Icon, color: "bg-[#d7ead8]" },
  challenge: { label: "A challenge", icon: Flag01Icon, color: "bg-yellow" },
  pairing: { label: "Your pairing", icon: UserGroupIcon, color: "bg-[#d9d6f2]" },
  join_request: { label: "A team update", icon: UserAdd01Icon, color: "bg-[#d7ead8]" },
  membership: { label: "Your membership", icon: ShieldIcon, color: "bg-[#d9d6f2]" },
  moderation: { label: "From the team", icon: Alert02Icon, color: "bg-pink" },
  system: { label: "From TeenovateX", icon: BellIcon, color: "bg-yellow" },
} as const;
const fallback = { label: "An update", icon: InformationCircleIcon, color: "bg-yellow" };
const kindOf = (type: string) => kinds[type as keyof typeof kinds] ?? fallback;

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const reduced = useReducedMotion();
  const inbox = useQuery({ queryKey: keys.inbox, queryFn: inboxApi.list });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: keys.inbox });
    void qc.invalidateQueries({ queryKey: keys.unread });
  };
  const fail = () => toast.error("That didn't work. Try again.");
  const readOne = useMutation({ mutationFn: inboxApi.read, onSuccess: refresh, onError: fail });
  const readAll = useMutation({ mutationFn: inboxApi.readAll, onSuccess: refresh, onError: fail });
  const remove = useMutation({ mutationFn: inboxApi.remove, onSuccess: refresh, onError: fail });
  const open = (n: Notification) => {
    if (!n.read) readOne.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  const items = inbox.data ?? [];
  const fresh = items.filter((n) => !n.read);
  const seen = items.filter((n) => n.read);
  const sections = filter === "unread"
    ? [{ title: "Still waiting for you", number: "01", items: fresh }]
    : [
        { title: "Still waiting for you", number: "01", items: fresh },
        { title: "Already seen", number: fresh.length ? "02" : "01", items: seen },
      ].filter((section) => section.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-[1020px] px-4 pb-16 pt-8 sm:px-6 md:px-10 md:pb-24 md:pt-14">
      <header className="relative isolate overflow-hidden rounded-[26px] border-2 border-ink bg-ink px-6 py-8 text-cream shadow-[7px_7px_0_var(--pink)] sm:px-8 md:px-10 md:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full border-[32px] border-pink/20 sm:right-8 sm:h-80 sm:w-80" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-12 -z-10 h-56 w-56 rounded-full border-[26px] border-yellow/15" />
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[650px]">
            <p className="text-[11px] font-bold uppercase tracking-[.22em] text-pink">Your TeenovateX inbox <span className="ml-2 text-cream/45">/ 001</span></p>
            <h1 className="mt-4 text-[clamp(45px,9vw,76px)] leading-[.95] tracking-[-.065em]">In your <span className="font-serif font-normal italic text-yellow">orbit.</span></h1>
            <p className="mt-5 max-w-[510px] text-sm leading-relaxed text-cream/75 sm:text-base">Little wins, new conversations, and the things worth catching up on. All in one place.</p>
          </div>
          <div className="flex min-w-[150px] items-end gap-3 rounded-[18px] border border-cream/40 bg-cream/10 px-5 py-4 backdrop-blur-sm">
            <span className="text-[54px] font-semibold leading-none tracking-[-.08em] text-yellow">{fresh.length}</span>
            <span className="pb-1 text-[11px] font-bold uppercase leading-tight tracking-[.13em] text-cream/75">{fresh.length === 1 ? "new thing" : "new things"}<br />for you</span>
          </div>
        </div>
      </header>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4 md:mt-12">
        <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-rose">The feed</p><h2 className="mt-1 text-[30px] tracking-[-.045em] md:text-[38px]">What&rsquo;s happening.</h2></div>
        {fresh.length > 0 && <button type="button" onClick={() => readAll.mutate()} disabled={readAll.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink bg-yellow px-4 text-xs font-semibold transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)] disabled:opacity-50"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={17} strokeWidth={1.9} />Mark all as read</button>}
      </div>

      <div className="mt-5 flex items-center gap-2" role="group" aria-label="Filter notifications">
        {(["all", "unread"] as const).map((tab) => <button key={tab} type="button" onClick={() => setFilter(tab)} aria-pressed={filter === tab} className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-ink px-4 text-sm font-semibold transition-colors duration-200 ${filter === tab ? "bg-ink text-cream" : "bg-white hover:bg-yellow"}`}>
          {tab === "all" ? "Everything" : "Unread"}<span className={`rounded-full px-2 py-0.5 text-[11px] ${filter === tab ? "bg-cream/20" : "bg-ink/10"}`}>{tab === "all" ? items.length : fresh.length}</span>
        </button>)}
      </div>
      <p className="mt-3 text-xs text-muted sm:hidden">Swipe right to mark an update as read. Swipe left to dismiss it.</p>

      <div className="mt-8">
        {inbox.isPending ? <div className="space-y-4" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-[20px]" />)}</div>
        : inbox.isError ? <div className="rounded-[22px] border-2 border-ink bg-white p-8 text-center shadow-[5px_5px_0_var(--ink)]"><p className="text-2xl font-semibold">Your inbox took a breather.</p><p className="mt-2 text-sm text-muted">We couldn&rsquo;t load your updates just now.</p><button type="button" className="btn-secondary btn-sm mt-5" onClick={() => inbox.refetch()}>Try again</button></div>
        : items.length === 0 || (filter === "unread" && fresh.length === 0) ? <div className="relative overflow-hidden rounded-[22px] border-2 border-ink bg-yellow px-6 py-12 text-center shadow-[5px_5px_0_var(--ink)]">
            <span aria-hidden="true" className="mx-auto grid h-20 w-20 -rotate-6 place-items-center rounded-[22px] border-2 border-ink bg-pink shadow-[4px_4px_0_var(--ink)]"><HugeiconsIcon icon={SparklesIcon} size={38} strokeWidth={1.6} /></span>
            <h3 className="mt-7 text-[29px] tracking-tight">{items.length ? "All caught up." : "Quiet in here. For now."}</h3>
            <p className="mx-auto mt-2 max-w-[390px] text-sm text-muted">{items.length ? "You’ve seen everything. Good moment to go make something." : "When your work gets love or your crew reaches out, you’ll find it here."}</p>
            {items.length ? <button type="button" className="btn btn-sm mt-6" onClick={() => setFilter("all")}>See all updates</button> : <Link href="/labs" className="btn btn-sm mt-6">Explore labs</Link>}
          </div>
        : <div className="space-y-10">{sections.map((section) => <section key={section.title} aria-label={section.title}>
            <div className="mb-4 flex items-center gap-3"><span className="text-[11px] font-bold tracking-[.18em] text-rose">{section.number}</span><h3 className="text-lg tracking-[-.025em]">{section.title}</h3><span aria-hidden="true" className="h-px flex-1 bg-ink/25" /><span className="text-xs font-semibold text-muted">{section.items.length}</span></div>
            <ul className="space-y-3">{section.items.map((n, index) => {
              const kind = kindOf(n.type);
              return <motion.li key={n.id} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: Math.min(index, 6) * 0.035, ease: [0.22, 1, 0.36, 1] }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={(_, info) => { if (!window.matchMedia("(max-width: 639px)").matches) return; if (info.offset.x > 100 && !n.read) readOne.mutate(n.id); if (info.offset.x < -100) remove.mutate(n.id); }} style={{ touchAction: "pan-y" }} className={`group relative flex items-start gap-4 overflow-hidden rounded-[20px] border-2 border-ink p-4 transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink)] sm:items-center sm:gap-5 sm:p-5 ${n.read ? "bg-[#f5f1e8]" : "bg-white shadow-[4px_4px_0_var(--pink)]"}`}>
                {!n.read && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-rose" />}
                <div aria-hidden="true" className={`grid h-14 w-14 shrink-0 -rotate-3 place-items-center rounded-[16px] border-2 border-ink shadow-[3px_3px_0_var(--ink)] transition-transform duration-300 group-hover:rotate-0 sm:h-16 sm:w-16 ${kind.color}`}><HugeiconsIcon icon={kind.icon} size={28} strokeWidth={1.75} /></div>
                <button type="button" onClick={() => open(n)} disabled={n.read && !n.link} className="min-w-0 flex-1 text-left disabled:cursor-default" aria-label={`${n.read ? "" : "Unread: "}${n.message}${n.link ? ". Open update" : ""}`}>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-rose">{kind.label}</span>{!n.read && <span className="rounded-full bg-rose px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.12em] text-white">New</span>}</span>
                  <span className={`mt-1.5 block text-[15px] leading-snug sm:text-[17px] ${n.read ? "text-ink/75" : "font-semibold text-ink"}`}>{n.message}</span>
                  <span className="mt-2 flex items-center gap-2 text-xs text-muted">{timeAgo(n.created_at)}{n.link && <span className="inline-flex items-center gap-1 font-semibold text-rose transition-[gap] duration-200 group-hover:gap-2">View update <HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={1.8} /></span>}</span>
                </button>
                <button type="button" onClick={() => remove.mutate(n.id)} disabled={remove.isPending} aria-label="Dismiss notification" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-transparent text-ink/50 transition-colors hover:border-ink hover:bg-pink hover:text-ink disabled:opacity-40"><HugeiconsIcon icon={Delete02Icon} size={17} strokeWidth={1.8} /></button>
              </motion.li>;
            })}</ul>
          </section>)}</div>}
      </div>
    </main>
  );
}
