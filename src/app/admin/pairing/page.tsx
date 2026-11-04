"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, pairingAdminApi, type AdminUser, type Pairing, type PairingStatus } from "@/lib/services";
import { keys } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Dialog from "@/components/ui/Dialog";
import Tabs from "@/components/ui/Tabs";

type Tab = "proposed" | "active" | "closed" | "clearance";
const field = "w-full rounded-md border border-ink bg-white px-3 py-2 text-sm";
const maxEnd = () => new Date(Date.now() + 366 * 86400000).toISOString().slice(0, 10);

function MemberPicker({ label, onPick }: { label: string; onPick: (u: AdminUser) => void }) {
  const [q, setQ] = useState("");
  const found = useQuery({ queryKey: keys.admin("pairing-search", q), queryFn: () => adminApi.users(q), enabled: q.trim().length >= 2 });
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={label} className={field} />
      {found.data && (
        <div className="mt-1 flex max-h-36 flex-col gap-1 overflow-y-auto">
          {found.data.items.map((u) => (
            <button key={u.id} type="button" onClick={() => { onPick(u); setQ(""); }} className="rounded-md px-3 py-1.5 text-left text-sm hover:bg-cream">
              @{u.username} <span className="text-muted">({u.full_name})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PairingAdminPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");
  const refresh = () => qc.invalidateQueries({ queryKey: keys.admin("pairings") });
  const [tab, setTab] = useState<Tab>("proposed");

  const list = useQuery({
    queryKey: keys.admin("pairings", tab),
    queryFn: async () => {
      if (tab === "closed") {
        const [a, b] = await Promise.all([pairingAdminApi.list("closed"), pairingAdminApi.list("cancelled")]);
        return { items: [...a.items, ...b.items] };
      }
      return pairingAdminApi.list(tab as PairingStatus);
    },
    enabled: tab !== "clearance",
  });

  const [creating, setCreating] = useState(false);
  const [members, setMembers] = useState<{ id: string; username: string }[]>([]);
  const [supervisor, setSupervisor] = useState<{ id: string; username: string } | null>(null);
  const [goal, setGoal] = useState("");
  const [rationale, setRationale] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const suggestions = useQuery({
    queryKey: keys.admin("pairing-suggestions", members[0]?.id),
    queryFn: () => pairingAdminApi.suggestions(members[0].id),
    enabled: creating && members.length > 0 && members.length < 3,
    retry: false,
  });
  const addMember = (u: { id: string; username: string }) => setMembers((m) => (m.some((x) => x.id === u.id) || m.length >= 3 ? m : [...m, u]));
  const reset = () => { setCreating(false); setMembers([]); setSupervisor(null); setGoal(""); setRationale(""); setEndsOn(""); };
  const create = useMutation({
    mutationFn: () => pairingAdminApi.create({
      member_ids: members.map((m) => m.id), goal, ends_on: endsOn,
      rationale: rationale.trim() || undefined, supervisor_id: supervisor?.id,
    }),
    onSuccess: (p) => { toast.success(p.status === "active" ? "Pairing is live." : "Proposed. A second admin needs to approve it."); reset(); void refresh(); },
    onError: fail,
  });

  const approve = useMutation({ mutationFn: (id: string) => pairingAdminApi.approve(id), onSuccess: () => { toast.success("Approved. The pairing is live."); void refresh(); }, onError: fail });
  const [closing, setClosing] = useState<Pairing | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const close = useMutation({
    mutationFn: () => pairingAdminApi.close(closing!.id, closeReason),
    onSuccess: () => { toast.success("Closed."); setClosing(null); setCloseReason(""); void refresh(); },
    onError: fail,
  });

  const [adult, setAdult] = useState<AdminUser | null>(null);
  const [note, setNote] = useState("");
  const clear = useMutation({
    mutationFn: (cleared: boolean) => pairingAdminApi.setClearance(adult!.id, cleared, note.trim() || undefined),
    onSuccess: (r) => { toast.success(r.cleared ? `@${adult!.username} is cleared.` : `Clearance removed for @${adult!.username}.`); setAdult(null); setNote(""); },
    onError: fail,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Pairing</h1>
        <button onClick={() => setCreating(true)} className="btn text-sm">New pairing</button>
      </div>
      <div className="mt-5">
        <Tabs label="Pairings" value={tab} onChange={setTab} options={[{ id: "proposed", label: "Awaiting approval" }, { id: "active", label: "Active" }, { id: "closed", label: "Finished" }, { id: "clearance", label: "Safeguarding clearance" }]} />
      </div>

      {tab !== "clearance" && (
        <div className="mt-5">
          {list.isPending ? <Skeleton className="h-48 w-full" /> : list.data?.items.length === 0 ? (
            <EmptyState title="Nothing here." />
          ) : (
            <div className="flex flex-col gap-3">
              {list.data?.items.map((p) => (
                <article key={p.id} className="rounded-md border border-ink bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold">{p.members.map((m) => `@${m.username}`).join(" + ")}</p>
                    <span className="flex gap-1 text-[11px]">
                      <span className="rounded-full bg-cream px-2 py-0.5">{p.kind}</span>
                      {p.supervised && <span className="rounded-full bg-pink px-2 py-0.5">supervised</span>}
                      <span className="rounded-full bg-yellow px-2 py-0.5">{p.status}</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{p.goal}</p>
                  {p.rationale && <p className="mt-1 text-xs text-muted">Why: {p.rationale}</p>}
                  <p className="mt-1 text-xs text-muted">Ends {p.ends_on}{p.closed_reason ? ` · ${p.closed_reason}` : ""}</p>
                  <div className="mt-3 flex gap-2">
                    {p.status === "proposed" && (
                      p.created_by === me?.id
                        ? <p className="text-xs text-muted">You proposed this, so a different admin has to approve it.</p>
                        : <button onClick={() => approve.mutate(p.id)} disabled={approve.isPending} className="btn text-xs">Approve</button>
                    )}
                    {(p.status === "proposed" || p.status === "active") && <button onClick={() => setClosing(p)} className="btn-secondary text-xs">{p.status === "proposed" ? "Cancel" : "Close"}</button>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "clearance" && (
        <section className="mt-5 max-w-[520px]">
          <p className="text-sm text-muted">Only adults can supervise a pairing that includes a minor, and only after you record that they have been vetted.</p>
          <div className="mt-3"><MemberPicker label="Search for an adult by username or name" onPick={(u) => setAdult(u)} /></div>
        </section>
      )}

      <Dialog open={creating} onClose={reset} title="New pairing">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <div>
            <p className="text-sm font-medium">Members (2 or 3)</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {members.map((m) => <button key={m.id} type="button" onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="rounded-full bg-yellow px-3 py-1 text-xs">@{m.username} ✕</button>)}
            </div>
            {members.length < 3 && <div className="mt-2"><MemberPicker label="Search members" onPick={addMember} /></div>}
          </div>
          {members.length > 0 && members.length < 3 && (
            <div className="rounded-md bg-cream p-3 text-sm">
              <p className="font-medium">Suggested for @{members[0].username}</p>
              {suggestions.isPending ? <p className="text-xs text-muted">Looking…</p> : suggestions.isError ? (
                <p className="text-xs text-muted">{suggestions.error instanceof ApiError ? suggestions.error.message : "No suggestions."}</p>
              ) : suggestions.data.items.length === 0 ? <p className="text-xs text-muted">No close matches in the same age band.</p> : (
                <ul className="mt-1 flex flex-col gap-1">
                  {suggestions.data.items.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => addMember(s)} className="text-left hover:underline">
                        @{s.username} <span className="text-xs text-muted">· {[...s.shared_interests, ...s.shared_skills, ...s.they_can_help_with.map((t) => `can help with ${t}`)].slice(0, 4).join(", ")}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <label className="text-sm font-medium">Goal<textarea value={goal} onChange={(e) => setGoal(e.target.value)} required minLength={10} maxLength={300} rows={2} className={`${field} mt-1`} /></label>
          <label className="text-sm font-medium">Why this match (needed if ages differ)<textarea value={rationale} onChange={(e) => setRationale(e.target.value)} maxLength={1500} rows={2} className={`${field} mt-1`} /></label>
          <label className="text-sm font-medium">Ends on<input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} required min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} max={maxEnd()} className={`${field} mt-1`} /></label>
          <div>
            <p className="text-sm font-medium">Supervisor (for a minor paired with an adult)</p>
            {supervisor ? <button type="button" onClick={() => setSupervisor(null)} className="mt-1 rounded-full bg-yellow px-3 py-1 text-xs">@{supervisor.username} ✕</button> : <div className="mt-1"><MemberPicker label="Search a cleared adult" onPick={(u) => setSupervisor(u)} /></div>}
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>
            <button type="submit" disabled={create.isPending || members.length < 2} className="btn disabled:opacity-60">Create</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!closing} onClose={() => setClosing(null)} title={closing?.status === "proposed" ? "Cancel this pairing" : "Close this pairing"}>
        <textarea value={closeReason} onChange={(e) => setCloseReason(e.target.value)} rows={2} placeholder="Reason (required)" className={field} />
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={() => setClosing(null)}>Back</button>
          <button className="btn disabled:opacity-60" disabled={closeReason.trim().length < 5 || close.isPending} onClick={() => close.mutate()}>Confirm</button>
        </div>
      </Dialog>

      <Dialog open={!!adult} onClose={() => setAdult(null)} title={`Safeguarding clearance: @${adult?.username ?? ""}`}>
        <p className="text-sm text-muted">Record that this adult has been vetted, or withdraw it. You can't clear yourself.</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder="Note (optional)" className={`${field} mt-3`} />
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary disabled:opacity-60" disabled={clear.isPending} onClick={() => clear.mutate(false)}>Withdraw clearance</button>
          <button className="btn disabled:opacity-60" disabled={clear.isPending} onClick={() => clear.mutate(true)}>Mark as cleared</button>
        </div>
      </Dialog>
    </>
  );
}
