import test from "node:test";
import assert from "node:assert/strict";
import {
  RULES, blankState, decide, detectPlatform, isBusyRoute, isQuietHour, parseState,
  recordDismiss, recordDone, recordIgnored, recordNever, recordShown, recordVisit,
} from "../src/lib/prompts.ts";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 9, 12);
const ctx = (o = {}) => ({
  moment: "action", sessionShown: false, busy: false, platform: "android", standalone: false, canInstall: true,
  pushSupported: true, pushReady: true, permission: "default", subscribed: false, hour: 15, ...o,
});
const visits = (n, s = blankState()) => ({ ...s, visits: n });

test("never on the first visit", () => assert.equal(decide(visits(1), ctx(), NOW), null));
test("install is offered from the second visit after a completed action", () => assert.equal(decide(visits(2), ctx(), NOW), "install"));
test("notifications wait for the third visit", () => {
  const c = ctx({ canInstall: false });
  assert.equal(decide(visits(2), c, NOW), null);
  assert.equal(decide(visits(3), c, NOW), "notify");
});
test("no moment, no prompt", () => assert.equal(decide(visits(5), ctx({ moment: null }), NOW), null));
test("dwell only counts from the third visit", () => {
  assert.equal(decide(visits(2), ctx({ moment: "dwell" }), NOW), null);
  assert.equal(decide(visits(3), ctx({ moment: "dwell" }), NOW), "install");
});
test("at most one prompt per session", () => assert.equal(decide(visits(5), ctx({ sessionShown: true }), NOW), null));
test("never while the member is busy (forms, chats, dialogs)", () => assert.equal(decide(visits(5), ctx({ busy: true }), NOW), null));
test("quiet hours", () => {
  for (const h of [22, 23, 0, 5]) assert.equal(isQuietHour(h), true);
  for (const h of [6, 12, 21]) assert.equal(isQuietHour(h), false);
  assert.equal(decide(visits(5), ctx({ hour: 23 }), NOW), null);
});
test("installed app is never asked to install; browsers without an install prompt are not asked", () => {
  assert.equal(decide(visits(5), ctx({ standalone: true, pushReady: false }), NOW), null);
  assert.equal(decide(visits(5), ctx({ canInstall: false, pushReady: false }), NOW), null);
});
test("iOS: install guide first, notifications only once installed", () => {
  const ios = ctx({ platform: "ios", canInstall: false });
  assert.equal(decide(visits(5), ios, NOW), "install");
  assert.equal(decide(visits(5), { ...ios, standalone: true }, NOW), "notify");
  const afterInstall = recordDone(visits(5), "install");
  assert.equal(decide(afterInstall, ios, NOW), null); // still in Safari: nothing to offer
});
test("notifications are skipped when blocked, granted, subscribed or the server has no push", () => {
  const base = ctx({ canInstall: false });
  for (const o of [{ permission: "denied" }, { permission: "granted" }, { subscribed: true }, { pushReady: false }, { pushSupported: false }])
    assert.equal(decide(visits(5), { ...base, ...o }, NOW), null);
});

test("Not now pauses 7, then 14, then 30 days, and the third retires the prompt", () => {
  let s = visits(5);
  s = recordDismiss(s, "install", NOW);
  assert.equal(s.install.until, NOW + 7 * DAY);
  s = recordDismiss(s, "install", NOW);
  assert.equal(s.install.until, NOW + 14 * DAY);
  s = recordDismiss(s, "install", NOW);
  assert.equal(s.install.until, NOW + 30 * DAY);
  assert.equal(decide(s, ctx({ pushReady: false }), NOW + 365 * DAY), null);
});
test("a dismissed prompt stays quiet until its pause ends", () => {
  const s = recordDismiss(visits(5), "install", NOW);
  assert.equal(decide(s, ctx({ canInstall: false, pushReady: false }), NOW + 2 * DAY), null);
  assert.equal(decide(s, ctx({ pushReady: false }), NOW + 6 * DAY), null);
  assert.equal(decide(s, ctx({ pushReady: false }), NOW + 7 * DAY), "install");
});
test("an ignored prompt only earns a 3 day pause and no strike", () => {
  const s = recordIgnored(visits(5), "install", NOW);
  assert.equal(s.install.dismissed, 0);
  assert.equal(decide(s, ctx({ pushReady: false }), NOW + 2 * DAY), null);
  assert.equal(decide(s, ctx({ pushReady: false }), NOW + 3 * DAY), "install");
});
test("never ask again is permanent", () => assert.equal(decide(recordNever(visits(9), "install"), ctx({ pushReady: false }), NOW + 999 * DAY), null));
test("a day of silence between any two prompts", () => {
  const s = recordShown(visits(5), "install", NOW);
  const c = ctx();
  assert.equal(decide({ ...s, install: { ...s.install, until: 0, done: true } }, { ...c }, NOW + DAY / 2), null);
  assert.equal(decide({ ...s, install: { ...s.install, done: true } }, { ...c, canInstall: false }, NOW + DAY), "notify");
});
test("lifetime show cap", () => {
  let s = visits(5);
  for (let i = 0; i < RULES.maxShows; i++) s = recordShown(s, "install", NOW);
  assert.equal(decide({ ...s, lastAnyShown: 0 }, ctx({ pushReady: false }), NOW + 100 * DAY), null);
});
test("visits only go up", () => assert.equal(recordVisit(blankState()).visits, 1));

test("stored state is sanitised", () => {
  assert.deepEqual(parseState("not json"), blankState());
  assert.deepEqual(parseState(null), blankState());
  const s = parseState(JSON.stringify({ visits: -3, install: { shown: "x", never: true } }));
  assert.equal(s.visits, 0);
  assert.equal(s.install.shown, 0);
  assert.equal(s.install.never, true);
});
test("platform detection", () => {
  assert.equal(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "ios");
  assert.equal(detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "MacIntel", 5), "ios");
  assert.equal(detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "MacIntel", 0), "desktop");
  assert.equal(detectPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8)"), "android");
});
test("form-heavy routes are off limits", () => {
  for (const p of ["/messages", "/messages/abc", "/settings", "/labs/new", "/learn/web/lesson-1", "/welcome", "/search"]) assert.equal(isBusyRoute(p), true, p);
  for (const p of ["/home", "/labs", "/labs/robo", "/learn", "/learn/web", "/challenges", "/notifications"]) assert.equal(isBusyRoute(p), false, p);
});
