"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { labsDeepApi, messagesApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import TextAreaField from "@/components/TextAreaField";
import { useToast } from "@/components/ui/Toast";

export default function TeamTab({ lab, me }: { lab: string; me?: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const team = useQuery({ queryKey: keys.team(lab), queryFn: () => labsDeepApi.team(lab) });
  const refresh = () => qc.invalidateQueries({ queryKey: keys.team(lab) });
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work. Try again.");

  const chat = useMutation({
    mutationFn: () => messagesApi.openLabChat(lab),
    onSuccess: (c) => router.push(`/messages/${c.id}`),
    onError: fail,
  });
  const join = useMutation({
    mutationFn: () => labsDeepApi.join(lab, message.trim() || undefined),
    onSuccess: () => { toast.success("Asked! The owner will see your request."); setAsking(false); setMessage(""); void refresh(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't send that."),
  });
  const answer = useMutation({ mutationFn: (v: { id: string; accept: boolean }) => labsDeepApi.answer(lab, v.id, v.accept), onSuccess: () => { void refresh(); void qc.invalidateQueries({ queryKey: keys.board(lab) }); }, onError: fail });
  const remove = useMutation({ mutationFn: (username: string) => labsDeepApi.removeMember(lab, username), onSuccess: () => { void refresh(); void qc.invalidateQueries({ queryKey: keys.labs }); }, onError: fail });

  if (team.isPending) return <Skeleton className="h-40 w-full" />;
  if (team.isError) return <p className="text-muted">Couldn&rsquo;t load the team.</p>;
  const t = team.data;

  return (
    <div className="space-y-8">
      {t.my_role && (
        <button className="btn-secondary" disabled={chat.isPending} onClick={() => chat.mutate()}>
          {chat.isPending ? "Opening…" : "Open the team chat"} <span aria-hidden="true">↗︎</span>
        </button>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {t.members.map((m) => (
          <li key={m.username} className="flex items-center gap-3 border border-ink bg-white p-3 shadow-[3px_3px_0_var(--ink)]">
            <Avatar name={m.username} src={m.avatar_url} size={40} />
            <div className="min-w-0 flex-1">
              <Link href={`/u/${m.username}`} className="block truncate font-medium hover:underline">@{m.username}</Link>
              <span className="text-xs text-muted">{m.role === "owner" ? "Owner" : "Team member"}</span>
            </div>
            {m.role !== "owner" && (t.my_role === "owner" || m.username === me) && (
              <button type="button" onClick={() => remove.mutate(m.username)} className="text-xs text-rose underline underline-offset-4">{m.username === me ? "Leave" : "Remove"}</button>
            )}
          </li>
        ))}
      </ul>

      {t.my_role === "owner" && t.requests.length > 0 && (
        <section aria-label="Requests to join">
          <h3 className="text-[18px] tracking-[-0.02em]">Asking to join</h3>
          <ul className="mt-3 space-y-3">
            {t.requests.map((r) => (
              <li key={r.id} className="border border-ink bg-yellow/50 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.user.username} src={r.user.avatar_url} size={32} />
                  <Link href={`/u/${r.user.username}`} className="font-medium hover:underline">@{r.user.username}</Link>
                </div>
                {r.message && <p className="mt-2 text-sm">&ldquo;{r.message}&rdquo;</p>}
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-sm" disabled={answer.isPending} onClick={() => answer.mutate({ id: r.id, accept: true })}>Accept</button>
                  <button className="btn-secondary btn-sm" disabled={answer.isPending} onClick={() => answer.mutate({ id: r.id, accept: false })}>Not now</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!t.my_role && me && (
        <section aria-label="Join this lab">
          {t.my_request?.status === "pending" ? (
            <p className="border border-dashed border-ink p-4 text-sm">Your request is in. The owner will get back to you.</p>
          ) : t.my_request?.status === "declined" ? (
            <p className="text-sm text-muted">The owner isn&rsquo;t taking new people right now.</p>
          ) : !asking ? (
            <button className="btn" onClick={() => setAsking(true)}>Ask to join this lab</button>
          ) : (
            <div className="border border-ink bg-white p-5 shadow-[5px_5px_0_var(--ink)]">
              <TextAreaField label="Tell them why you'd be a great teammate (optional)" name="message" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
              {error && <p role="alert" className="mt-3 rounded-md border border-rose bg-rose/[0.08] px-4 py-2.5 text-sm text-rose">{error}</p>}
              <div className="mt-4 flex gap-3">
                <button className="btn disabled:opacity-60" disabled={join.isPending} onClick={() => { setError(null); join.mutate(); }}>{join.isPending ? "Sending…" : "Send request"}</button>
                <button className="btn-secondary" onClick={() => { setAsking(false); setError(null); }}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
