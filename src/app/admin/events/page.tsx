"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { eventAdminApi, eventsApi, type EventItem } from "@/lib/services";
import { keys } from "@/lib/labs";
import { eventDay, eventTime } from "@/lib/dates";
import Tabs from "@/components/ui/Tabs";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

// <input type="datetime-local"> works in the browser's own time zone; the server stores the exact instant.
const toLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Form = { title: string; description: string; starts: string; ends: string; location: string; capacity: string };
const empty: Form = { title: "", description: "", starts: "", ends: "", location: "", capacity: "" };

export default function EventsAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({ queryKey: keys.admin("events", when), queryFn: () => eventsApi.list(when) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] }).then(() => qc.invalidateQueries({ queryKey: ["events"] }));

  const save = useMutation({
    mutationFn: async () => {
      const f = editing!.form;
      const data = {
        title: f.title.trim(),
        description: f.description.trim(),
        starts_at: new Date(f.starts).toISOString(),
        ...(f.ends ? { ends_at: new Date(f.ends).toISOString() } : {}),
        ...(f.location.trim() ? { location: f.location.trim() } : {}),
        ...(f.capacity ? { capacity: Number(f.capacity) } : {}),
      };
      return editing!.id ? eventAdminApi.update(editing!.id, data) : eventAdminApi.create(data);
    },
    onSuccess: () => { toast.success("Saved."); setEditing(null); setError(null); void refresh(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't save that."),
  });
  const remove = useMutation({ mutationFn: eventAdminApi.remove, onSuccess: () => { toast.success("Deleted."); void refresh(); }, onError: () => toast.error("Couldn't delete that.") });

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setEditing((s) => (s ? { ...s, form: { ...s.form, [k]: e.target.value } } : s));
  const open = (e?: EventItem) =>
    setEditing({
      id: e?.id ?? null,
      form: e ? { title: e.title, description: e.description, starts: toLocal(e.starts_at), ends: e.ends_at ? toLocal(e.ends_at) : "", location: e.location ?? "", capacity: e.capacity ? String(e.capacity) : "" } : empty,
    });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const f = editing!.form;
    if (f.title.trim().length < 3) return setError("Give it a title (3+ characters).");
    if (f.description.trim().length < 10) return setError("Describe it in at least 10 characters.");
    if (!f.starts) return setError("Choose when it starts.");
    if (f.ends && new Date(f.ends) <= new Date(f.starts)) return setError("It has to end after it starts.");
    save.mutate();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Events</h1>
        <button className="btn" onClick={() => open()}>New event</button>
      </div>
      <div className="mt-5"><Tabs label="When" value={when} onChange={setWhen} options={[{ id: "upcoming", label: "Upcoming" }, { id: "past", label: "Past" }]} /></div>

      <div className="mt-6">
        {list.isPending ? <Skeleton className="h-40 w-full" /> : !list.data || list.data.events.length === 0 ? (
          <EmptyState title={when === "upcoming" ? "No upcoming events." : "No past events."}>{when === "upcoming" ? "Create one and members can RSVP." : undefined}</EmptyState>
        ) : (
          <ul className="divide-y divide-line border border-ink bg-white">
            {list.data.events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-4 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-muted">{eventDay(e.starts_at)} · {eventTime(e.starts_at)}{e.location ? ` · ${e.location}` : ""}</p>
                </div>
                <span className="text-muted tabular-nums">{e.rsvp_count}{e.capacity ? ` / ${e.capacity}` : ""} going</span>
                <button className="underline underline-offset-4" onClick={() => open(e)}>Edit</button>
                <button className="text-rose underline underline-offset-4" onClick={() => { if (confirm(`Delete "${e.title}"? RSVPs are removed too.`)) remove.mutate(e.id); }}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit event" : "New event"}>
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">Title<input value={editing.form.title} onChange={set("title")} maxLength={120} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2" /></label>
            <label className="block text-sm font-medium">What is it?<textarea value={editing.form.description} onChange={set("description")} rows={3} maxLength={4000} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Starts<input type="datetime-local" value={editing.form.starts} onChange={set("starts")} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" /></label>
              <label className="block text-sm font-medium">Ends (optional)<input type="datetime-local" value={editing.form.ends} onChange={set("ends")} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" /></label>
            </div>
            <label className="block text-sm font-medium">Where (a place or a meeting link)<input value={editing.form.location} onChange={set("location")} maxLength={300} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2" /></label>
            <label className="block text-sm font-medium">Spots (optional)<input type="number" min={1} value={editing.form.capacity} onChange={set("capacity")} className="mt-1.5 w-28 rounded-md border border-ink bg-white px-3 py-2" /></label>
            {error && <p role="alert" className="text-sm text-rose">{error}</p>}
            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn disabled:opacity-60" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
