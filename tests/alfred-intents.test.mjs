import test from "node:test";
import assert from "node:assert/strict";
import { interpret } from "../src/lib/alfred-intents.ts";

const kind = (text) => interpret(text).kind;
const go = (text) => {
  const i = interpret(text);
  assert.equal(i.kind, "go", `"${text}" should navigate`);
  return i.to;
};

test("greetings", () => {
  for (const t of ["yo", "Hey!", "hello", "hi there", "good morning"]) assert.equal(kind(t), "greet", t);
});

test("help", () => {
  assert.equal(kind("help"), "help");
  assert.equal(kind("what can you do?"), "help");
});

test("going to pages, and preferring the most specific match", () => {
  assert.equal(go("open labs"), "labs");
  assert.equal(go("take me to the leaderboard"), "leaderboard");
  assert.equal(go("go to my labs"), "mylabs");
  assert.equal(go("start a lab"), "newlab");
  assert.equal(go("show me my profile"), "profile");
  assert.equal(go("open settings"), "settings");
  assert.equal(go("events"), "events");
  assert.equal(go("take me home"), "home");
  assert.equal(go("open community"), "community");
  assert.equal(go("go to my messages"), "messages");
  assert.equal(go("open notifications"), "notifications");
});

test("reading things about you", () => {
  assert.equal(kind("how many points do I have?"), "points");
  assert.equal(kind("what's my streak"), "streak");
  assert.equal(kind("what's my rank"), "rank");
  assert.equal(kind("do I have any unread notifications"), "unread");
  assert.equal(kind("what's new"), "latest");
  assert.equal(kind("upcoming events"), "events");
  assert.equal(kind("what's trending"), "trending");
  assert.equal(kind("what labs do I have"), "mylabs");
  assert.equal(kind("what's due"), "due");
  assert.equal(kind("show my tasks"), "due");
});

test("actions that change things are recognised", () => {
  assert.equal(kind("mark all notifications as read"), "readall");
  assert.equal(kind("sign out"), "signout");
  assert.deepEqual(interpret("follow @sam_dev"), { kind: "follow", username: "sam_dev", undo: false });
  assert.deepEqual(interpret("unfollow sam_dev"), { kind: "follow", username: "sam_dev", undo: true });
  assert.deepEqual(interpret("vote for Pocket Planets"), { kind: "vote", query: "pocket planets" });
  assert.deepEqual(interpret("vote for the pocket planets"), { kind: "vote", query: "pocket planets" });
});

test("a question about a page is not a command to go there", () => {
  assert.notEqual(kind("what is the leaderboard for"), "go");
});

test("nonsense and empty input are unknown", () => {
  assert.equal(kind(""), "unknown");
  assert.equal(kind("   "), "unknown");
  assert.equal(kind("banana submarine"), "unknown");
});
