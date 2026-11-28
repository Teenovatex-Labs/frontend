"use client";

import { useState, type ReactNode } from "react";
import Dialog from "./Dialog";

// "Are you sure?" for actions that are hard to undo: suspend, remove, delete, publish.
// Built on Dialog, which handles Escape, the click-outside close and moving focus in and back.
// While the action runs, the confirm button shows `pendingLabel` and the dialog cannot be
// dismissed, so nobody closes it halfway through.
//
// Usage with a promise (pending is tracked for you; a rejection keeps the dialog open,
// so show the error inside onConfirm, e.g. with a toast):
//   <ConfirmDialog open={!!target} onClose={() => setTarget(null)} tone="danger"
//     title="Remove this lab?" confirmLabel="Remove" pendingLabel="Removing…"
//     onConfirm={async () => { await labsApi.remove(target!.id); setTarget(null); }}>
//     It disappears for everyone. This cannot be undone.
//   </ConfirmDialog>
//
// Usage with a react-query mutation (pass its pending state):
//   <ConfirmDialog open={publishing} onClose={() => setPublishing(false)}
//     title="Publish results?" confirmLabel="Publish" pendingLabel="Publishing…"
//     pending={publish.isPending} onConfirm={() => publish.mutate()}>…</ConfirmDialog>

type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** The consequence, in plain words. Plain text is wrapped in a muted paragraph. */
  children: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button rose for destructive actions. */
  tone?: "default" | "danger";
  /** Pending state owned by the caller (e.g. mutation.isPending). */
  pending?: boolean;
  onConfirm: () => void | Promise<unknown>;
};

export default function ConfirmDialog({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  onConfirm,
}: Props) {
  const [running, setRunning] = useState(false);
  const busy = pending || running;

  const confirm = async () => {
    if (busy) return;
    const result = onConfirm();
    if (!(result instanceof Promise)) return;
    setRunning(true);
    try {
      await result;
    } catch {
      // The caller reports the error; staying open lets the user retry or cancel.
    } finally {
      setRunning(false);
    }
  };

  const danger = tone === "danger" ? "!border-rose !bg-rose !text-cream" : "";

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} title={title}>
      {typeof children === "string" ? <p className="text-sm text-muted">{children}</p> : children}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-secondary disabled:opacity-60" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </button>
        <button type="button" className={`btn disabled:opacity-60 ${danger}`} onClick={confirm} disabled={busy} aria-busy={busy || undefined}>
          {busy && pendingLabel ? pendingLabel : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
