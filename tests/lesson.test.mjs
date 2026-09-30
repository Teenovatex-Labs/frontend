import test from "node:test";
import assert from "node:assert/strict";
import { parseLesson } from "../src/lib/lesson.ts";

test("headings, paragraphs, bullets and code become separate blocks", () => {
  const blocks = parseLesson("Intro line one\ncontinues here.\n\n## Steps\n\n- first\n- **second**\n\n    <h1>Hi</h1>\n    <p>There</p>\n\nDone.");
  assert.deepEqual(blocks, [
    { type: "p", text: "Intro line one continues here." },
    { type: "h", text: "Steps" },
    { type: "ul", items: ["first", "**second**"] },
    { type: "code", text: "<h1>Hi</h1>\n<p>There</p>" },
    { type: "p", text: "Done." },
  ]);
});

test("empty and whitespace-only lessons give no blocks", () => {
  assert.deepEqual(parseLesson(""), []);
  assert.deepEqual(parseLesson("\n  \n"), []);
});

test("Windows line endings are handled", () => {
  assert.deepEqual(parseLesson("## A\r\n\r\nText"), [{ type: "h", text: "A" }, { type: "p", text: "Text" }]);
});

test("markup in lesson text stays plain text, never HTML", () => {
  const [block] = parseLesson("<script>alert(1)</script>");
  assert.deepEqual(block, { type: "p", text: "<script>alert(1)</script>" });
});
