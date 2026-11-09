"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SendIcon } from "@animateicons/react/lucide/send-icon";
import useIconHover from "@/lib/useIconHover";
import { ApiError } from "@/lib/api";
import { answerQuestion, getInterview, nextQuestion, questionHelp, setAlfredTone, type AlfredTone, type AnswerPayload, type HelpAction, type InterviewQuestion, type InterviewState } from "@/lib/admissions";
import { moodForEvent, type AlfredMood, type InterviewEvent } from "@/lib/alfred-expressions";
import { playCue, saveSoundPreference, soundPreference, type Cue } from "@/lib/alfred-sound";
import AlfredStage from "@/components/apply/AlfredStage";
import AlfredSprite from "@/components/alfred/AlfredSprite";
import QuestionInputs, { draftReady, emptyDraft, type AnswerDraft } from "@/components/apply/QuestionInputs";

const TONES: { id: AlfredTone; label: string; blurb: string }[] = [
  { id: "playful", label: "Playful", blurb: "Jokes welcome" },
  { id: "balanced", label: "A bit of both", blurb: "Dry wit, now and then" },
  { id: "plain", label: "Straight to it", blurb: "No jokes, still friendly" },
];

const HIDE_KEY = "tx_alfred_hidden";

/** Alfred's interview: one card at a time, a reaction to what you said, and a card shaped for the question. */
export default function AlfredInterview({ token, locked, onProgress }: { token: string; locked: boolean; onProgress?: (canSubmit: boolean) => void }) {
  const reduced = useReducedMotion();
  const send = useIconHover();
  const [state, setState] = useState<InterviewState | null>(null);
  const [phase, setPhase] = useState<"loading" | "intro" | "asking" | "thinking">("loading");
  const [draft, setDraft] = useState<AnswerDraft>(emptyDraft);
  const [tone, setTone] = useState<AlfredTone>("balanced");
  const [error, setError] = useState<string | null>(null);
  const [safetyNote, setSafetyNote] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [skipsLeft, setSkipsLeft] = useState<number | null>(null);
  const [mood, setMood] = useState<AlfredMood>("idle");
  const [runKey, setRunKey] = useState(0);
  const [say, setSay] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setSoundOn(soundPreference());
    try {
      setHidden(window.sessionStorage.getItem(HIDE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const feel = useCallback(
    (e: InterviewEvent, line?: string | null, cue?: Cue) => {
      setMood(moodForEvent(e));
      setRunKey((k) => k + 1);
      if (line !== undefined) setSay(line);
      if (cue) playCue(cue, soundOn);
    },
    [soundOn],
  );

  const arrive = useCallback(
    (s: InterviewState, serious = false) => {
      setState(s);
      onProgress?.(s.can_submit);
      if (s.tone) setTone(s.tone);
      const n = s.next;
      if (serious) {
        // Someone told us something heavy: no celebration, no jokes, no sound.
        setPhase("asking");
        setMood("serious");
        setRunKey((k) => k + 1);
        setSay(null);
        return;
      }
      if (n) {
        setPhase("asking");
        feel({ kind: "question", reaction: n.lead_in?.type, first: n.position === 1 }, n.lead_in?.text ?? null, n.lead_in ? "reaction" : "question");
        requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
      } else {
        setPhase("asking");
        if (s.can_submit) feel({ kind: "finished" }, "That is everything from me. Thank you for the honest answers.", "done");
      }
    },
    [feel, onProgress],
  );

  const load = useCallback(async () => {
    try {
      const s = await getInterview(token);
      if (s.tone) setTone(s.tone);
      if (s.questions.length === 0 && !locked) {
        setState(s);
        setPhase("intro");
        feel({ kind: "welcome" }, "Hi, I am Alfred. I will ask you some questions. None has a trick in it and none has a right answer. Mostly I am nosy.");
        return;
      }
      if (locked) {
        setState(s);
        setPhase("asking");
        onProgress?.(s.can_submit);
        return;
      }
      const back = s.questions.some((q) => q.answer);
      const n = await nextQuestion(token);
      arrive(n);
      if (back && n.next) setSay((n.next.lead_in?.text ?? null) || "Welcome back. We were in the middle of something, so let us carry on.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load the interview.");
      setPhase("asking");
      feel({ kind: "fallback" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, locked]);

  useEffect(() => {
    void load();
  }, [load]);

  const start = async () => {
    setPhase("thinking");
    feel({ kind: "thinking" }, "Give me a second to think of something worth asking.");
    try {
      if (tone !== "balanced") await setAlfredTone(token, tone);
      arrive(await nextQuestion(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the interview.");
      setPhase("intro");
      feel({ kind: "fallback" });
    }
  };

  const payload = (q: InterviewQuestion): AnswerPayload => {
    const note = draft.note.trim() || undefined;
    if (q.format === "choice" || q.format === "multi" || q.format === "rank") return { choice: draft.picked, note };
    if (q.format === "scale" || q.format === "slider") return { value: draft.value ?? undefined, note };
    return { answer: draft.text.trim() };
  };

  const submit = async () => {
    const q = state?.next;
    if (!q || !draftReady(q, draft) || phase !== "asking") return;
    setError(null);
    setSafetyNote(null);
    setPhase("thinking");
    feel({ kind: "answered" }, null, "answer");
    try {
      const saved = await answerQuestion(token, q.position, payload(q));
      setDraft(emptyDraft());
      setHint(null);
      if (saved.safety_message) {
        setSafetyNote(saved.safety_message);
        feel({ kind: "safety" }, null);
      }
      feel({ kind: "thinking" }, saved.safety_message ? null : "Hm.");
      const advanced = saved.next === undefined ? await nextQuestion(token) : saved;
      arrive(advanced, !!saved.safety_message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that answer.");
      setPhase("asking");
      feel({ kind: "fallback" }, "That did not save. Your answer is still here, so try once more.");
    }
  };

  const help = async (action: HelpAction) => {
    const q = state?.next;
    if (!q) return;
    setError(null);
    const was = phase;
    setPhase("thinking");
    try {
      const r = await questionHelp(token, q.position, action);
      setSkipsLeft(r.skips_left);
      if (action === "hint") {
        setHint(r.hint);
        setPhase(was);
        feel({ kind: "hint" }, "Fair. Here is a nudge.");
      } else {
        setHint(null);
        setDraft(emptyDraft());
        arrive(r.next === undefined ? await nextQuestion(token) : r);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't get help right now.");
      setPhase(was);
    }
  };

  const q = state?.next ?? null;
  const open = q ? state?.questions.find((x) => x.position === q.position) : undefined;
  const canSwap = (open?.alternatives_left ?? 0) > 0;
  const canSkip = skipsLeft === null || skipsLeft > 0;
  const answered = state?.answered ?? 0;
  const finished = !q && !!state?.can_submit;
  const ready = !!q && draftReady(q, draft);
  const motionProps = reduced ? { initial: false } : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.25 } };

  if (phase === "loading") return <p role="status" className="text-sm text-muted">Alfred is getting your conversation ready…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-[10rem_1fr] md:gap-6">
      <div className="md:sticky md:top-24 md:self-start">
        <AlfredStage mood={mood} runKey={runKey} say={say} hidden={hidden} onHide={(h) => { setHidden(h); try { window.sessionStorage.setItem(HIDE_KEY, h ? "1" : "0"); } catch { /* ignore */ } }} soundOn={soundOn} onSound={(on) => { setSoundOn(on); saveSoundPreference(on); if (on) playCue("reaction", true); }} />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        {phase !== "intro" && state && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1" role="progressbar" aria-label="Interview progress" aria-valuemin={0} aria-valuemax={state.total} aria-valuenow={answered} aria-valuetext={`${answered} answered. Alfred stops when he has heard enough, at most ${state.total}.`}>
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: state.total }, (_, i) => (
                <span key={i} className={`h-2.5 w-4 rounded-full sm:w-6 border border-ink transition-colors duration-300 ${i < answered ? "bg-ink" : i === answered && !finished ? "bg-yellow" : "bg-white opacity-50"}`} />
              ))}
            </div>
            <p className="text-xs text-muted">{finished ? "All done" : `Question ${Math.min(answered + 1, state.total)}, wrapping up when he has heard enough`}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.section key="intro" {...motionProps} className="flex flex-col gap-4 rounded-md border border-ink bg-white p-5 shadow-[4px_4px_0_var(--ink)]">
              <h3 ref={heading} tabIndex={-1} className="text-xl font-bold tracking-normal outline-none">How should I talk to you?</h3>
              <p className="text-sm text-muted">Only changes how I sound. It never changes how anyone reads your answers.</p>
              <div role="radiogroup" aria-label="How Alfred talks" className="grid gap-2 sm:grid-cols-3">
                {TONES.map((t) => (
                  <label key={t.id} className="relative">
                    <input type="radio" name="tone" checked={tone === t.id} onChange={() => setTone(t.id)} className="peer sr-only" />
                    <span className={`flex h-full cursor-pointer flex-col rounded-md border border-ink p-3 text-sm transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-rose ${tone === t.id ? "bg-yellow shadow-[3px_3px_0_var(--ink)]" : "bg-cream hover:-translate-y-0.5"}`}>
                      <span className="font-semibold">{t.label}</span>
                      <span className="text-xs text-muted">{t.blurb}</span>
                    </span>
                  </label>
                ))}
              </div>
              {error && <p className="text-sm text-rose">{error}</p>}
              <button type="button" onClick={start} className="btn self-start">Let&rsquo;s begin</button>
            </motion.section>
          )}

          {phase === "thinking" && (
            <motion.section key="thinking" {...motionProps} className="rounded-md border border-dashed border-ink bg-cream p-5 text-sm text-muted" role="status">
              Alfred is thinking of what to ask next…
            </motion.section>
          )}

          {phase === "asking" && q && !locked && (
            <motion.section key={q.position} {...motionProps} aria-labelledby="alfred-q" className="flex flex-col gap-4 rounded-md border border-ink bg-white p-5 shadow-[4px_4px_0_var(--ink)]">
              {q.position === 1 && (
                <div className="flex items-center gap-3 border-b border-line pb-3">
                  <div className="w-12 shrink-0"><AlfredSprite animation={null} runKey={0} /></div>
                  <p className="text-sm text-muted">An easy one to start. Take your time.</p>
                </div>
              )}
              {q.kind === "follow_up" && <p className="text-xs font-semibold uppercase tracking-wide text-muted">Following up</p>}
              <h3 id="alfred-q" ref={heading} tabIndex={-1} className="text-xl font-bold leading-snug tracking-normal outline-none">{q.question}</h3>
              <QuestionInputs q={q} draft={draft} set={setDraft} onSubmit={submit} />
              {hint && <p className="rounded-md border border-ink bg-yellow/40 p-3 text-sm">{hint}</p>}
              {safetyNote && <p className="rounded-md border border-ink bg-yellow/40 p-3 text-sm">{safetyNote}</p>}
              {error && <p role="alert" className="text-sm text-rose">{error}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <button type="button" onClick={() => help("hint")} className="font-semibold underline underline-offset-4">Give me a hint</button>
                  {canSwap && <button type="button" onClick={() => help("alternative")} className="font-semibold underline underline-offset-4">Ask something different</button>}
                  {canSkip && <button type="button" onClick={() => help("skip")} className="text-muted underline underline-offset-4">Skip this one{skipsLeft !== null ? ` (${skipsLeft} left)` : ""}</button>}
                </div>
                <button type="button" onClick={submit} disabled={!ready} onMouseEnter={send.onMouseEnter} onMouseLeave={send.onMouseLeave} aria-label="Send answer" className="btn btn-icon shrink-0 disabled:opacity-60">
                  <SendIcon ref={send.ref} size={18} />
                </button>
              </div>
            </motion.section>
          )}

          {phase === "asking" && !q && (finished || locked || error) && (
            <motion.section key="end" {...motionProps} className="flex flex-col gap-2 rounded-md border border-ink bg-yellow/40 p-5">
              {error && !finished ? <p role="alert" className="text-sm text-rose">{error}</p> : <h3 className="text-xl font-bold">{locked ? "Your conversation with Alfred" : "That is everything from me."}</h3>}
              {safetyNote && <p className="rounded-md border border-ink bg-white p-3 text-sm">{safetyNote}</p>}
              {finished && !locked && <p className="text-sm">Next you can show us your work, or head straight to the review. You can change any answer there.</p>}
            </motion.section>
          )}
        </AnimatePresence>

        {state && state.questions.some((x) => x.answer) && (
          <details className="rounded-md border border-ink bg-white p-3 text-sm">
            <summary className="cursor-pointer font-semibold">What we have covered so far ({state.questions.filter((x) => x.answer).length})</summary>
            <ol className="mt-3 flex flex-col gap-3">
              {state.questions.filter((x) => x.answer).map((x) => (
                <li key={x.position}>
                  {x.lead_in && <p className="text-xs italic text-muted">Alfred: {x.lead_in.text}</p>}
                  <p className="font-semibold">{x.question}</p>
                  <p className="text-muted">{x.answer}</p>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}
