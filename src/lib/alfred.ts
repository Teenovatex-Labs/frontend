export const ALFRED_STATES = {
  greeting: { label: "Saying hello", animation: "greeting" },
  reading: { label: "Reading", animation: "reading" },
  curious: { label: "Curious", animation: "curious" },
  playful: { label: "Playing", animation: "playful" },
  offline: { label: "Offline", animation: "offline" },
  operating: { label: "Working", animation: "operating" },
  planning: { label: "Planning", animation: "planning" },
  thinking: { label: "Thinking", animation: "thinking" },
  consent: { label: "Needs your say", animation: "consent" },
  alerting: { label: "Has an update", animation: "alerting" },
  resting: { label: "Taking a breather", animation: "resting" },
  waking: { label: "Waking up", animation: "waking" },
  failed: { label: "Hit a snag", animation: "failed" },
  celebrating: { label: "Celebrating", animation: "celebrating" },
  done: { label: "Done", animation: "done" },
} as const;

export type AlfredState = keyof typeof ALFRED_STATES;
export type AlfredTaskState = "operating" | "planning" | "thinking";
export type AlfredActivityState = AlfredTaskState | "reading" | "curious";
export type AlfredNoticeKind = "info" | "success" | "warning" | "error";

export type AlfredConsent = {
  id: string;
  title: string;
  message: string;
  requestedAt: number;
};

export type AlfredNotice = {
  id: string;
  message: string;
  kind: AlfredNoticeKind;
};

export type AlfredSnapshot = {
  state: AlfredState;
  message: string;
  consent: AlfredConsent | null;
  notice: AlfredNotice | null;
  minimized: boolean;
  hidden: boolean;
};

export type AlfredTaskHandle = {
  id: string;
  update(message?: string, state?: AlfredTaskState): void;
  done(message?: string): void;
  fail(message?: string): void;
  cancel(): void;
};

type Task = { id: string; message: string; state: AlfredTaskState; sequence: number };
type Listener = () => void;

const MINIMIZED_KEY = "tx_alfred_minimized";
const HIDDEN_KEY = "tx_alfred_hidden";
const IDLE_AFTER_MS = 45_000;
const DONE_MS = 3_000;
const CELEBRATING_MS = 3_200;
const FAILED_MS = 2_400;
const GREETING_MS = 3_400;
const WAKING_MS = 3_400;
const PLAYFUL_MS = 3_600;
const CURIOUS_MS = 1_200;
const NOTICE_MS = 5_000;

function readPreference(key: string): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writePreference(key: string, value: boolean): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, String(value));
  } catch {
    // Storage can be disabled or unavailable in private browsing contexts.
  }
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Framework-independent state machine used by the React provider and API client. */
export class AlfredController {
  private listeners = new Set<Listener>();
  private tasks = new Map<string, Task>();
  private pendingFailures: string[] = [];
  private sequence = 0;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private transientTimer: ReturnType<typeof setTimeout> | undefined;
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;
  private visible = true;
  private reducedMotion = false;
  private offline = false;
  private sessionGeneration = 0;
  private consentResolver: ((approved: boolean) => void) | undefined;
  private snapshot: AlfredSnapshot = {
    state: "resting",
    message: "I’m here when you need me.",
    consent: null,
    notice: null,
    minimized: false,
    hidden: false,
  };

  constructor(readPreferences = true) {
    if (readPreferences) {
      this.snapshot.minimized = readPreference(MINIMIZED_KEY);
      this.snapshot.hidden = readPreference(HIDDEN_KEY);
    }
  }

  getSnapshot = (): AlfredSnapshot => this.snapshot;
  getServerSnapshot = (): AlfredSnapshot => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private publish(patch: Partial<AlfredSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = undefined;
  }

  private clearTransientTimer(): void {
    if (this.transientTimer) clearTimeout(this.transientTimer);
    this.transientTimer = undefined;
  }

  private scheduleNoticeExpiry(): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => {
      this.publish({ notice: null });
      this.restore();
    }, NOTICE_MS);
  }

  private scheduleIdle(): void {
    this.clearIdleTimer();
    if (!this.visible || this.tasks.size || this.snapshot.consent || this.snapshot.notice || this.offline) return;
    this.idleTimer = setTimeout(() => {
      if (this.tasks.size || this.snapshot.consent || this.snapshot.notice || !this.visible || this.offline) return;
      this.publish({ state: "resting", message: "Taking a little rest." });
    }, IDLE_AFTER_MS);
  }

  private activeTask(): Task | undefined {
    return [...this.tasks.values()].sort((a, b) => b.sequence - a.sequence)[0];
  }

  private showFailure(message: string): void {
    this.clearTransientTimer();
    this.publish({ state: "failed", message });
    this.transientTimer = setTimeout(() => this.restore(), FAILED_MS);
  }

  private restore(): void {
    if (this.snapshot.consent) {
      this.publish({ state: "consent", message: this.snapshot.consent.message });
      return;
    }
    if (this.offline) {
      this.publish({ state: "offline", message: "I’ll be ready when you’re back online." });
      return;
    }
    const active = this.activeTask();
    if (active) {
      this.publish({ state: active.state, message: active.message });
      return;
    }
    if (this.snapshot.notice) {
      this.publish({ state: "alerting", message: this.snapshot.notice.message });
      return;
    }
    const pendingFailure = this.pendingFailures.shift();
    if (pendingFailure) {
      this.showFailure(pendingFailure);
      return;
    }
    this.publish({ state: "curious", message: "Ready for your next idea." });
    this.scheduleIdle();
  }

  beginTask(message: string, state: AlfredTaskState = "operating"): AlfredTaskHandle {
    const id = makeId();
    const generation = this.sessionGeneration;
    const task: Task = { id, message, state, sequence: ++this.sequence };
    this.tasks.set(id, task);
    this.clearIdleTimer();
    this.clearTransientTimer();
    if (!this.snapshot.consent && !this.snapshot.notice && !this.offline) this.publish({ state, message });
    return {
      id,
      update: (nextMessage, nextState) => {
        if (generation !== this.sessionGeneration) return;
        const current = this.tasks.get(id);
        if (!current) return;
        current.sequence = ++this.sequence;
        if (nextMessage) current.message = nextMessage;
        if (nextState) current.state = nextState;
        if (!this.snapshot.consent && !this.snapshot.notice && !this.offline && this.activeTask()?.id === id) {
          this.publish({ state: current.state, message: current.message });
        }
      },
      done: (completionMessage) => {
        if (generation !== this.sessionGeneration) return;
        if (!this.tasks.delete(id)) return;
        if (this.snapshot.consent || this.snapshot.notice || this.offline) return;
        this.clearTransientTimer();
        const next = this.activeTask();
        if (next) {
          this.publish({ state: next.state, message: next.message });
          return;
        }
        this.publish({ state: "done", message: completionMessage ?? "All done." });
        this.transientTimer = setTimeout(() => {
          if (!this.tasks.size && !this.snapshot.consent && !this.snapshot.notice) {
            this.publish({ state: "celebrating", message: completionMessage ?? "Nice work!" });
            this.transientTimer = setTimeout(() => this.restore(), CELEBRATING_MS);
          }
        }, DONE_MS);
      },
      fail: (failureMessage) => {
        if (generation !== this.sessionGeneration) return;
        if (!this.tasks.delete(id)) return;
        this.pendingFailures.push(failureMessage ?? "That didn’t work. You can try again.");
        this.restore();
      },
      cancel: () => {
        if (generation !== this.sessionGeneration) return;
        if (!this.tasks.delete(id)) return;
        this.clearTransientTimer();
        this.restore();
      },
    };
  }

  notePresence(): void {
    if (
      !this.visible || this.snapshot.hidden || this.snapshot.consent || this.snapshot.notice ||
      this.offline || this.tasks.size
    ) return;

    if (this.snapshot.state === "resting") {
      this.wake();
      return;
    }
    if (this.snapshot.state === "curious" || this.snapshot.state === "reading") {
      this.scheduleIdle();
    }
  }

  setActivity(state: AlfredActivityState, message: string = ALFRED_STATES[state].label): void {
    this.clearIdleTimer();
    this.clearTransientTimer();
    if (!this.snapshot.consent && !this.snapshot.notice && !this.offline && !this.tasks.size) {
      this.publish({ state, message });
      if (state === "curious") {
        this.transientTimer = setTimeout(() => this.restore(), CURIOUS_MS);
      }
      this.scheduleIdle();
    }
  }

  requestConsent(input: { title: string; message: string }): Promise<boolean> {
    if (this.snapshot.consent) return Promise.resolve(false);
    this.clearIdleTimer();
    this.clearTransientTimer();
    return new Promise((resolve) => {
      this.consentResolver = resolve;
      const consent = { id: makeId(), ...input, requestedAt: Date.now() };
      this.publish({ consent, state: "consent", message: consent.message });
    });
  }

  resolveConsent(approved: boolean): void {
    if (!this.snapshot.consent || !this.consentResolver) return;
    const resolve = this.consentResolver;
    this.consentResolver = undefined;
    this.publish({ consent: null });
    resolve(approved);
    if (this.snapshot.notice) this.scheduleNoticeExpiry();
    this.restore();
  }

  notify(message: string, kind: AlfredNoticeKind = "info"): void {
    const notice = { id: makeId(), message, kind };
    if (this.snapshot.consent || this.offline) {
      this.publish({ notice });
      this.scheduleNoticeExpiry();
      return;
    }
    this.clearIdleTimer();
    this.clearTransientTimer();
    this.publish({ notice, state: "alerting", message });
    this.scheduleNoticeExpiry();
  }

  wake(): void {
    this.clearIdleTimer();
    if (this.snapshot.hidden || this.snapshot.consent || this.offline) return;
    if (this.snapshot.state === "resting" || this.snapshot.state === "curious" || this.snapshot.state === "done" || this.snapshot.state === "failed") {
      this.clearTransientTimer();
      this.publish({ state: "waking", message: "I’m back with you." });
      this.transientTimer = setTimeout(() => this.restore(), WAKING_MS);
    }
  }

  greet(): void {
    if (this.snapshot.hidden || this.snapshot.consent || this.tasks.size || this.offline) return;
    this.clearIdleTimer();
    this.clearTransientTimer();
    this.publish({ state: "greeting", message: "Hi! Good to see you." });
    this.transientTimer = setTimeout(() => this.restore(), GREETING_MS);
  }

  play(): void {
    if (this.snapshot.hidden || this.snapshot.consent || this.tasks.size || this.offline) return;
    this.clearIdleTimer();
    this.clearTransientTimer();
    this.publish({ state: "playful", message: "Hehe!" });
    this.transientTimer = setTimeout(() => this.restore(), PLAYFUL_MS);
  }

  setOffline(value: boolean): void {
    this.offline = value;
    this.clearTransientTimer();
    if (this.snapshot.consent) return;
    if (value) this.publish({ state: "offline", message: "I’ll be ready when you’re back online." });
    else this.restore();
  }

  setMinimized(value: boolean): void {
    writePreference(MINIMIZED_KEY, value);
    this.publish({ minimized: value });
  }

  setHidden(value: boolean): void {
    writePreference(HIDDEN_KEY, value);
    this.publish({ hidden: value });
    if (!value) this.wake();
  }

  setVisible(value: boolean): void {
    this.visible = value;
    if (!value) this.clearIdleTimer();
    else this.scheduleIdle();
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  resetSession(): void {
    this.sessionGeneration += 1;
    this.tasks.clear();
    this.pendingFailures = [];
    this.clearIdleTimer();
    this.clearTransientTimer();
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.noticeTimer = undefined;
    const resolve = this.consentResolver;
    this.consentResolver = undefined;
    this.publish({
      state: this.offline ? "offline" : "resting",
      message: this.offline ? "I’ll be ready when you’re back online." : "I’m here when you need me.",
      consent: null,
      notice: null,
    });
    resolve?.(false);
  }

  destroy(): void {
    this.clearIdleTimer();
    this.clearTransientTimer();
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.listeners.clear();
  }
}

export const alfredController = new AlfredController();
