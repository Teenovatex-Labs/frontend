"use client";

import { useId } from "react";
import type { InterviewQuestion } from "@/lib/admissions";

export type AnswerDraft = {
  text: string;
  picked: string[];
  value: number | null;
  note: string;
  /** For rankings: true once the applicant has moved something or confirmed the order. */
  ranked: boolean;
};

export const emptyDraft = (): AnswerDraft => ({ text: "", picked: [], value: null, note: "", ranked: false });

/** Whether the draft is a complete answer to this question. */
export const draftReady = (q: InterviewQuestion, d: AnswerDraft): boolean => {
  if (q.format === "choice" || q.format === "multi") return d.picked.length > 0;
  if (q.format === "rank") return d.ranked && d.picked.length === (q.spec?.options?.length ?? -1);
  if (q.format === "scale" || q.format === "slider") return d.value !== null;
  return d.text.trim().length > 0;
};

type Props = { q: InterviewQuestion; draft: AnswerDraft; set: (d: AnswerDraft) => void; onSubmit: () => void };

const card = (on: boolean) => `flex cursor-pointer items-start gap-3 rounded-md border border-ink p-3 text-left text-[15px] transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-rose ${on ? "bg-yellow shadow-[3px_3px_0_var(--ink)]" : "bg-white hover:-translate-y-0.5 hover:bg-cream"}`;

function NoteBox({ draft, set, placeholder }: { draft: AnswerDraft; set: (d: AnswerDraft) => void; placeholder: string }) {
  return (
    <input value={draft.note} onChange={(e) => set({ ...draft, note: e.target.value })} maxLength={600} placeholder={placeholder} aria-label={placeholder} className="rounded-md border border-ink bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
  );
}

/** The card for how Alfred asked: type, tap one, tap many, rate, slide, or put in order. No answer is "correct". */
export default function QuestionInputs({ q, draft, set, onSubmit }: Props) {
  const name = useId();
  const options = q.spec?.options ?? [];

  if ((q.format === "choice" || q.format === "multi") && options.length) {
    const multi = q.format === "multi";
    const toggle = (o: string) => set({ ...draft, picked: multi ? (draft.picked.includes(o) ? draft.picked.filter((x) => x !== o) : [...draft.picked, o]) : [o] });
    return (
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{multi ? "Pick any that fit" : "Pick one"}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o, i) => (
            <label key={o} className="relative block">
              <input type={multi ? "checkbox" : "radio"} name={name} checked={draft.picked.includes(o)} onChange={() => toggle(o)} className="peer sr-only" />
              <span className={card(draft.picked.includes(o))}>
                <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ink bg-cream text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                <span>{o}</span>
              </span>
            </label>
          ))}
        </div>
        <NoteBox draft={draft} set={set} placeholder="Want to say why? (optional)" />
      </fieldset>
    );
  }

  if (q.format === "rank" && options.length) {
    const order = draft.picked.length === options.length ? draft.picked : options;
    const move = (i: number, by: -1 | 1) => {
      const j = i + by;
      if (j < 0 || j >= order.length) return;
      const next = [...order];
      [next[i], next[j]] = [next[j]!, next[i]!];
      set({ ...draft, picked: next, ranked: true });
    };
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Put these in your order, most important first</p>
        <ol className="flex flex-col gap-2">
          {order.map((o, i) => (
            <li key={o} className="flex items-center gap-3 rounded-md border border-ink bg-white p-2.5 text-[15px]">
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink bg-yellow text-sm font-bold">{i + 1}</span>
              <span className="flex-1">{o}</span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move “${o}” up`} className="btn-secondary px-2.5 py-1 text-sm disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move “${o}” down`} className="btn-secondary px-2.5 py-1 text-sm disabled:opacity-30">↓</button>
              </span>
            </li>
          ))}
        </ol>
        {!draft.ranked && (
          <button type="button" onClick={() => set({ ...draft, picked: order, ranked: true })} className="self-start text-sm font-semibold underline underline-offset-4">
            This order is already right
          </button>
        )}
        <NoteBox draft={draft} set={set} placeholder="Why that order? (optional)" />
      </div>
    );
  }

  if ((q.format === "scale" || q.format === "slider") && q.spec) {
    const min = q.spec.min ?? 0;
    const max = q.spec.max ?? 10;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div className="flex flex-col gap-3">
        {q.format === "scale" ? (
          <div role="radiogroup" aria-label="Your answer" className="flex gap-2">
            {steps.map((n) => (
              <label key={n} className="relative flex-1">
                <input type="radio" name={name} checked={draft.value === n} onChange={() => set({ ...draft, value: n })} className="peer sr-only" />
                <span className={`${card(draft.value === n)} h-14 items-center justify-center text-lg font-bold`}>{n}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-md border border-ink bg-white p-4">
            <p aria-hidden="true" className="text-center text-4xl font-bold tabular-nums">{draft.value ?? <span className="text-lg font-normal text-muted">Move the slider</span>}</p>
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={draft.value ?? Math.round((min + max) / 2)}
              onChange={(e) => set({ ...draft, value: Number(e.target.value) })}
              onPointerDown={() => draft.value === null && set({ ...draft, value: Math.round((min + max) / 2) })}
              onKeyDown={() => draft.value === null && set({ ...draft, value: Math.round((min + max) / 2) })}
              aria-label="Your answer"
              aria-valuetext={draft.value === null ? "not chosen yet" : `${draft.value} out of ${max}`}
              className="w-full accent-[var(--rose)]"
            />
            <div className="flex justify-between px-0.5 text-[10px] text-muted" aria-hidden="true">{steps.map((n) => <span key={n}>{n}</span>)}</div>
          </div>
        )}
        {(q.spec.low || q.spec.high) && (
          <div className="flex justify-between text-xs text-muted"><span>{q.spec.low}</span><span>{q.spec.high}</span></div>
        )}
        <NoteBox draft={draft} set={set} placeholder="Want to say more? (optional)" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={draft.text}
        onChange={(e) => set({ ...draft, text: e.target.value })}
        rows={draft.text.length > 160 ? 6 : 3}
        maxLength={1500}
        aria-label="Your answer"
        placeholder="Type your answer. A sentence or two is plenty, and short answers are welcome."
        className="w-full resize-y rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none transition-colors focus:ring-2 focus:ring-rose"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <p className="text-right text-xs text-muted">Enter to send, Shift+Enter for a new line{draft.text.length > 1200 ? ` · ${1500 - draft.text.length} left` : ""}</p>
    </div>
  );
}
