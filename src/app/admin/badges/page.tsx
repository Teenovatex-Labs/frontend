"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, badgesAdminApi, type BadgeDefinition, type BadgeTier } from "@/lib/services";
import { keys } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import Dialog from "@/components/ui/Dialog";
import BadgeArtPicker from "@/components/admin/BadgeArtPicker";
import { badgeArtUrl } from "@/lib/badgeArt";

const TIERS: BadgeTier[] = ["standard", "high", "top"];

export default function BadgesAdminPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");
  const refresh = () => qc.invalidateQueries({ queryKey: keys.admin("badges") });

  const badges = useQuery({ queryKey: keys.admin("badges"), queryFn: badgesAdminApi.list });

  const [creating, setCreating] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState("");
  const [tier, setTier] = useState<BadgeTier>("standard");
  const [art, setArt] = useState<File | null>(null);
  const resetCreate = () => { setCreating(false); setSlug(""); setName(""); setDescription(""); setCriteria(""); setTier("standard"); setArt(null); };
  const create = useMutation({
    mutationFn: async () => {
      const made = await badgesAdminApi.create({ slug, name, description, tier, criteria_text: criteria });
      if (!art) return { art: "none" as const };
      try { await badgesAdminApi.uploadImage(made.id, art); return { art: "ok" as const }; } catch (e) { return { art: "failed" as const, error: e }; }
    },
    onSuccess: (r) => {
      resetCreate();
      void refresh();
      if (r.art === "failed") fail(r.error), toast.error("The badge was created but its artwork didn't upload. Open Edit to try again.");
      else toast.success("Badge created.");
    },
    onError: fail,
  });

  const [editing, setEditing] = useState<BadgeDefinition | null>(null);
  const [eName, setEName] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eCriteria, setECriteria] = useState("");
  const [eTier, setETier] = useState<BadgeTier>("standard");
  const [eArt, setEArt] = useState<File | null>(null);
  const openEdit = (b: BadgeDefinition) => { setEditing(b); setEName(b.name); setEDescription(b.description); setECriteria(b.criteria_text); setETier(b.tier); setEArt(null); };
  const save = useMutation({
    mutationFn: async () => {
      const b = editing!;
      const changed = eName !== b.name || eDescription !== b.description || eCriteria !== b.criteria_text || eTier !== b.tier;
      if (changed) await badgesAdminApi.update(b.id, { name: eName, description: eDescription, criteria_text: eCriteria, tier: eTier });
      if (eArt) await badgesAdminApi.uploadImage(b.id, eArt);
    },
    onSuccess: () => { toast.success("Badge saved."); setEditing(null); setEArt(null); void refresh(); },
    onError: (e) => { fail(e); void refresh(); },
  });

  const toggleActive = useMutation({
    mutationFn: (b: BadgeDefinition) => badgesAdminApi.update(b.id, { active: !b.active }),
    onSuccess: () => void refresh(),
    onError: fail,
  });

  const [awarding, setAwarding] = useState<BadgeDefinition | null>(null);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [pickedUserId, setPickedUserId] = useState<string | null>(null);
  const userSearch = useQuery({ queryKey: keys.admin("badge-award-search", search), queryFn: () => adminApi.users(search), enabled: search.length >= 2 });
  const award = useMutation({
    mutationFn: () => badgesAdminApi.award(awarding!.id, { user_id: pickedUserId!, reason }),
    onSuccess: () => { toast.success("Awarded."); setAwarding(null); setSearch(""); setReason(""); setPickedUserId(null); void refresh(); },
    onError: fail,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Badges</h1>
        <button onClick={() => setCreating(true)} className="btn text-sm">New badge</button>
      </div>

      <div className="mt-6">
        {badges.isPending ? <Skeleton className="h-64 w-full" /> : (
          <div className="flex flex-col gap-3">
            {badges.data?.items.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink bg-white p-4">
                <div className="flex items-center gap-3">
                  {badgeArtUrl(b) ? <img src={badgeArtUrl(b)!} alt="" className="h-12 w-12 rounded-full border border-ink bg-cream object-contain" /> : <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-ink text-[10px] text-muted">No art</span>}
                  <div>
                    <p className="font-semibold">{b.name} <span className="ml-1 rounded-full bg-cream px-2 py-0.5 text-[11px]">{b.tier}</span> {!b.active && <span className="ml-1 rounded-full bg-line px-2 py-0.5 text-[11px]">inactive</span>}</p>
                    <p className="text-sm text-muted">{b.description} · {b.awards} awarded</p>
                  </div>
                </div>
                <div className="flex gap-2 text-sm">
                  <button onClick={() => openEdit(b)} className="btn-secondary text-xs">Edit</button>
                  <button onClick={() => toggleActive.mutate(b)} className="btn-secondary text-xs">{b.active ? "Deactivate" : "Activate"}</button>
                  <button onClick={() => setAwarding(b)} className="btn text-xs">Award</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={creating} onClose={resetCreate} title="New badge">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="flex flex-col gap-3">
          <BadgeArtPicker current={null} file={art} onFile={setArt} />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-like-this" required className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" required rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Criteria (what earns this)" required rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <select value={tier} onChange={(e) => setTier(e.target.value as BadgeTier)} className="rounded-md border border-ink bg-white px-3 py-2 text-sm">
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={resetCreate}>Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn disabled:opacity-60">Create</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? ""}`}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="flex flex-col gap-3">
          <BadgeArtPicker current={editing ? badgeArtUrl(editing) : null} file={eArt} onFile={setEArt} />
          <input value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Name" required minLength={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <textarea value={eDescription} onChange={(e) => setEDescription(e.target.value)} placeholder="Short description" required rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <textarea value={eCriteria} onChange={(e) => setECriteria(e.target.value)} placeholder="Criteria (what earns this)" required minLength={10} rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <select value={eTier} onChange={(e) => setETier(e.target.value as BadgeTier)} className="rounded-md border border-ink bg-white px-3 py-2 text-sm">
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn disabled:opacity-60">Save</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!awarding} onClose={() => setAwarding(null)} title={`Award ${awarding?.name ?? ""}`}>
        <div className="flex flex-col gap-3">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPickedUserId(null); }} placeholder="Search by username or name" className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          {userSearch.data && (
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {userSearch.data.items.map((u) => (
                <button key={u.id} type="button" onClick={() => setPickedUserId(u.id)} className={`rounded-md px-3 py-2 text-left text-sm ${pickedUserId === u.id ? "bg-yellow" : "hover:bg-cream"}`}>
                  @{u.username} <span className="text-muted">({u.full_name})</span>
                </button>
              ))}
            </div>
          )}
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why (required)" rows={2} className="rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setAwarding(null)}>Cancel</button>
            <button type="button" disabled={!pickedUserId || reason.trim().length < 5 || award.isPending} onClick={() => award.mutate()} className="btn disabled:opacity-60">Award</button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
