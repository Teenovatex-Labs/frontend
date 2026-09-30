"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { TASK_COLUMNS, labsDeepApi, type TaskItem, type TaskStatus, type TeamInfo } from "@/lib/services";
import { keys } from "@/lib/labs";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Columns = Record<TaskStatus, TaskItem[]>;

const dueLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const overdue = (t: TaskItem) => !!t.due_at && t.status !== "done" && new Date(t.due_at) < new Date();

export default function BoardTab({ lab, team }: { lab: string; team: TeamInfo["members"] }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);

  const board = useQuery({ queryKey: keys.board(lab), queryFn: () => labsDeepApi.board(lab) });
  const fail = (e: unknown) => {
    toast.error(e instanceof ApiError ? e.message : "That didn't work. Try again.");
    void qc.invalidateQueries({ queryKey: keys.board(lab) });
  };
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: keys.board(lab) });
    void qc.invalidateQueries({ queryKey: keys.myTasks });
  };

  const add = useMutation({ mutationFn: () => labsDeepApi.addTask(lab, { title: title.trim() }), onSuccess: () => { setTitle(""); refresh(); }, onError: fail });
  const remove = useMutation({ mutationFn: (id: string) => labsDeepApi.deleteTask(lab, id), onSuccess: refresh, onError: fail });
  const patch = useMutation({
    mutationFn: (v: { id: string; data: Parameters<typeof labsDeepApi.updateTask>[2] }) => labsDeepApi.updateTask(lab, v.id, v.data),
    // Move the card on screen straight away, then let the server confirm (and put it back if it refuses).
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: keys.board(lab) });
      const before = qc.getQueryData<{ columns: Columns }>(keys.board(lab));
      if (before && data.status) {
        const cols = structuredClone(before.columns);
        let card: TaskItem | undefined;
        for (const c of TASK_COLUMNS) {
          const i = cols[c.id].findIndex((t) => t.id === id);
          if (i >= 0) card = cols[c.id].splice(i, 1)[0];
        }
        if (card) {
          card.status = data.status;
          cols[data.status].splice(Math.min(data.position ?? cols[data.status].length, cols[data.status].length), 0, card);
          qc.setQueryData(keys.board(lab), { columns: cols });
        }
      }
      return { before };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(keys.board(lab), ctx.before);
      fail(e);
    },
    onSettled: refresh,
  });

  const drop = (e: DragEvent, status: TaskStatus, position: number) => {
    e.preventDefault();
    const id = dragId ?? e.dataTransfer.getData("text/plain");
    setDragId(null);
    setOver(null);
    if (id) patch.mutate({ id, data: { status, position } });
  };

  if (board.isPending) return <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}</div>;
  if (board.isError) return <p className="text-muted">Couldn&rsquo;t load the board.</p>;
  const cols = board.data.columns;

  return (
    <div>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (title.trim().length >= 2) add.mutate(); }} className="mb-5 flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task to the backlog" aria-label="New task" maxLength={140} className="flex-1 rounded-md border border-ink bg-white px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-rose" />
        <button type="submit" className="btn" disabled={add.isPending || title.trim().length < 2}>Add</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 min-[1500px]:grid-cols-4">
        {TASK_COLUMNS.map((col) => (
          <section
            key={col.id}
            aria-label={col.label}
            onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
            onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
            onDrop={(e) => drop(e, col.id, cols[col.id].length)}
            className={`min-h-[140px] border p-3 transition-colors ${over === col.id ? "border-ink bg-yellow/60" : "border-line bg-white"}`}
          >
            <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
              {col.label}
              <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-normal tabular-nums">{cols[col.id].length}</span>
            </h3>
            <ul className="space-y-2">
              {cols[col.id].map((t, i) => (
                <li
                  key={t.id}
                  draggable
                  onDragStart={(e) => { setDragId(t.id); e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnd={() => { setDragId(null); setOver(null); }}
                  onDrop={(e) => { e.stopPropagation(); drop(e, col.id, i); }}
                  className={`cursor-grab border bg-cream p-3 text-sm active:cursor-grabbing ${dragId === t.id ? "opacity-40" : ""} ${overdue(t) ? "border-rose" : "border-ink"}`}
                >
                  <p className={t.status === "done" ? "text-muted line-through" : "font-medium"}>{t.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                    {t.due_at && <span className={overdue(t) ? "font-semibold text-rose" : ""}>Due {dueLabel(t.due_at)}</span>}
                    {t.assignee && <span>@{t.assignee}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* The keyboard- and phone-friendly way to move a card; dragging is a bonus on desktop. */}
                    <select
                      value={t.status}
                      aria-label={`Move "${t.title}"`}
                      onChange={(e) => patch.mutate({ id: t.id, data: { status: e.target.value as TaskStatus } })}
                      className="rounded border border-line bg-white px-1.5 py-1 text-[11px]"
                    >
                      {TASK_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <select
                      value={t.assignee ?? ""}
                      aria-label={`Assign "${t.title}"`}
                      onChange={(e) => patch.mutate({ id: t.id, data: { assignee: e.target.value || null } })}
                      className="min-w-0 max-w-[130px] rounded border border-line bg-white px-1.5 py-1 text-[11px]"
                    >
                      <option value="">Unassigned</option>
                      {team.map((m) => <option key={m.username} value={m.username}>@{m.username}</option>)}
                    </select>
                    <input
                      type="date"
                      value={t.due_at ? t.due_at.slice(0, 10) : ""}
                      aria-label={`Due date for "${t.title}"`}
                      onChange={(e) => patch.mutate({ id: t.id, data: { due_at: e.target.value ? new Date(`${e.target.value}T23:59:00`).toISOString() : null } })}
                      className="w-[104px] rounded border border-line bg-white px-1 py-0.5 text-[11px]"
                    />
                    <button type="button" onClick={() => remove.mutate(t.id)} aria-label={`Delete "${t.title}"`} className="ml-auto text-ink/70 hover:text-ink">×</button>
                  </div>
                </li>
              ))}
            </ul>
            {cols[col.id].length === 0 && <p className="text-center text-xs text-muted">Nothing here</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
