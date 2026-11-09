import test from "node:test";
import assert from "node:assert/strict";
import { moodForEvent, moodForReaction, poseFor } from "../src/lib/alfred-expressions.ts";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../public/alfred/animations.json", import.meta.url), "utf8"));

test("every mood he can be in maps to a pose that really exists, or to stillness", () => {
  for (const m of ["idle", "curious", "thinking", "excited", "surprised", "amused", "encouraging", "celebrating", "confused", "serious"]) {
    const pose = poseFor(m);
    assert.ok(pose === null || manifest.animations[pose], `${m} -> ${pose}`);
  }
});

test("reactions choose the matching mood, and unknown ones fall back to curious", () => {
  assert.equal(moodForReaction("playful"), "amused");
  assert.equal(moodForReaction("serious"), "serious");
  assert.equal(moodForReaction("supportive"), "encouraging");
  assert.equal(moodForReaction("made-up"), "curious");
  assert.equal(moodForReaction(null), "curious");
});

test("a serious reaction never gets a playful pose", () => {
  assert.notEqual(poseFor(moodForReaction("serious")), "playful");
});

test("with no reaction he stays still, except for the first question", () => {
  assert.equal(poseFor(moodForEvent({ kind: "question" })), null);
  assert.equal(poseFor(moodForEvent({ kind: "question", first: true })), "curious");
  assert.equal(poseFor(moodForEvent({ kind: "finished" })), "celebrating");
  assert.equal(poseFor(moodForEvent({ kind: "fallback" })), "failed");
});
