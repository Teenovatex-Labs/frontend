"use client";

import { useEffect, useState } from "react";
import { SendIcon } from "@animateicons/react/lucide/send-icon";
import useIconHover from "@/lib/useIconHover";
import { ApiError } from "@/lib/api";
import { answerQuestion, getInterview, nextQuestion, type InterviewState } from "@/lib/admissions";

/** A short, adaptive chat with Alfred: one question at a time, answered in order. */
export default function InterviewChat({ token, locked, onProgress }: { token: string; locked: boolean; onProgress?: (canSubmit: boolean) => void }) {
  const [state, setState] = useState<InterviewState | null>(null);
  const [answer, setAnswer] = useState("");
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

  const handleAnswer = async () => {
    if (!state?.next || !answer.trim()) return;
    setBusy(true);
    setError(null);
    setSafetyNote(null);
    try {
      const result = await answerQuestion(token, state.next.position, answer.trim());
      setAnswer("");
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
        {state.answered.length === 0 && !state.next && (
          <p className="text-sm text-muted">Alfred will ask a few short questions to get to know you. Nothing here is scored by looks or demographics.</p>
        )}
        {state.answered.map((qa) => (
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
        <div className="flex items-end gap-2">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Write your answer…"
            className="flex-1 rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none transition-colors focus:ring-2 focus:ring-rose"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAnswer();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAnswer}
            disabled={busy || !answer.trim()}
            onMouseEnter={send.onMouseEnter}
            onMouseLeave={send.onMouseLeave}
            aria-label="Send answer"
            className="btn btn-icon shrink-0 disabled:opacity-60"
          >
            <SendIcon ref={send.ref} size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
