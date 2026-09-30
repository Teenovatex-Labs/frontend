"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { messagesApi, safetyApi, type ChatMessage, type Thread } from "@/lib/services";
import { keys } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ReportButton from "@/components/safety/ReportDialog";
import Composer from "@/components/messages/Composer";
import { useToast } from "@/components/ui/Toast";

const clock = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
};

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // keep the view at the bottom unless the reader scrolled up
  const [support, setSupport] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  // The chat is polled: a full load, then only what is new every few seconds while the tab is open.
  const thread = useQuery({
    queryKey: keys.thread(id),
    queryFn: async (): Promise<Thread> => {
      const prev = qc.getQueryData<Thread>(keys.thread(id));
      const last = prev?.messages.filter((m) => !m.id.startsWith("pending-")).at(-1);
      if (!prev || !last) return messagesApi.thread(id);
      const fresh = await messagesApi.thread(id, { after: last.created_at });
      const known = new Set(prev.messages.map((m) => m.id));
      return { ...fresh, messages: [...prev.messages.filter((m) => !m.id.startsWith("pending-")), ...fresh.messages.filter((m) => !known.has(m.id))] };
    },
    refetchInterval: () => (document.visibilityState === "visible" ? 5_000 : false),
  });

  useEffect(() => {
    void qc.invalidateQueries({ queryKey: keys.inboxChats });
    void qc.invalidateQueries({ queryKey: keys.unreadChats });
  }, [thread.dataUpdatedAt, qc]);

  const send = useMutation({
    mutationFn: (body: string) => messagesApi.send(id, body),
    onMutate: async (body) => {
      setFailed(null);
      const pending: ChatMessage = { id: `pending-${Date.now()}`, body, created_at: new Date().toISOString(), from_me: true };
      qc.setQueryData<Thread>(keys.thread(id), (t) => (t ? { ...t, messages: [...t.messages, pending] } : t));
      stick.current = true;
      return { pending };
    },
    onSuccess: (m, _body, ctx) => {
      if (m.support) setSupport(m.support);
      qc.setQueryData<Thread>(keys.thread(id), (t) => (t ? { ...t, messages: t.messages.map((x) => (x.id === ctx?.pending.id ? m : x)) } : t));
      void qc.invalidateQueries({ queryKey: keys.inboxChats });
    },
    onError: (e, body, ctx) => {
      qc.setQueryData<Thread>(keys.thread(id), (t) => (t ? { ...t, messages: t.messages.filter((x) => x.id !== ctx?.pending.id) } : t));
      // The filter's reason is shown plainly so the writer can fix it and try again.
      setFailed(e instanceof ApiError ? e.message : "That didn't send. Check your connection and try again.");
      void body;
    },
  });

  const unsend = useMutation({
    mutationFn: messagesApi.unsend,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.thread(id) }),
    onError: () => toast.error("Couldn't remove that message."),
  });
  const block = useMutation({
    mutationFn: (username: string) => safetyApi.block(username),
    onSuccess: async (r) => {
      toast.success(r.message);
      await qc.invalidateQueries();
    },
    onError: () => toast.error("Couldn't block them."),
  });

  const messages = thread.data?.messages ?? [];
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (thread.isPending) {
    return (
      <div className="flex-1 space-y-3 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="ml-auto h-10 w-1/2" />
        <Skeleton className="h-10 w-2/5" />
      </div>
    );
  }
  if (thread.isError) {
    const missing = thread.error instanceof ApiError && thread.error.status === 404;
    return (
      <div className="flex-1 p-6">
        <EmptyState title={missing ? "We couldn't find that chat." : "That didn't load."} action={<Link href="/messages" className="btn-secondary">All chats</Link>} />
      </div>
    );
  }

  const t = thread.data;
  const lastMine = [...messages].reverse().find((m) => m.from_me && !m.id.startsWith("pending-"));
  const seen = lastMine && t.other_last_read_at && new Date(t.other_last_read_at) >= new Date(lastMine.created_at);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-ink bg-white px-4 py-3">
        <Link href="/messages" aria-label="Back to chats" className="-ml-1 px-2 text-xl md:hidden">←</Link>
        <Avatar name={t.with.username} src={t.with.avatar_url} size={40} />
        <Link href={`/u/${t.with.username}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">@{t.with.username}</Link>
        <ReportButton targetType="user" targetId={t.with.username} what={`@${t.with.username}`} />
        <button type="button" onClick={() => block.mutate(t.with.username)} disabled={block.isPending} className="text-xs text-muted underline underline-offset-4 hover:text-rose">Block</button>
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-1 overflow-y-auto bg-cream px-4 py-5"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Say hi to @{t.with.username}.</p>}
        {messages.map((m, i) => {
          const showDay = i === 0 || dayLabel(messages[i - 1]!.created_at) !== dayLabel(m.created_at);
          const pending = m.id.startsWith("pending-");
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[11px] uppercase tracking-wide text-muted">{dayLabel(m.created_at)}</p>}
              <div className={`group flex items-end gap-2 ${m.from_me ? "justify-end" : "justify-start"}`}>
                {m.from_me && !pending && (
                  <button type="button" onClick={() => unsend.mutate(m.id)} className="mb-1 hidden text-[11px] text-muted underline underline-offset-4 hover:text-rose group-hover:block">Unsend</button>
                )}
                <p className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${m.from_me ? "rounded-br-sm bg-ink text-cream" : "rounded-bl-sm border border-line bg-white"} ${pending ? "opacity-60" : ""}`}>
                  {m.body}
                  <span className={`ml-2 inline-block text-[10px] ${m.from_me ? "text-cream/75" : "text-muted"}`}>{clock(m.created_at)}</span>
                </p>
                {!m.from_me && (
                  <span className="mb-1 hidden group-hover:block"><ReportButton targetType="message" targetId={m.id} what="this message" className="text-[11px]" /></span>
                )}
              </div>
            </div>
          );
        })}
        {seen && <p className="pr-1 text-right text-[11px] text-muted">Seen</p>}
      </div>

      {support && (
        <div role="status" className="border-t border-ink bg-yellow px-4 py-3 text-sm">
          {support}
          <button type="button" onClick={() => setSupport(null)} className="ml-3 underline underline-offset-4">Dismiss</button>
        </div>
      )}
      {failed && <p role="alert" className="border-t border-rose bg-rose/[0.08] px-4 py-2.5 text-sm text-rose">{failed}</p>}

      {t.can_message ? (
        <Composer onSend={(body) => send.mutate(body)} />
      ) : (
        <p className="border-t border-ink bg-white px-4 py-4 text-center text-sm text-muted">
          You can&rsquo;t send messages to @{t.with.username} right now. Chats need you to follow each other, and neither of you to have blocked the other.
        </p>
      )}
    </>
  );
}
