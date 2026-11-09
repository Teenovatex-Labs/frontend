"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cohortsApi } from "@/lib/services";
import { keys } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import Dialog from "@/components/ui/Dialog";

const toInput = (iso: string) => iso.slice(0, 16);

export default function WindowsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const windows = useQuery({ queryKey: keys.admin("cohorts"), queryFn: cohortsApi.list });
  const refresh = () => qc.invalidateQueries({ queryKey: keys.admin("cohorts") });
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");

  const [creating, setCreating] = useState(false);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [targetSize, setTargetSize] = useState("");
  const [note, setNote] = useState("");

  const create = useMutation({
    mutationFn: () => cohortsApi.create({
      opens_at: new Date(opensAt).toISOString(),
      closes_at: new Date(closesAt).toISOString(),
      decisions_publish_at: new Date(publishAt).toISOString(),
      target_size: targetSize ? Number(targetSize) : null,
      note: note || null,
    }),
    onSuccess: () => { toast.success("Window created."); setCreating(false); setOpensAt(""); setClosesAt(""); setPublishAt(""); setTargetSize(""); setNote(""); void refresh(); },
    onError: fail,
  });

  const startTest = useMutation({
    mutationFn: () => cohortsApi.createTest(7),
    onSuccess: () => { toast.success("Test window started. Copy its private link below."); void refresh(); },
    onError: fail,
  });
  const [purging, setPurging] = useState<string | null>(null);
  const purge = useMutation({
    mutationFn: (id: string) => cohortsApi.purgeTest(id),
    onSuccess: (r) => { toast.success(`Test window deleted (${r.purged} application${r.purged === 1 ? "" : "s"} removed).`); setPurging(null); void refresh(); },
    onError: fail,
  });
  const copyLink = async (key: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/apply?test=${key}`);
      toast.success("Private test link copied.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it by hand.");
    }
  };

  const [releasing, setReleasing] = useState<string | null>(null);
  const releasingTest = windows.data?.items.find((w) => w.id === releasing)?.is_test ?? false;
  const release = useMutation({
    mutationFn: (id: string) => cohortsApi.release(id),
    onSuccess: (r) => { toast.success(`Released: ${r.released} published, ${r.invited} invited.`); setReleasing(null); void refresh(); },
    onError: fail,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Application windows</h1>
        <div className="flex gap-2">
          <Link href="/admin/applications" className="btn-secondary text-sm">Back to applications</Link>
          <Link href="/admin/applications/history" className="btn-secondary text-sm">History</Link>
          <button onClick={() => startTest.mutate()} disabled={startTest.isPending} className="btn-secondary text-sm disabled:opacity-60">{startTest.isPending ? "Starting…" : "Start test window"}</button>
          <button onClick={() => setCreating(true)} className="btn text-sm">New window</button>
        </div>
      </div>

      <div className="mt-6">
        {windows.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : windows.isError ? (
          <p className="text-muted">Couldn&rsquo;t load windows.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {windows.data.items.map((w) => (
              <div key={w.id} className="rounded-md border border-ink bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {new Date(w.opens_at).toLocaleDateString()} – {new Date(w.closes_at).toLocaleDateString()}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${w.state === "open" ? "bg-yellow" : w.state === "upcoming" ? "bg-cream" : "bg-line"}`}>{w.state}</span>
                      {w.released && <span className="ml-1 rounded-full bg-pink/60 px-2 py-0.5 text-[11px]">released</span>}
                      {w.is_test && <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-cream">TEST</span>}
                    </p>
                    <p className="text-sm text-muted">Decisions publish {new Date(w.decisions_publish_at).toLocaleString()} {w.target_size ? `· target ${w.target_size}` : ""}</p>
                    {w.note && <p className="mt-1 text-sm text-muted">{w.note}</p>}
                    {w.applications && (
                      <p className="mt-1 text-xs text-muted">
                        {Object.entries(w.applications).map(([k, v]) => `${k.replace("_", " ")}: ${v}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!w.released && new Date() >= new Date(w.decisions_publish_at) && (
                      <button onClick={() => setReleasing(w.id)} className="btn-secondary text-sm">Release decisions</button>
                    )}
                    {w.is_test && <button onClick={() => setPurging(w.id)} className="btn-secondary text-sm">Delete test window</button>}
                  </div>
                </div>
                {w.is_test && w.test_key && (
                  <div className="mt-3 rounded-md border border-line bg-cream p-3 text-sm">
                    <p className="font-semibold">Private test link</p>
                    <p className="mt-1 break-all font-mono text-xs">{typeof window !== "undefined" ? window.location.origin : ""}/apply?test={w.test_key}</p>
                    <button onClick={() => void copyLink(w.test_key!)} className="btn-secondary mt-2 text-xs">Copy link</button>
                    <p className="mt-2 text-xs text-muted">
                      Use your own address with a tag, such as you+applicant1@your-domain.com. A test window can only email team addresses, creates no
                      real accounts, and is deleted automatically two weeks after it closes.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={creating} onClose={() => setCreating(false)} title="New application window">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="flex flex-col gap-3">
          <label className="text-sm font-medium">Opens at
            <input type="datetime-local" required value={opensAt} onChange={(e) => setOpensAt(e.target.value)} className="mt-1 w-full rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Closes at
            <input type="datetime-local" required value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="mt-1 w-full rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Decisions publish at
            <input type="datetime-local" required value={publishAt} onChange={(e) => setPublishAt(e.target.value)} className="mt-1 w-full rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Target size (optional)
            <input type="number" min={1} value={targetSize} onChange={(e) => setTargetSize(e.target.value)} className="mt-1 w-full rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <label className="text-sm font-medium">Note (optional)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" disabled={create.isPending} className="btn disabled:opacity-60">{create.isPending ? "Creating…" : "Create window"}</button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!releasing} onClose={() => setReleasing(null)} title="Release decisions">
        {releasingTest ? (
          <p className="text-sm text-muted">This is a test window. The decision emails go to team inboxes only, marked [TEST], and the invitations cannot open an account.</p>
        ) : (
          <p className="text-sm text-muted">This emails every accepted, declined and waitlisted applicant in this window. It cannot be undone.</p>
        )}
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={() => setReleasing(null)}>Cancel</button>
          <button className="btn disabled:opacity-60" disabled={release.isPending} onClick={() => release.mutate(releasing!)}>{release.isPending ? "Releasing…" : "Release now"}</button>
        </div>
      </Dialog>

      <Dialog open={!!purging} onClose={() => setPurging(null)} title="Delete test window">
        <p className="text-sm text-muted">This removes the test window and every test application, answer and file in it. Real windows are never touched. It cannot be undone.</p>
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" onClick={() => setPurging(null)}>Cancel</button>
          <button className="btn disabled:opacity-60" disabled={purge.isPending} onClick={() => purge.mutate(purging!)}>{purge.isPending ? "Deleting…" : "Delete test window"}</button>
        </div>
      </Dialog>
    </>
  );
}
