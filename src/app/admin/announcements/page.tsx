"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { announcementsApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function AnnouncementsAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({ queryKey: keys.admin("announcements"), queryFn: announcementsApi.all });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: keys.admin("announcements") });
    void qc.invalidateQueries({ queryKey: keys.announcements });
  };

  const create = useMutation({
    mutationFn: () => announcementsApi.create({ title: title.trim(), body: body.trim(), link: link.trim() || undefined, expires_at: new Date(Date.now() + days * 86_400_000).toISOString() }),
    onSuccess: () => { setTitle(""); setBody(""); setLink(""); setError(null); toast.success("Posted."); refresh(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't post that."),
  });
  const remove = useMutation({ mutationFn: announcementsApi.remove, onSuccess: refresh, onError: () => toast.error("Couldn't remove that.") });

  const submit = (e: FormEvent) => { e.preventDefault(); setError(null); create.mutate(); };
  const live = (a: { created_at: string; expires_at?: string | null }) =>
    (!a.expires_at || new Date(a.expires_at) > new Date()) && Date.now() - new Date(a.created_at).getTime() < 14 * 86_400_000;

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Announcements</h1>
      <p className="mt-2 text-sm text-muted">Shown as a banner to every member. The newest three live ones show, one at a time.</p>

      <form onSubmit={submit} className="mt-6 grid max-w-[640px] gap-4 border border-ink bg-white p-5">
        <label className="text-sm font-medium">Headline
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="mt-1.5 w-full rounded-md border border-ink bg-cream px-3 py-2" />
        </label>
        <label className="text-sm font-medium">Message
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full rounded-md border border-ink bg-cream px-3 py-2 text-sm" />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="min-w-[200px] flex-1 text-sm font-medium">Link inside the app (optional)
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/events" className="mt-1.5 w-full rounded-md border border-ink bg-cream px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Show for (days)
            <input type="number" min={1} max={14} value={days} onChange={(e) => setDays(Math.min(14, Math.max(1, Number(e.target.value) || 1)))} className="mt-1.5 w-24 rounded-md border border-ink bg-cream px-3 py-2" />
          </label>
        </div>
        {error && <p role="alert" className="text-sm text-rose">{error}</p>}
        <button type="submit" className="btn self-start disabled:opacity-60" disabled={create.isPending || title.trim().length < 3 || body.trim().length < 3}>{create.isPending ? "Posting…" : "Post announcement"}</button>
      </form>

      <div className="mt-8">
        {list.isPending ? <Skeleton className="h-24 w-full" /> : !list.data || list.data.announcements.length === 0 ? (
          <EmptyState title="Nothing posted yet." />
        ) : (
          <ul className="divide-y divide-line border border-ink bg-white">
            {list.data.announcements.map((a) => (
              <li key={a.id} className="flex items-start gap-4 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.title} {live(a) ? <span className="ml-2 rounded-full bg-pink px-2 py-0.5 text-[11px]">live</span> : <span className="ml-2 text-xs text-muted">ended</span>}</p>
                  <p className="text-muted">{a.body}</p>
                  <p className="mt-1 text-xs text-muted">{timeAgo(a.created_at)}{a.link ? ` · ${a.link}` : ""}</p>
                </div>
                <button className="text-rose underline underline-offset-4" onClick={() => remove.mutate(a.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
