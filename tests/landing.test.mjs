import test from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../src/lib/landing.ts";

test("honours same-site paths", () => {
  assert.equal(safeNext("/admin"), "/admin");
  assert.equal(safeNext("/labs/my-lab?x=1"), "/labs/my-lab?x=1");
});

test("falls back to home for anything that could leave the site or loop", () => {
  for (const bad of [null, undefined, "", "admin", "//evil.com", "https://evil.com", "/\\evil.com", "/auth", "/login?next=/x", "javascript:alert(1)"]) {
    assert.equal(safeNext(bad), "/home", String(bad));
  }
});
