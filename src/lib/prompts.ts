// When to ask a signed-in member to install the app or turn on notifications.
// Pure rules and state transitions only (no React, no DOM), so the timing plan is unit-tested.
// The full reasoning lives in docs/prompts.md.

export type PromptKind = "install" | "notify";
export type Platform = "ios" | "android" | "desktop" | "other";
export type Moment = "action" | "celebrate" | "dwell";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const RULES = {
  /** A prompt is never shown before this many separate visits (browser sessions). Never on the very first visit. */
  minVisits: { install: 2, notify: 3 } as Record<PromptKind, number>,
  /** Wait after a success toast so the toast is gone and the member has finished the thing they were doing. */
  afterActionMs: 5_000,
  /** Wait after a celebration card (level up, challenge result, pairing) so the member gets to enjoy it first. */
  afterCelebrateMs: 7_000,
  /** Quiet browsing with no typing counts as a calm moment after this long on one page (visit 3 onwards). */
  dwellMs: 25_000,
  dwellMinVisits: 3,
  /** A prompt that nobody touches quietly retracts after this long. It is not a "no", so it earns a short pause only. */
  ignoreRetractMs: 30_000,
  ignoredPauseMs: 3 * DAY,
  /** Pause after "Not now": 1st, 2nd, 3rd. The 3rd "Not now" retires that prompt for good. */
  dismissPauseMs: [7 * DAY, 14 * DAY, 30 * DAY],
  maxDismissals: 3,
  /** Hard lifetime cap on how many times one prompt can appear on a device. */
  maxShows: 6,
  /** After the iOS how-to guide is read, wait before suggesting it again (we cannot tell whether they did it). */
  guideSeenPauseMs: 30 * DAY,
  /** Any prompt, of either kind, then silence for this long. */
  betweenPromptsMs: DAY,
  /** No prompts from 22:00 up to 06:00 local time: school nights. */
  quietFrom: 22,
  quietUntil: 6,
} as const;

export type KindState = {
  shown: number;
  dismissed: number;
  /** Not before this time (ms since epoch). */
  until: number;
  never: boolean;
  done: boolean;
};

export type PromptState = {
  v: 1;
  visits: number;
  lastAnyShown: number;
  install: KindState;
  notify: KindState;
};

const blankKind = (): KindState => ({ shown: 0, dismissed: 0, until: 0, never: false, done: false });
export const blankState = (): PromptState => ({ v: 1, visits: 0, lastAnyShown: 0, install: blankKind(), notify: blankKind() });

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0);
const sanitizeKind = (x: unknown): KindState => {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  return { shown: num(o.shown), dismissed: num(o.dismissed), until: num(o.until), never: o.never === true, done: o.done === true };
};

/** Reads whatever was stored; anything malformed falls back to a clean slate. */
export function parseState(raw: string | null): PromptState {
  if (!raw) return blankState();
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return { v: 1, visits: num(o.visits), lastAnyShown: num(o.lastAnyShown), install: sanitizeKind(o.install), notify: sanitizeKind(o.notify) };
  } catch {
    return blankState();
  }
}

export type Context = {
  moment: Moment | null;
  /** True when this browser session already showed a prompt. */
  sessionShown: boolean;
  /** True when something else owns the member's attention (typing, a dialog, an Alfred chat, a form page). */
  busy: boolean;
  platform: Platform;
  /** Running as the installed app. */
  standalone: boolean;
  /** The browser handed us a real install prompt (Chromium on Android and desktop). */
  canInstall: boolean;
  pushSupported: boolean;
  /** The server has push configured. */
  pushReady: boolean;
  permission: "default" | "granted" | "denied" | "unsupported";
  subscribed: boolean;
  /** Local hour 0-23. */
  hour: number;
};

export function isQuietHour(hour: number): boolean {
  return hour >= RULES.quietFrom || hour < RULES.quietUntil;
}

function kindReady(k: KindState, kind: PromptKind, visits: number, now: number): boolean {
  return !k.never && !k.done && k.dismissed < RULES.maxDismissals && k.shown < RULES.maxShows && visits >= RULES.minVisits[kind] && now >= k.until;
}

/** Can this prompt make sense on this device right now, ignoring timing? */
export function applicable(kind: PromptKind, c: Context): boolean {
  if (kind === "install") return !c.standalone && (c.canInstall || c.platform === "ios");
  // iOS only delivers web push to an installed app, so there is nothing to offer before install.
  return c.pushSupported && c.pushReady && c.permission === "default" && !c.subscribed && (c.platform !== "ios" || c.standalone);
}

/** Which prompt, if any, to show right now. Install comes before notifications. */
export function decide(state: PromptState, c: Context, now: number): PromptKind | null {
  if (!c.moment || c.sessionShown || c.busy || isQuietHour(c.hour)) return null;
  if (c.moment === "dwell" && state.visits < RULES.dwellMinVisits) return null;
  if (now - state.lastAnyShown < RULES.betweenPromptsMs) return null;
  for (const kind of ["install", "notify"] as const) {
    if (applicable(kind, c) && kindReady(state[kind], kind, state.visits, now)) return kind;
  }
  return null;
}

export const momentDelay = (m: Moment) => (m === "action" ? RULES.afterActionMs : m === "celebrate" ? RULES.afterCelebrateMs : 0);

// --- state transitions (each returns a new state) ---

const withKind = (s: PromptState, kind: PromptKind, patch: Partial<KindState>): PromptState => ({ ...s, [kind]: { ...s[kind], ...patch } });

export const recordVisit = (s: PromptState): PromptState => ({ ...s, visits: s.visits + 1 });
export const recordShown = (s: PromptState, kind: PromptKind, now: number): PromptState => ({
  ...withKind(s, kind, { shown: s[kind].shown + 1 }),
  lastAnyShown: now,
});
/** "Not now" or the close button. */
export function recordDismiss(s: PromptState, kind: PromptKind, now: number): PromptState {
  const dismissed = s[kind].dismissed + 1;
  const pause = RULES.dismissPauseMs[Math.min(dismissed, RULES.dismissPauseMs.length) - 1];
  return withKind(s, kind, { dismissed, until: now + pause });
}
/** Nobody touched it, or the member started typing somewhere else. */
export const recordIgnored = (s: PromptState, kind: PromptKind, now: number): PromptState => withKind(s, kind, { until: now + RULES.ignoredPauseMs });
export const recordGuideSeen = (s: PromptState, kind: PromptKind, now: number): PromptState => withKind(s, kind, { until: now + RULES.guideSeenPauseMs });
export const recordNever = (s: PromptState, kind: PromptKind): PromptState => withKind(s, kind, { never: true });
export const recordDone = (s: PromptState, kind: PromptKind): PromptState => withKind(s, kind, { done: true });

// --- environment helpers ---

export function detectPlatform(ua: string, platform = "", touchPoints = 0): Platform {
  // iPadOS 13+ reports itself as a Mac, so tell it apart by touch support.
  if (/iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && touchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return "desktop";
  return "other";
}

/** Pages where a prompt would land on top of typing or a form. */
const BUSY_ROUTES = [/^\/messages(\/|$)/, /^\/settings(\/|$)/, /^\/welcome(\/|$)/, /^\/membership(\/|$)/, /^\/labs\/new(\/|$)/, /^\/learn\/[^/]+\/[^/]+/, /^\/search(\/|$)/];
export const isBusyRoute = (pathname: string) => BUSY_ROUTES.some((r) => r.test(pathname));

// --- the "something good just happened" signal ---

export const MOMENT_EVENT = "tx:moment";
/** Tell the prompt host a good moment just happened (a completed action, a celebration). Safe to call anywhere. */
export function emitMoment(kind: "action" | "celebrate") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(MOMENT_EVENT, { detail: kind }));
}

const KEY = (userId: string) => `tx_prompts:${userId}`;
export function loadState(userId: string): PromptState {
  try {
    return parseState(window.localStorage.getItem(KEY(userId)));
  } catch {
    return blankState();
  }
}
export function saveState(userId: string, s: PromptState) {
  try {
    window.localStorage.setItem(KEY(userId), JSON.stringify(s));
  } catch {
    /* storage blocked: prompts then stay quiet because visits never accumulate */
  }
}
