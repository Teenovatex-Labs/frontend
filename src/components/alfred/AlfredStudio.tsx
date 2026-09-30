"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { AlfredProvider, useAlfred } from "@/context/AlfredContext";
import type { AlfredState, AlfredTaskHandle } from "@/lib/alfred";
import { MOTION_DURATION } from "@/lib/alfred-motion";
import AlfredCompanion from "./AlfredCompanion";
import AlfredSprite from "./AlfredSprite";
import styles from "./AlfredStudio.module.css";

const states: { id: AlfredState; name: string; note: string }[] = [
  { id: "greeting", name: "Greeting", note: "A warm hello when Alfred joins you." },
  { id: "waking", name: "Waking", note: "A little stretch before getting started." },
  { id: "resting", name: "Resting", note: "A quiet, comfortable pause." },
  { id: "planning", name: "Planning", note: "Putting the next steps in order." },
  { id: "thinking", name: "Thinking", note: "Taking a moment to consider." },
  { id: "reading", name: "Reading", note: "Following along with something on screen." },
  { id: "curious", name: "Curious", note: "Looking closer when something catches his eye." },
  { id: "operating", name: "Operating", note: "Focused while a task is underway." },
  { id: "consent", name: "Consent", note: "Waiting for your clear yes or no." },
  { id: "alerting", name: "Alerting", note: "Bringing an important note to your attention." },
  { id: "playful", name: "Playful", note: "A small bit of personality between tasks." },
  { id: "celebrating", name: "Celebrating", note: "Sharing a win with you." },
  { id: "done", name: "Done", note: "The work is complete." },
  { id: "failed", name: "Failed", note: "Something needs another look." },
  { id: "offline", name: "Offline", note: "A gentle signal that the connection is away." },
];

function StudioBody() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoMessage, setDemoMessage] = useState("Try a short simulated task to see how Alfred’s status can change.");
  const timers = useRef<number[]>([]);
  const demoTask = useRef<AlfredTaskHandle | null>(null);
  const mounted = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  const current = states[selected];
  const { beginTask, requestConsent, consent } = useAlfred();

  useEffect(() => {
    if (!playing) return;
    const delay = Math.max(5000, MOTION_DURATION[current.id] * 1000 + 600);
    const timer = window.setTimeout(() => setSelected((value) => (value + 1) % states.length), delay);
    return () => window.clearTimeout(timer);
  }, [playing, current.id]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
      demoTask.current?.cancel();
      demoTask.current = null;
    };
  }, []);

  const choose = useCallback((index: number) => {
    setPlaying(false);
    setSelected((index + states.length) % states.length);
  }, []);

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const active = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-state-index]");
    if (!active) return;
    let delta = 0;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") delta = 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") delta = -1;
    if (event.key === "Home") delta = -selected;
    if (event.key === "End") delta = states.length - 1 - selected;
    if (!delta) return;
    event.preventDefault();
    const next = (selected + delta + states.length) % states.length;
    choose(next);
    grid.current?.querySelector<HTMLButtonElement>(`[data-state-index="${next}"]`)?.focus();
  };

  const runDemo = () => {
    if (demoRunning) return;
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    demoTask.current?.cancel();
    setDemoRunning(true);
    setDemoMessage("Preview running: Alfred is outlining three project steps.");
    const task = beginTask("Preview task: outline three project steps", "planning");
    demoTask.current = task;
    timers.current.push(window.setTimeout(() => {
      task.update("Preview running: Alfred is checking the order of those steps.", "thinking");
      setDemoMessage("Preview running: Alfred is checking the order of those steps.");
    }, 1100));
    timers.current.push(window.setTimeout(() => {
      task.update("Preview running: Alfred is putting the final outline in place.", "operating");
      setDemoMessage("Preview running: Alfred is putting the final outline in place.");
    }, 2300));
    timers.current.push(window.setTimeout(() => {
      task.done("Preview complete. Your project outline is ready to review.");
      demoTask.current = null;
      setDemoMessage("Preview complete. The simulated outline is ready to review.");
      setDemoRunning(false);
    }, 3600));
  };

  const showConsent = async () => {
    if (consent) return;
    const approved = await requestConsent({ title: "Preview permission", message: "May Alfred use this simulated choice to continue the preview? Nothing will be sent or changed." });
    if (mounted.current) {
      setDemoMessage(approved ? "You allowed the simulated preview to continue." : "You declined the simulated preview. Nothing changed.");
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand} aria-label="TeenovateX home"><img src="/assets/logo-pink-nobg.svg" alt="" className={styles.brandLogo} /><span>TeenovateX <i>Labs</i></span></Link>
        <div className={styles.topActions}><span className={styles.previewTag}><b /> VISUAL PREVIEW</span><Link href="/home" className={styles.backLink}>Back to your space <span aria-hidden="true">↗</span></Link></div>
      </header>

      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}><span>01</span> Meet your companion</p>
          <h1>Meet <em>Alfred.</em></h1>
        </div>
        <p className={styles.introNote}>A curious mind. A familiar face. Pick a moment to watch Alfred work, think, rest, and celebrate with you.</p>
      </section>

      <section className={styles.showcase} aria-label="Alfred state preview">
        <div className={styles.stage}>
          <div className={styles.stageTop}><span><b className={styles.liveDot} /> EXPRESSION STUDY</span><span>FIG. {String(selected + 1).padStart(2, "0")} / {states.length}</span></div>
          <div className={styles.stageArt}>
            <span className={`${styles.orbit} ${playing ? styles.orbitMoving : ""}`} aria-hidden="true" />
            <div className={styles.sprite}><AlfredSprite state={current.id} paused={paused} reducedMotion={reducedMotion} /></div>
          </div>
          <div className={styles.stageCaption}>
            <div><span className={styles.captionLabel}>RIGHT NOW, ALFRED IS</span><h2>{current.name}<span>.</span></h2></div>
            <p>{current.note}</p>
          </div>
        </div>

        <aside className={styles.controls} aria-label="Preview controls">
          <div className={styles.controlIntro}><span className={styles.sectionNo}>A</span><div><p className={styles.eyebrow}>Take a closer look</p><h2>Pick a moment.</h2></div></div>
          <div className={styles.stateGrid} ref={grid} onKeyDown={onGridKey} role="group" aria-label="Choose Alfred’s expression">
            {states.map((item, index) => (
              <button key={item.id} data-state-index={index} type="button" aria-pressed={selected === index} onClick={() => choose(index)} className={`${styles.stateButton} ${selected === index ? styles.selectedState : ""}`}>
                <span className={styles.stateIndex}>{String(index + 1).padStart(2, "0")}</span>{item.name}
              </button>
            ))}
          </div>
          <p className={styles.keyboardHint}>Use ↑ ↓ ← → to explore, or choose any expression.</p>
          <div className={styles.playback}>
            <button type="button" className={styles.sequenceButton} onClick={() => setPlaying((value) => !value)}>
              <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>{playing ? "Pause the little tour" : "Show me all the expressions"}
            </button>
            <button type="button" className={styles.pauseButton} onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Resume Alfred animation" : "Pause Alfred animation"}>{paused ? "Resume" : "Pause"}</button>
          </div>
          <label className={styles.reduceToggle}><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /><span className={styles.checkmark} /><span><strong>Reduced motion</strong><small>Show a still pose for each expression.</small></span></label>
        </aside>
      </section>

      <section className={styles.demo} aria-labelledby="demo-title">
        <div className={styles.demoNumber}>02</div>
        <div className={styles.demoCopy}><p className={styles.eyebrow}>A small interaction preview</p><h2 id="demo-title">See how a task might feel.</h2><p>This is a simulated task inside the preview. It does not create a real project, send a message, or change your workspace.</p></div>
        <div className={styles.demoPanel}>
          <div className={styles.demoActions}>
            <button type="button" onClick={runDemo} disabled={demoRunning} className={styles.demoButton}>{demoRunning ? "Preview in progress…" : "Run the preview"}<span aria-hidden="true">↗</span></button>
            <button type="button" onClick={showConsent} disabled={Boolean(consent)} className={styles.consentButton}>Preview a permission request</button>
            <p aria-live="polite">{demoMessage}</p>
          </div>
          <AlfredCompanion embedded />
        </div>
      </section>

      <footer className={styles.footer}><span>ALFRED · TEENOVATEX LABS</span><p>Thoughtful by design. Your choices always come first.</p><Link href="/">Back to TeenovateX <span aria-hidden="true">↗</span></Link></footer>
    </main>
  );
}

export default function AlfredStudio() {
  return <AlfredProvider><StudioBody /></AlfredProvider>;
}
