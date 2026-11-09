import test from "node:test";
import assert from "node:assert/strict";
import { badgeArtUrl, badgeArtProblem } from "../src/lib/badgeArt.ts";

test("served SVG art is pointed at the API host, CDN art is left alone", () => {
  assert.equal(badgeArtUrl({ image_url: "/api/v1/badges/x/image.svg" }), "http://localhost:4000/api/v1/badges/x/image.svg");
  assert.equal(badgeArtUrl({ image_url: "https://cdn.example/a.png" }), "https://cdn.example/a.png");
  assert.equal(badgeArtUrl({ image_url: null, fallback_url: "https://cdn.example/f.png" }), "https://cdn.example/f.png");
  assert.equal(badgeArtUrl({ image_url: null }), null);
});

test("only PNG and SVG within the size limits are accepted", () => {
  const f = (name, type, size) => ({ name, type, size });
  assert.equal(badgeArtProblem(f("a.png", "image/png", 500_000)), null);
  assert.equal(badgeArtProblem(f("a.svg", "image/svg+xml", 100_000)), null);
  assert.ok(badgeArtProblem(f("a.png", "image/png", 2_000_000)));
  assert.ok(badgeArtProblem(f("a.svg", "image/svg+xml", 300_000)));
  assert.ok(badgeArtProblem(f("a.gif", "image/gif", 100)));
});
