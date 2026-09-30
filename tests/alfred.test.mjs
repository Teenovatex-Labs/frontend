import test from "node:test";
import assert from "node:assert/strict";
import { AlfredController } from "../src/lib/alfred.ts";

const makeController = () => new AlfredController(false);

test("concurrent tasks keep the latest activity until each task settles", () => {
  const alfred = makeController();
  const first = alfred.beginTask("Saving draft");
  const second = alfred.beginTask("Loading ideas", "thinking");
  assert.equal(alfred.getSnapshot().state, "thinking");
  first.done("Draft saved");
  assert.equal(alfred.getSnapshot().state, "thinking");
  second.done("Ideas loaded");
  assert.equal(alfred.getSnapshot().state, "done");
  alfred.destroy();
});

test("pending consent stays on screen through activity, notices, and offline changes", async () => {
  const alfred = makeController();
  const approval = alfred.requestConsent({ title: "Share profile?", message: "May I share this?" });
  const task = alfred.beginTask("Loading your profile");
  alfred.notify("Your profile is ready");
  alfred.setOffline(true);
  assert.equal(alfred.getSnapshot().state, "consent");
  assert.equal(alfred.getSnapshot().consent?.title, "Share profile?");
  task.done();
  alfred.resolveConsent(false);
  assert.equal(await approval, false);
  assert.equal(alfred.getSnapshot().state, "offline");
  alfred.setOffline(false);
  assert.equal(alfred.getSnapshot().state, "alerting");
  assert.equal(alfred.getSnapshot().notice?.message, "Your profile is ready");
  alfred.destroy();
});

test("a failed task settles without leaving the controller stuck", () => {
  const alfred = makeController();
  const task = alfred.beginTask("Sending a message");
  task.fail("Message could not be sent");
  assert.equal(alfred.getSnapshot().state, "failed");
  task.done("This is ignored after failure");
  assert.equal(alfred.getSnapshot().state, "failed");
  alfred.destroy();
});

test("offline holds active tasks without marking them failed and restores them online", () => {
  const alfred = makeController();
  const task = alfred.beginTask("Loading your profile");
  alfred.setOffline(true);
  assert.equal(alfred.getSnapshot().state, "offline");
  alfred.setOffline(false);
  assert.equal(alfred.getSnapshot().state, "operating");
  task.done();
  alfred.destroy();
});

test("cancel removes a task without claiming completion", (t) => {
  const clock = fakeTimers(t);
  const alfred = makeController();
  const task = alfred.beginTask("Previewing an outline", "planning");
  task.cancel();

  assert.equal(alfred.getSnapshot().state, "curious");
  assert.equal(clock.latestDelay(), 45_000);
  clock.advance(3_000);
  assert.notEqual(alfred.getSnapshot().state, "done");
  assert.notEqual(alfred.getSnapshot().state, "celebrating");
  task.done("This completion is ignored after cancellation");
  assert.equal(alfred.getSnapshot().state, "curious");
  alfred.destroy();
});

function fakeTimers(t) {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  let now = 0;
  const timers = [];
  globalThis.setTimeout = (callback, delay = 0) => {
    const timer = { callback, delay: Number(delay), at: now + Number(delay), cancelled: false };
    timers.push(timer);
    return timer;
  };
  globalThis.clearTimeout = (timer) => {
    if (timer) timer.cancelled = true;
  };
  t.after(() => {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  });
  return {
    latestDelay: () => timers.filter((timer) => !timer.cancelled).at(-1)?.delay,
    advance: (amount) => {
      const end = now + amount;
      while (true) {
        const next = timers.filter((timer) => !timer.cancelled && timer.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!next) break;
        next.cancelled = true;
        now = next.at;
        next.callback();
      }
      now = end;
    },
  };
}

test("full state durations remain readable with reduced motion enabled", (t) => {
  const clock = fakeTimers(t);
  const alfred = makeController();
  alfred.setReducedMotion(true);

  const task = alfred.beginTask("Saving");
  task.done("Saved");
  assert.equal(clock.latestDelay(), 3_000);
  clock.advance(3_000);
  assert.equal(alfred.getSnapshot().state, "celebrating");
  assert.equal(clock.latestDelay(), 3_200);
  clock.advance(3_200);
  assert.deepEqual([alfred.getSnapshot().state, alfred.getSnapshot().message], ["curious", "Ready for your next idea."]);
  assert.equal(clock.latestDelay(), 45_000);

  alfred.greet();
  assert.equal(clock.latestDelay(), 3_400);
  clock.advance(3_400);
  alfred.wake();
  assert.equal(clock.latestDelay(), 3_400);
  clock.advance(3_400);
  alfred.play();
  assert.equal(clock.latestDelay(), 3_600);

  alfred.notify("A new note");
  assert.equal(clock.latestDelay(), 5_000);
  clock.advance(4_999);
  assert.equal(alfred.getSnapshot().notice?.message, "A new note");
  clock.advance(1);
  assert.equal(alfred.getSnapshot().notice, null);
  alfred.destroy();
});

test("reading activity returns to rest after the idle interval", (t) => {
  const clock = fakeTimers(t);
  const alfred = makeController();
  alfred.setActivity("reading", "Reading along");
  assert.equal(clock.latestDelay(), 45_000);
  clock.advance(45_000);
  assert.equal(alfred.getSnapshot().state, "resting");
  alfred.destroy();
});

test("presence resets inactivity and wakes only a resting companion", (t) => {
  const clock = fakeTimers(t);
  const alfred = makeController();
  alfred.setActivity("reading", "Reading along");

  clock.advance(30_000);
  alfred.notePresence();
  assert.deepEqual([alfred.getSnapshot().state, clock.latestDelay()], ["reading", 45_000]);
  clock.advance(44_999);
  assert.equal(alfred.getSnapshot().state, "reading");
  clock.advance(1);
  assert.equal(alfred.getSnapshot().state, "resting");

  alfred.notePresence();
  assert.equal(alfred.getSnapshot().state, "waking");
  assert.equal(clock.latestDelay(), 3_400);
  clock.advance(3_400);
  assert.equal(alfred.getSnapshot().state, "curious");
  assert.equal(clock.latestDelay(), 45_000);

  alfred.destroy();
});

test("presence does not interrupt active work or failure feedback", () => {
  const alfred = makeController();
  const task = alfred.beginTask("Saving your work");
  alfred.notePresence();
  assert.deepEqual([alfred.getSnapshot().state, alfred.getSnapshot().message], ["operating", "Saving your work"]);

  task.fail("Saving your work failed");
  alfred.notePresence();
  assert.deepEqual([alfred.getSnapshot().state, alfred.getSnapshot().message], ["failed", "Saving your work failed"]);
  alfred.destroy();
});

test("session reset denies pending consent and makes old task handles inert", async () => {
  const alfred = makeController();
  const approval = alfred.requestConsent({ title: "Share?", message: "May I share?" });
  const staleTask = alfred.beginTask("Sending a message");
  alfred.resetSession();
  assert.equal(await approval, false);
  staleTask.done("This must not restore old session data");
  staleTask.fail("This must not restore old session data");
  assert.equal(alfred.getSnapshot().state, "resting");
  assert.equal(alfred.getSnapshot().consent, null);
  alfred.destroy();
});

test("failed work waits for active work and consent before showing the error", async (t) => {
  const clock = fakeTimers(t);
  const alfred = makeController();
  const first = alfred.beginTask("Saving draft");
  const second = alfred.beginTask("Loading ideas");
  first.fail("Saving the draft failed");
  assert.equal(alfred.getSnapshot().state, "operating");
  const approval = alfred.requestConsent({ title: "Continue?", message: "Can I continue?" });
  second.done("Ideas loaded");
  alfred.resolveConsent(true);
  await approval;
  assert.deepEqual([alfred.getSnapshot().state, alfred.getSnapshot().message], ["failed", "Saving the draft failed"]);
  assert.equal(clock.latestDelay(), 2_400);
  alfred.destroy();
});
