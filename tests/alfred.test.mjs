import test from "node:test";
import assert from "node:assert/strict";
import { AlfredController, HOVER_LINGER_MS, DRAG_LINGER_MS } from "../src/lib/alfred.ts";

// Time is faked so "a few seconds later" doesn't make the suite slow or flaky.
const clock = (t) => t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
const make = () => new AlfredController(false);

test("he starts out standing still", () => {
  const alfred = make();
  const s = alfred.getSnapshot();
  assert.equal(s.state, "idle");
  assert.equal(s.animation, null);
  assert.equal(s.bubble, false);
  alfred.destroy();
});

test("nothing moves him on its own, however long we wait", (t) => {
  clock(t);
  const alfred = make();
  t.mock.timers.tick(10 * 60_000);
  assert.equal(alfred.getSnapshot().animation, null);
  alfred.destroy();
});

test("hovering makes him look at you, and he settles a few seconds after you leave", (t) => {
  clock(t);
  const alfred = make();
  alfred.setHover(true);
  assert.equal(alfred.getSnapshot().animation, "curious");
  t.mock.timers.tick(60_000); // hovering for a long time keeps him looking
  assert.equal(alfred.getSnapshot().animation, "curious");

  alfred.setHover(false);
  t.mock.timers.tick(HOVER_LINGER_MS - 200);
  assert.equal(alfred.getSnapshot().animation, "curious");
  t.mock.timers.tick(400);
  assert.equal(alfred.getSnapshot().animation, null);
  alfred.destroy();
});

test("being dragged makes him playful, then he settles quickly after you let go", (t) => {
  clock(t);
  const alfred = make();
  alfred.setDragging(true);
  assert.equal(alfred.getSnapshot().animation, "playful");
  alfred.setDragging(false);
  assert.equal(alfred.getSnapshot().animation, "playful");
  t.mock.timers.tick(DRAG_LINGER_MS + 100);
  assert.equal(alfred.getSnapshot().animation, null);
  alfred.destroy();
});

test("while working he works; when the job ends he reacts once and goes still", (t) => {
  clock(t);
  const alfred = make();
  const task = alfred.beginTask("Saving your lab", "operating");
  assert.equal(alfred.getSnapshot().animation, "operating");
  assert.equal(alfred.getSnapshot().bubble, true);
  task.done("Saved");
  assert.equal(alfred.getSnapshot().state, "done");
  t.mock.timers.tick(5_000);
  assert.equal(alfred.getSnapshot().animation, null);
  assert.equal(alfred.getSnapshot().bubble, false);
  alfred.destroy();
});

test("overlapping jobs keep him working until the last one finishes", (t) => {
  clock(t);
  const alfred = make();
  const a = alfred.beginTask("One");
  const b = alfred.beginTask("Two", "thinking");
  assert.equal(alfred.getSnapshot().state, "thinking");
  a.done();
  assert.equal(alfred.getSnapshot().state, "thinking");
  b.done();
  assert.equal(alfred.getSnapshot().state, "done");
  alfred.destroy();
});

test("a failed job shows a snag, then he goes still", (t) => {
  clock(t);
  const alfred = make();
  alfred.beginTask("Saving").fail("Couldn't save");
  assert.equal(alfred.getSnapshot().state, "failed");
  assert.equal(alfred.getSnapshot().message, "Couldn't save");
  t.mock.timers.tick(5_000);
  assert.equal(alfred.getSnapshot().animation, null);
  alfred.destroy();
});

test("asking permission beats everything else and waits for an answer", async (t) => {
  clock(t);
  const alfred = make();
  alfred.beginTask("Working");
  alfred.setHover(true);
  const answer = alfred.requestConsent({ title: "Delete it?", message: "This removes your lab." });
  assert.equal(alfred.getSnapshot().state, "consent");
  t.mock.timers.tick(60_000); // no timeout: he keeps waiting
  assert.equal(alfred.getSnapshot().state, "consent");
  alfred.resolveConsent(true);
  assert.equal(await answer, true);
  assert.equal(alfred.getSnapshot().consent, null);
  assert.equal(alfred.getSnapshot().state, "operating"); // back to the job underneath
  alfred.destroy();
});

test("denying returns false, and only one question is asked at a time", async () => {
  const alfred = make();
  const first = alfred.requestConsent({ title: "A", message: "a" });
  assert.equal(await alfred.requestConsent({ title: "B", message: "b" }), false);
  alfred.resolveConsent(false);
  assert.equal(await first, false);
  alfred.destroy();
});

test("'Always allow' is remembered for that action only, and can be revoked", async () => {
  const alfred = make();
  const asked = alfred.requestConsent({ title: "Mark read?", message: "m", actionId: "notifications.read-all" });
  alfred.resolveConsent(true, true);
  assert.equal(await asked, true);

  assert.equal(await alfred.requestConsent({ title: "Mark read?", message: "m", actionId: "notifications.read-all" }), true);
  assert.equal(alfred.getSnapshot().consent, null, "no card is shown the second time");

  const other = alfred.requestConsent({ title: "Follow?", message: "f", actionId: "follow" });
  assert.equal(alfred.getSnapshot().state, "consent", "a different action still asks");
  alfred.resolveConsent(false);
  await other;

  alfred.revokeAlwaysAllowed();
  const again = alfred.requestConsent({ title: "Mark read?", message: "m", actionId: "notifications.read-all" });
  assert.equal(alfred.getSnapshot().state, "consent");
  alfred.resolveConsent(false);
  await again;
  alfred.destroy();
});

test("'Always allow' does nothing for a one-off action", async () => {
  const alfred = make();
  const asked = alfred.requestConsent({ title: "Sign out?", message: "s" });
  alfred.resolveConsent(true, true); // no actionId, so nothing to remember
  await asked;
  const next = alfred.requestConsent({ title: "Sign out?", message: "s" });
  assert.equal(alfred.getSnapshot().state, "consent");
  alfred.resolveConsent(false);
  await next;
  alfred.destroy();
});

test("an update makes him alert once, then it fades", (t) => {
  clock(t);
  const alfred = make();
  alfred.notify("Sam voted for your lab");
  assert.equal(alfred.getSnapshot().state, "alerting");
  assert.equal(alfred.getSnapshot().message, "Sam voted for your lab");
  t.mock.timers.tick(7_000);
  assert.equal(alfred.getSnapshot().animation, null);
  assert.equal(alfred.getSnapshot().notice, null);
  alfred.destroy();
});

test("saying yo greets you, opens the chat, and goes still again", (t) => {
  clock(t);
  const alfred = make();
  alfred.yo();
  const s = alfred.getSnapshot();
  assert.equal(s.state, "greeting");
  assert.equal(s.chatOpen, true);
  assert.equal(s.messages.at(-1)?.from, "alfred");
  t.mock.timers.tick(4_000);
  assert.equal(alfred.getSnapshot().animation, null);
  assert.equal(alfred.getSnapshot().chatOpen, true, "the chat stays open");
  alfred.destroy();
});

test("saying yo again replays the greeting", (t) => {
  clock(t);
  const alfred = make();
  alfred.yo();
  const first = alfred.getSnapshot().runKey;
  alfred.yo();
  assert.notEqual(alfred.getSnapshot().runKey, first);
  alfred.destroy();
});

test("being offline shows a message but he stays still", () => {
  const alfred = make();
  alfred.setOffline(true);
  const s = alfred.getSnapshot();
  assert.equal(s.state, "offline");
  assert.equal(s.animation, null);
  assert.equal(s.bubble, true);
  alfred.setOffline(false);
  assert.equal(alfred.getSnapshot().state, "idle");
  alfred.destroy();
});

test("minimizing closes the chat", () => {
  const alfred = make();
  alfred.setChatOpen(true);
  alfred.setMinimized(true);
  assert.equal(alfred.getSnapshot().minimized, true);
  assert.equal(alfred.getSnapshot().chatOpen, false);
  alfred.destroy();
});

test("the chat keeps what was said, capped, and can be cleared", () => {
  const alfred = make();
  for (let i = 0; i < 80; i++) alfred.hear(`msg ${i}`);
  assert.equal(alfred.getSnapshot().messages.length, 60);
  assert.equal(alfred.getSnapshot().messages.at(-1)?.text, "msg 79");
  alfred.clearChat();
  assert.equal(alfred.getSnapshot().messages.length, 0);
  alfred.destroy();
});

test("a new session forgets the last person's job, question and chat", async () => {
  const alfred = make();
  const task = alfred.beginTask("Old job");
  const asked = alfred.requestConsent({ title: "Old?", message: "o" });
  alfred.hear("secret");
  alfred.resetSession();
  const s = alfred.getSnapshot();
  assert.equal(s.state, "idle");
  assert.equal(s.consent, null);
  assert.equal(s.messages.length, 0);
  assert.equal(await asked, false);
  task.done("late"); // from the old session: must be ignored
  assert.equal(alfred.getSnapshot().state, "idle");
  alfred.destroy();
});

test("a tour walks through its steps, then ends", () => {
  const alfred = make();
  alfred.startTour([{ message: "One", path: "/a" }, { message: "Two" }, { message: "Three" }]);
  let s = alfred.getSnapshot();
  assert.equal(s.tour?.index, 0);
  assert.equal(s.tour?.total, 3);
  assert.equal(s.message, "One");
  assert.equal(s.bubble, true);
  assert.equal(s.state, "greeting");

  const step = alfred.nextTour();
  assert.equal(step?.message, "Two");
  assert.equal(alfred.getSnapshot().message, "Two");
  alfred.nextTour();
  assert.equal(alfred.nextTour(), null); // past the last step
  s = alfred.getSnapshot();
  assert.equal(s.tour, null);
  assert.equal(s.state, "idle");
  assert.equal(s.bubble, false);
  alfred.destroy();
});

test("the tour can be skipped at any point", () => {
  const alfred = make();
  alfred.startTour([{ message: "One" }, { message: "Two" }]);
  alfred.endTour();
  assert.equal(alfred.getSnapshot().tour, null);
  assert.equal(alfred.getSnapshot().state, "idle");
  assert.equal(alfred.nextTour(), null); // nothing to advance
  alfred.destroy();
});

test("each tour step replays his greeting", () => {
  const alfred = make();
  alfred.startTour([{ message: "One" }, { message: "Two" }]);
  const first = alfred.getSnapshot().runKey;
  alfred.nextTour();
  assert.notEqual(alfred.getSnapshot().runKey, first);
  alfred.destroy();
});

test("a permission request interrupts the tour and the tour resumes after", async () => {
  const alfred = make();
  alfred.startTour([{ message: "One" }, { message: "Two" }]);
  const answer = alfred.requestConsent({ title: "Sure?", message: "Really?" });
  assert.equal(alfred.getSnapshot().state, "consent");
  alfred.resolveConsent(true);
  await answer;
  assert.equal(alfred.getSnapshot().message, "One");
  assert.equal(alfred.getSnapshot().tour?.index, 0);
  alfred.destroy();
});

test("a new session ends any tour", () => {
  const alfred = make();
  alfred.startTour([{ message: "One" }]);
  alfred.resetSession();
  assert.equal(alfred.getSnapshot().tour, null);
  alfred.destroy();
});
