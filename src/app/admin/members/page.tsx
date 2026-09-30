"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { adminApi, type AdminUser } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const ROLES: AdminUser["role"][] = ["member", "mentor", "moderator", "admin"];

export default function MembersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [days, setDays] = useState(3);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const users = useQuery({ queryKey: keys.admin("users", search), queryFn: () => adminApi.users(search) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");

  const suspend = useMutation({
    mutationFn: () => adminApi.suspend(suspending!.id, { days, reason: reason.trim() }),
    onSuccess: () => { toast.success("Suspended."); setSuspending(null); setReason(""); void refresh(); },
    onError: fail,
  });
  const unsuspend = useMutation({ mutationFn: adminApi.unsuspend, onSuccess: () => { toast.success("Unsuspended."); void refresh(); }, onError: fail });
  const setRole = useMutation({ mutationFn: (v: { id: string; role: AdminUser["role"] }) => adminApi.setRole(v.id, v.role), onSuccess: () => { toast.success("Role updated."); void refresh(); }, onError: fail });

  const paused = (u: AdminUser) => !!u.suspended_until && new Date(u.suspended_until).getTime() > Date.now();

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[44px]">Members</h1>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search by username, name or email" aria-label="Search members" className="mt-5 w-full max-w-[420px] rounded-md border border-ink bg-white px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-rose" />

      <div className="mt-6">
        {users.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : users.isError ? (
          <EmptyState title="That didn't load." />
        ) : users.data.items.length === 0 ? (
          <EmptyState title="No members match." />
        ) : (
          <div className="overflow-x-auto border border-ink bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-ink bg-yellow text-xs uppercase tracking-wide">
                <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Reports</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.data.items.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">@{u.username} {paused(u) && <span className="ml-1 rounded-full bg-pink px-2 py-0.5 text-[11px]">paused</span>}</p>
                      <p className="text-xs text-muted">{u.full_name} · {u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {me?.role === "admin" && u.id !== me.id ? (
                        <select value={u.role} onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value as AdminUser["role"] })} aria-label={`Role for @${u.username}`} className="rounded-md border border-ink bg-cream px-2 py-1">
                          {ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      ) : u.role}
                    </td>
                    <td className={`px-4 py-3 tabular-nums ${u.reports_against > 1 ? "font-semibold text-rose" : ""}`}>{u.reports_against}</td>
                    <td className="px-4 py-3 text-muted">{timeAgo(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {u.id === me?.id ? null : paused(u) ? (
                        <button className="text-rose underline underline-offset-4" onClick={() => unsuspend.mutate(u.id)}>Unsuspend</button>
                      ) : (
                        <button className="text-rose underline underline-offset-4" onClick={() => setSuspending(u)}>Suspend</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!suspending} onClose={() => setSuspending(null)} title={`Suspend @${suspending?.username ?? ""}`}>
        <form onSubmit={(e) => { e.preventDefault(); if (reason.trim().length >= 3) suspend.mutate(); }} className="space-y-4">
          <label className="block text-sm font-medium">For how many days?
            <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} className="mt-1.5 w-28 rounded-md border border-ink bg-white px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">Reason (they will see this)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2 text-sm" />
          </label>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={() => setSuspending(null)}>Cancel</button>
            <button type="submit" className="btn disabled:opacity-60" disabled={suspend.isPending || reason.trim().length < 3}>{suspend.isPending ? "Working…" : "Suspend"}</button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
