// Alfred's brain: a small state machine with no React in it, so it can be tested on its own.
//
// The rule that shapes everything here: Alfred is STILL unless something specific is happening.
// From strongest to weakest, what makes him move is:
//   1. he is asking your permission
//   2. he is working on something
//   3. he has an update for you
//   4. a one-off reaction is playing (greeting you, finishing a job, hitting a snag)
//   5. you are dragging him
//   6. you are hovering over him, or did within the last few seconds
// When none of those is true he stands in one still pose and nothing on screen changes.

export const ALFRED_STATES = {
  idle: { label: "Here", animation: null },
  curious: { label: "Looking at you", animation: "curious" },
  greeting: { label: "Saying hello", animation: "greeting" },
  playful: { label: "Being carried", animation: "playful" },
  offline: { label: "Offline", animation: null },
  operating: { label: "Working", animation: "operating" },
  planning: { label: "Planning", animation: "planning" },
  thinking: { label: "Thinking", animation: "thinking" },
  consent: { label: "Needs your say", animation: "consent" },
  alerting: { label: "Has an update", animation: "alerting" },
  failed: { label: "Hit a snag", animation: "failed" },
  celebrating: { label: "Celebrating", animation: "celebrating" },
  done: { label: "Done", animation: "done" },
} as const;

export type AlfredState = keyof typeof ALFRED_STATES;
export type AlfredAnimation = NonNullable<(typeof ALFRED_STATES)[AlfredState]["animation"]>;
export type AlfredTaskState = "operating" | "planning" | "thinking";
export type AlfredNoticeKind = "info" | "success" | "warning" | "error";

export type AlfredConsent = {
  id: string;
  title: string;
  message: string;
  requestedAt: number;
  /** Low-risk, self-only actions can offer "Always allow". */
  actionId?: string;
};

export type AlfredNotice = { id: string; message: string; kind: AlfredNoticeKind };

export type ChatMessage = { id: string; from: "you" | "alfred"; text: string; at: number };

export type TourStep = { message: string; path?: string };
export type TourState = { index: number; total: number; step: TourStep };

export type AlfredSnapshot = {
  state: AlfredState;
  /** What the sprite should play, or null for the still pose. */
  animation: AlfredAnimation | null;
  /** Changes every time an animation should start over, even if it is the same one. */
  runKey: number;
  /** What the speech bubble says when there is something to say. */
  message: string;
  bubble: boolean;
  consent: AlfredConsent | null;
  notice: AlfredNotice | null;
  /** A guided walkthrough in progress, or null. */
  tour: TourState | null;
  minimized: boolean;
  chatOpen: boolean;
  messages: ChatMessage[];
};

export type AlfredTaskHandle = {
  id: string;
  update(message?: string, state?: AlfredTaskState): void;
  done(message?: string): void;
  fail(message?: string): void;
  cancel(): void;
};

type Task = { id: string; message: string; state: AlfredTaskState; sequence: number };
type Transient = { state: "greeting" | "done" | "failed" | "celebrating"; message: string; until: number };
type Listener = () => void;

const MINIMIZED_KEY = "tx_alfred_minimized";
const ALWAYS_KEY = "tx_alfred_always_allow";

/** How long he keeps reacting after your pointer leaves him, and after you let go of him. */
export const HOVER_LINGER_MS = 3_000;
export const DRAG_LINGER_MS = 900;
const GREETING_MS = 2_600;
const DONE_MS = 2_000;
const CELEBRATE_MS = 2_600;
const FAILED_MS = 2_800;
const NOTICE_MS = 6_000;
const MAX_MESSAGES = 60;

function readFlag(key: string): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, String(value));
  } catch {
    // Storage can be blocked (private browsing); the preference just won't stick.
  }
}

function readAlways(): Set<string> {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(ALWAYS_KEY) : null;
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class AlfredController {
  private listeners = new Set<Listener>();
  private tasks = new Map<string, Task>();
  private sequence = 0;
  private runKey = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;
  private hovering = false;
  private hoverUntil = 0;
  private dragging = false;
  private dragUntil = 0;
  private offline = false;
  private transient: Transient | null = null;
  private tourSteps: TourStep[] = [];
  private tourIndex = -1;
  private sessionGeneration = 0;
  private always: Set<string>;
  private consentResolver: ((approved: boolean) => void) | undefined;
  private snapshot: AlfredSnapshot = {
    state: "idle",
    animation: null,
    runKey: 0,
    message: "",
    bubble: false,
    consent: null,
    notice: null,
    tour: null,
    minimized: false,
    chatOpen: false,
    messages: [],
  };

  constructor(readPreferences = true) {
    this.always = readPreferences ? readAlways() : new Set();
    if (readPreferences) this.snapshot.minimized = readFlag(MINIMIZED_KEY);
  }

  getSnapshot = (): AlfredSnapshot => this.snapshot;
  getServerSnapshot = (): AlfredSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit(patch: Partial<AlfredSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private activeTask(): Task | undefined {
    return [...this.tasks.values()].sort((a, b) => b.sequence - a.sequence)[0];
  }

  /** Works out what he should be doing right now and publishes it if anything changed. */
  private refresh(): void {
    const now = Date.now();
    if (this.transient && now >= this.transient.until) this.transient = null;

    let state: AlfredState = "idle";
    let message = "";
    let bubble = false;
    const { consent, notice } = this.snapshot;
    const task = this.activeTask();
    const touring = this.tourIndex >= 0 ? this.tourSteps[this.tourIndex] : undefined;

    if (consent) {
      state = "consent";
      message = consent.message;
      bubble = true;
    } else if (task) {
      state = task.state;
      message = task.message;
      bubble = true;
    } else if (notice) {
      state = "alerting";
      message = notice.message;
      bubble = true;
    } else if (touring) {
      // A step of the walkthrough: he greets you, and the bubble carries the step's words.
      state = 'greeting';
      message = touring.message;
      bubble = true;
    } else if (this.transient) {
      state = this.transient.state;
      message = this.transient.message;
      bubble = this.transient.state !== "greeting";
    } else if (this.dragging || now < this.dragUntil) {
      state = "playful";
    } else if (this.hovering || now < this.hoverUntil) {
      state = "curious";
    } else if (this.offline) {
      state = "offline";
      message = "You're offline. I'll be here when you're back.";
      bubble = true;
    }

    const previous = this.snapshot;
    const changed = state !== previous.state;
    if (changed || message !== previous.message || bubble !== previous.bubble) {
      if (changed) this.runKey += 1;
      this.emit({
        state,
        animation: ALFRED_STATES[state].animation,
        runKey: this.runKey,
        message,
        bubble,
      });
    }
    this.scheduleNext(now);
  }

  /** Wakes the machine at the next moment something on a timer would change. */
  private scheduleNext(now: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const deadlines = [this.transient?.until, this.hovering ? undefined : this.hoverUntil, this.dragging ? undefined : this.dragUntil]
      .filter((t): t is number => typeof t === "number" && t > now);
    if (deadlines.length === 0) return;
    this.timer = setTimeout(() => this.refresh(), Math.min(...deadlines) - now + 20);
  }

  private startTransient(state: Transient["state"], message: string, ms: number): void {
    this.transient = { state, message, until: Date.now() + ms };
    this.runKey += 1; // replays even if the same reaction is already showing
    this.snapshot = { ...this.snapshot, runKey: this.runKey };
    this.refresh();
    // A same-state replay does not change `state`, so publish the new key explicitly.
    this.emit({ runKey: this.runKey });
  }

  // --- what the app can tell him ---------------------------------------------------------

  setHover(value: boolean): void {
    this.hovering = value;
    if (value) this.hoverUntil = 0;
    else this.hoverUntil = Date.now() + HOVER_LINGER_MS;
    this.refresh();
  }

  setDragging(value: boolean): void {
    this.dragging = value;
    if (!value) this.dragUntil = Date.now() + DRAG_LINGER_MS;
    this.refresh();
  }

  beginTask(message: string, state: AlfredTaskState = "operating"): AlfredTaskHandle {
    const id = makeId();
    const generation = this.sessionGeneration;
    this.tasks.set(id, { id, message, state, sequence: ++this.sequence });
    this.refresh();
    const live = () => generation === this.sessionGeneration;
    return {
      id,
      update: (nextMessage, nextState) => {
        const current = this.tasks.get(id);
        if (!live() || !current) return;
        current.sequence = ++this.sequence;
        if (nextMessage) current.message = nextMessage;
        if (nextState) current.state = nextState;
        this.refresh();
      },
      done: (completionMessage) => {
        if (!live() || !this.tasks.delete(id)) return;
        if (this.tasks.size === 0) this.startTransient("done", completionMessage ?? "All done.", DONE_MS);
        else this.refresh();
      },
      fail: (failureMessage) => {
        if (!live() || !this.tasks.delete(id)) return;
        this.startTransient("failed", failureMessage ?? "That didn't work. You can try again.", FAILED_MS);
      },
      cancel: () => {
        if (!live() || !this.tasks.delete(id)) return;
        this.refresh();
      },
    };
  }

  requestConsent(input: { title: string; message: string; actionId?: string }): Promise<boolean> {
    if (input.actionId && this.always.has(input.actionId)) return Promise.resolve(true);
    if (this.snapshot.consent) return Promise.resolve(false);
    return new Promise((resolve) => {
      this.consentResolver = resolve;
      this.snapshot = { ...this.snapshot, consent: { id: makeId(), requestedAt: Date.now(), ...input } };
      this.refresh();
      this.emit({ consent: this.snapshot.consent });
    });
  }

  resolveConsent(approved: boolean, always = false): void {
    const { consent } = this.snapshot;
    const resolve = this.consentResolver;
    if (!consent || !resolve) return;
    if (approved && always && consent.actionId) {
      this.always.add(consent.actionId);
      try {
        window.localStorage.setItem(ALWAYS_KEY, JSON.stringify([...this.always]));
      } catch {
        // Not remembered, but this one time still goes ahead.
      }
    }
    this.consentResolver = undefined;
    this.snapshot = { ...this.snapshot, consent: null };
    this.emit({ consent: null });
    this.refresh();
    resolve(approved);
  }

  /** Forget every "Always allow" the member has granted. */
  revokeAlwaysAllowed(): void {
    this.always.clear();
    try {
      window.localStorage.removeItem(ALWAYS_KEY);
    } catch {
      // Nothing stored that we could clear.
    }
  }

  notify(message: string, kind: AlfredNoticeKind = "info"): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    const notice = { id: makeId(), message, kind };
    this.snapshot = { ...this.snapshot, notice };
    this.runKey += 1;
    this.refresh();
    this.emit({ notice, runKey: this.runKey });
    this.noticeTimer = setTimeout(() => {
      this.noticeTimer = undefined;
      this.snapshot = { ...this.snapshot, notice: null };
      this.emit({ notice: null });
      this.refresh();
    }, NOTICE_MS);
  }

  /** "Yo": he greets you back and opens the chat. */
  yo(reply = "Yo! What's up?"): void {
    this.setChatOpen(true);
    this.startTransient("greeting", reply, GREETING_MS);
    this.say(reply);
  }

  celebrate(message = "Nice work!"): void {
    this.startTransient("celebrating", message, CELEBRATE_MS);
  }

  setOffline(value: boolean): void {
    this.offline = value;
    this.refresh();
  }

  setMinimized(value: boolean): void {
    writeFlag(MINIMIZED_KEY, value);
    this.emit({ minimized: value, ...(value ? { chatOpen: false } : {}) });
  }

  // --- guided tour ------------------------------------------------------------------------

  private publishTour(): void {
    const step = this.tourSteps[this.tourIndex];
    const tour = step ? { index: this.tourIndex, total: this.tourSteps.length, step } : null;
    this.runKey += 1; // each step replays his greeting
    this.snapshot = { ...this.snapshot, tour, runKey: this.runKey };
    this.refresh();
    this.emit({ tour, runKey: this.runKey });
  }

  startTour(steps: TourStep[]): void {
    if (steps.length === 0) return;
    this.tourSteps = steps;
    this.tourIndex = 0;
    this.publishTour();
  }

  /** Moves on, and returns the step now showing (so the app can take the member there), or null at the end. */
  nextTour(): TourStep | null {
    if (this.tourIndex < 0) return null;
    this.tourIndex += 1;
    if (this.tourIndex >= this.tourSteps.length) {
      this.endTour();
      return null;
    }
    this.publishTour();
    return this.tourSteps[this.tourIndex] ?? null;
  }

  endTour(): void {
    this.tourIndex = -1;
    this.tourSteps = [];
    this.snapshot = { ...this.snapshot, tour: null };
    this.emit({ tour: null });
    this.refresh();
  }

  // --- chat -----------------------------------------------------------------------------

  setChatOpen(value: boolean): void {
    this.emit({ chatOpen: value });
  }

  private push(from: ChatMessage["from"], text: string): void {
    const messages = [...this.snapshot.messages, { id: makeId(), from, text, at: Date.now() }].slice(-MAX_MESSAGES);
    this.emit({ messages });
  }

  say(text: string): void {
    this.push("alfred", text);
  }

  hear(text: string): void {
    this.push("you", text);
  }

  clearChat(): void {
    this.emit({ messages: [] });
  }

  // --- lifecycle ------------------------------------------------------------------------

  /** Called when the signed-in member changes: nothing from the last person may carry over. */
  resetSession(): void {
    this.sessionGeneration += 1;
    this.tasks.clear();
    this.transient = null;
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
    const resolve = this.consentResolver;
    this.consentResolver = undefined;
    this.tourIndex = -1;
    this.tourSteps = [];
    this.snapshot = { ...this.snapshot, consent: null, notice: null, tour: null };
    this.emit({ consent: null, notice: null, tour: null, messages: [], chatOpen: false });
    this.refresh();
    resolve?.(false);
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.listeners.clear();
  }
}

export const alfredController = new AlfredController();
