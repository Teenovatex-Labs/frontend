"use client";

import { useEffect, useState } from "react";
import { SendIcon } from "@animateicons/react/lucide/send-icon";
import useIconHover from "@/lib/useIconHover";
import { ApiError } from "@/lib/api";
import { answerQuestion, getInterview, nextQuestion, type AnswerPayload, type InterviewQuestion, type InterviewState } from "@/lib/admissions";

/** A short, adaptive chat with Alfred: one question at a time, answered in order. */
export default function InterviewChat({ token, locked, onProgress }: { token: string; locked: boolean; onProgress?: (canSubmit: boolean) => void }) {
  const [state, setState] = useState<InterviewState | null>(null);
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [value, setValue] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyNote, setSafetyNote] = useState<string | null>(null);
  const send = useIconHover();

  const load = async () => {
    setLoading(true);
    try {
      const s = await getInterview(token);
      setState(s.next === undefined ? await nextQuestion(token) : s);
      onProgress?.(s.can_submit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load the interview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const format = state?.next?.format ?? "text";
  const payload = (): AnswerPayload | null => {
    if (format === "choice" || format === "multi") return picked.length ? { choice: picked, note: note.trim() || undefined } : null;
    if (format === "scale" || format === "slider") return value === null ? null : { value, note: note.trim() || undefined };
    return answer.trim() ? { answer: answer.trim() } : null;
  };
  const ready = payload() !== null;

  const handleAnswer = async () => {
    const body = payload();
    if (!state?.next || !body) return;
    setBusy(true);
    setError(null);
    setSafetyNote(null);
    try {
      const result = await answerQuestion(token, state.next.position, body);
      setAnswer("");
      setPicked([]);
      setValue(null);
      setNote("");
      if (result.safety_message) setSafetyNote(result.safety_message);
      const advanced = result.next === undefined ? await nextQuestion(token) : result;
      setState(advanced);
      onProgress?.(advanced.can_submit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that answer.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">Loading your conversation with Alfred…</p>;
  if (!state) return <p className="text-sm text-rose">{error}</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto rounded-md border border-ink bg-white p-4">
        {state.answered === 0 && !state.next && (
          <p className="text-sm text-muted">Alfred will ask a few short questions to get to know you. Nothing here is scored by looks or demographics.</p>
        )}
        {state.questions.filter((qa) => qa.answer).map((qa) => (
          <div key={qa.position} className="flex flex-col gap-1.5">
            <div className="self-start rounded-xl rounded-bl-sm border border-ink bg-pink/30 px-3.5 py-2 text-sm max-w-[85%]">{qa.question}</div>
            <div className="self-end rounded-xl rounded-br-sm bg-ink px-3.5 py-2 text-sm text-cream max-w-[85%]">{qa.answer}</div>
          </div>
        ))}
        {state.next && (
          <div className="self-start rounded-xl rounded-bl-sm border border-ink bg-pink/30 px-3.5 py-2 text-sm max-w-[85%]">{state.next.question}</div>
        )}
        {!state.next && state.can_submit && (
          <p className="self-start rounded-xl rounded-bl-sm border border-ink bg-yellow/40 px-3.5 py-2 text-sm">
            That&rsquo;s everything from me. Thanks for sharing all that!
          </p>
        )}
      </div>

      {safetyNote && <p className="rounded-md border border-ink bg-yellow/40 p-3 text-sm">{safetyNote}</p>}
      {error && <p className="text-sm text-rose">{error}</p>}

      {state.next && !locked && (
        <div className="flex flex-col gap-2">
          <AnswerInput
            q={state.next}
            answer={answer}
            setAnswer={setAnswer}
            picked={picked}
            setPicked={setPicked}
            value={value}
            setValue={setValue}
            note={note}
            setNote={setNote}
            onSubmit={handleAnswer}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAnswer}
              disabled={busy || !ready}
              onMouseEnter={send.onMouseEnter}
              onMouseLeave={send.onMouseLeave}
              aria-label="Send answer"
              className="btn btn-icon shrink-0 disabled:opacity-60"
            >
              <SendIcon ref={send.ref} size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type InputProps = {
  q: InterviewQuestion;
  answer: string; setAnswer: (v: string) => void;
  picked: string[]; setPicked: (v: string[]) => void;
  value: number | null; setValue: (v: number) => void;
  note: string; setNote: (v: string) => void;
  onSubmit: () => void;
};

const noteBox = (note: string, setNote: (v: string) => void) => (
  <input
    value={note}
    onChange={(e) => setNote(e.target.value)}
    maxLength={600}
    placeholder="Want to say more? (optional)"
    className="rounded-md border border-ink bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose"
  />
);

/** The right input for how Alfred asked: typing, a pick, or a number. */
function AnswerInput({ q, answer, setAnswer, picked, setPicked, value, setValue, note, setNote, onSubmit }: InputProps) {
  const spec = q.spec;
  if ((q.format === "choice" || q.format === "multi") && spec?.options) {
    const multi = q.format === "multi";
    const toggle = (o: string) => setPicked(multi ? (picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o]) : [o]);
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted">{multi ? "Pick any that fit." : "Pick one."}</p>
        <div role={multi ? "group" : "radiogroup"} className="flex flex-wrap gap-2">
          {spec.options.map((o) => (
            <button
              key={o}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={picked.includes(o)}
              onClick={() => toggle(o)}
              className={`rounded-md border border-ink px-3 py-2 text-left text-sm transition-colors ${picked.includes(o) ? "bg-yellow shadow-[3px_3px_0_var(--ink)]" : "bg-white hover:bg-cream"}`}
            >
              {o}
            </button>
          ))}
        </div>
        {noteBox(note, setNote)}
      </div>
    );
  }
  if ((q.format === "scale" || q.format === "slider") && spec) {
    const min = spec.min ?? 0;
    const max = spec.max ?? 10;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
      <div className="flex flex-col gap-2">
        {q.format === "scale" ? (
          <div role="radiogroup" className="flex gap-2">
            {steps.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                onClick={() => setValue(n)}
                className={`h-11 flex-1 rounded-md border border-ink text-sm font-semibold transition-colors ${value === n ? "bg-yellow shadow-[3px_3px_0_var(--ink)]" : "bg-white hover:bg-cream"}`}
              >
                {n}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={value ?? Math.round((min + max) / 2)}
              onChange={(e) => setValue(Number(e.target.value))}
              onPointerDown={() => value === null && setValue(Math.round((min + max) / 2))}
              aria-label="Your answer"
              className="flex-1"
            />
            <span className="w-8 text-right text-sm font-semibold tabular-nums">{value ?? "–"}</span>
          </div>
        )}
        {(spec.low || spec.high) && (
          <div className="flex justify-between text-xs text-muted"><span>{spec.low}</span><span>{spec.high}</span></div>
        )}
        {noteBox(note, setNote)}
      </div>
    );
  }
  return (
    <textarea
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      rows={2}
      maxLength={2000}
      placeholder="Write your answer…"
      className="w-full rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none transition-colors focus:ring-2 focus:ring-rose"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      }}
    />
  );
}
