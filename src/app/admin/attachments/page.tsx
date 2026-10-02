"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { imageReviewApi, type ReviewImage } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";

type Status = "pending" | "approved" | "rejected";

function ImageCard({ a, onDone }: { a: ReviewImage; onDone: () => void }) {
  const toast = useToast();
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [note, setNote] = useState("");
  const [escalate, setEscalate] = useState(false);
  const [suspend, setSuspend] = useState(false);

  const act = useMutation({
    mutationFn: (data: Parameters<typeof imageReviewApi.review>[1]) => imageReviewApi.review(a.id, data),
    onSuccess: (_r, v) => {
      toast.success(v.action === "approve" ? "Approved." : "Removed.");
      onDone();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't do that. Try again."),
  });

  return (
    <li className="border border-ink bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <Link href={`/u/${a.sender.username}`} className="font-semibold text-ink underline underline-offset-4">@{a.sender.username}</Link>
        <span>account made {timeAgo(a.sender.created_at)}</span>
        {a.lab && <span>in {a.lab.name}</span>}
        <span>{timeAgo(a.created_at)}</span>
        {a.escalated && <span className="rounded-full bg-rose px-2 py-0.5 font-semibold text-white">Escalated, kept as evidence</span>}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt="Image to review" width={a.width} height={a.height} className="w-full rounded-md border border-ink bg-cream object-contain" />
        <div>
          {a.caption ? <p className="text-sm">&ldquo;{a.caption}&rdquo;</p> : <p className="text-sm text-muted">No caption.</p>}

          {a.status === "pending" && mode === "idle" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn btn-sm" disabled={act.isPending} onClick={() => act.mutate({ action: "approve" })}>Approve</button>
              <button className="btn-secondary btn-sm" disabled={act.isPending} onClick={() => setMode("reject")}>Remove…</button>
            </div>
          )}

          {a.status === "pending" && mode === "reject" && (
            <div className="mt-4 space-y-3 text-sm">
              <label className="block font-medium">
                Note for the audit log
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-1.5 w-full rounded-md border border-ink bg-white px-3 py-2" />
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={escalate} onChange={(e) => setEscalate(e.target.checked)} className="mt-1" />
                <span>
                  <span className="font-medium">Serious safety matter</span>
                  <span className="block text-xs text-muted">Keeps the file privately as evidence instead of deleting it. Follow the escalation steps in the safeguarding notes.</span>
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={suspend} onChange={(e) => setSuspend(e.target.checked)} />
                Also suspend this member for 7 days
              </label>
              <div className="flex gap-2">
                <button className="btn btn-sm" disabled={act.isPending} onClick={() => act.mutate({ action: "reject", note: note || undefined, escalate, suspend_days: suspend ? 7 : undefined })}>Remove image</button>
                <button className="btn-secondary btn-sm" onClick={() => setMode("idle")}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ImageReviewPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("pending");
  const list = useQuery({ queryKey: keys.admin("attachments", status), queryFn: () => imageReviewApi.list(status), refetchInterval: status === "pending" ? 30_000 : false });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin"] });

  return (
    <>
      <h1 className="text-[32px] tracking-[-0.03em] md:text-[40px]">Images</h1>
      <p className="mt-2 max-w-[560px] text-muted">Every image sent in a team chat waits here. Teammates see it only after you approve it. Removed images are deleted, unless you mark them as a serious safety matter.</p>

      <div className="mt-6">
        <Tabs
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ id: "pending", label: "Waiting" }, { id: "approved", label: "Approved" }, { id: "rejected", label: "Removed" }]}
        />
      </div>

      <div className="mt-6">
        {list.isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : list.isError ? (
          <p className="text-muted">Couldn&rsquo;t load the images.</p>
        ) : list.data.attachments.length === 0 ? (
          <EmptyState title={status === "pending" ? "Nothing waiting." : "Nothing here."}>{status === "pending" ? "New images will show up here." : ""}</EmptyState>
        ) : (
          <ul className="space-y-4">{list.data.attachments.map((a) => <ImageCard key={a.id} a={a} onDone={refresh} />)}</ul>
        )}
      </div>
    </>
  );
}
