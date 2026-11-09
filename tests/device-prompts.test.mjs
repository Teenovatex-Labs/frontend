import test from "node:test";
import assert from "node:assert/strict";
import { canShowPrompt, PROMPT_RULES, recordPrompt } from "../src/lib/device-prompts.ts";

test("install prompts are capped and spaced across visits", () => {
  const now = Date.now();
  assert.equal(canShowPrompt("install", null, now), true);
  const first = recordPrompt(null, now);
  assert.equal(canShowPrompt("install", first, now + 1000), false);
  assert.equal(canShowPrompt("install", first, now + PROMPT_RULES.install.cooldown), true);
  const second = recordPrompt(first, now + PROMPT_RULES.install.cooldown);
  assert.equal(canShowPrompt("install", second, now + 10 * PROMPT_RULES.install.cooldown), false);
});

test("declines end automatic prompts and notifications show only once", () => {
  const now = Date.now();
  assert.equal(canShowPrompt("notifications", null, now), true);
  const asked = recordPrompt(null, now);
  assert.equal(canShowPrompt("notifications", asked, now + PROMPT_RULES.notifications.cooldown), false);
  assert.equal(canShowPrompt("install", recordPrompt(null, now, true), now + PROMPT_RULES.install.cooldown), false);
});
