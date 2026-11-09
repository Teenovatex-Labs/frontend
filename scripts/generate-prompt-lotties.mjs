// Deterministic generator for the two animations used by the install and notification prompts.
// Run: node scripts/generate-prompt-lotties.mjs   (writes public/lottie/install-app.json and notify-bell.json)
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const rgb = (h) => [1, 3, 5].map((i) => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)).concat(1);
const C = { cream: rgb("#fff9eb"), ink: rgb("#262822"), yellow: rgb("#f5e89e"), pink: rgb("#f3aac7"), rose: rgb("#8d355b") };
const OP = 120;
const still = (k) => ({ a: 0, k });
const ease = { i: { x: [0.25], y: [1] }, o: { x: [0.4], y: [0] } };
// keys: [[frame, value], ...] -> animated property with eased segments
const anim = (keys) => ({
  a: 1,
  k: keys.map(([t, s], n) => (n === keys.length - 1 ? { t, s } : { t, s, e: keys[n + 1][1], ...ease })),
});
const tr = (o = {}) => ({
  ty: "tr",
  p: still([0, 0]),
  a: still([0, 0]),
  s: o.s ?? still([100, 100]),
  r: still(0),
  o: o.o ?? still(100),
});
const fill = (c) => ({ ty: "fl", c: still(c), o: still(100), r: 1 });
const stroke = (c, w) => ({ ty: "st", c: still(c), o: still(100), w: still(w), lc: 2, lj: 2 });
const rect = (w, h, r, x = 0, y = 0) => ({ ty: "rc", d: 1, s: still([w, h]), p: still([x, y]), r: still(r) });
const ell = (w, h, x = 0, y = 0) => ({ ty: "el", d: 1, s: still([w, h]), p: still([x, y]) });
const shape = (items, o) => ({ ty: "gr", it: [...items, tr(o)] });
let ind = 0;
const layer = (nm, shapes, ks = {}) => ({
  ddd: 0,
  ind: ++ind,
  ty: 4,
  nm,
  sr: 1,
  ks: {
    o: ks.o ?? still(100),
    r: ks.r ?? still(0),
    p: ks.p ?? still([256, 256, 0]),
    a: ks.a ?? still([0, 0, 0]),
    s: ks.s ?? still([100, 100, 100]),
  },
  ao: 0,
  shapes,
  ip: 0,
  op: OP,
  st: 0,
  bm: 0,
});
const doc = (nm, layers) => ({ v: "5.7.0", fr: 60, ip: 0, op: OP, w: 512, h: 512, nm, ddd: 0, assets: [], layers });

// ---- Install: an app icon drops into the last free slot on a phone's home screen ----
function install() {
  ind = 0;
  const slots = [[-42, -70], [42, -70], [-42, 14], [42, 14], [-42, 98]];
  const layers = [];
  // Layers are drawn top-first, so the icon goes first.
  const sparks = [[-34, -34], [34, -40], [0, -56]].map(([x, y], n) =>
    layer(`spark${n}`, [shape([ell(14, 14), fill(C.rose)])], {
      p: still([298 + x, 354 + y, 0]),
      s: anim([[36, [0, 0, 100]], [44, [110, 110, 100]], [58, [0, 0, 100]], [OP, [0, 0, 100]]]),
    }),
  );
  layers.push(...sparks);
  layers.push(
    layer(
      "icon",
      [shape([ell(26, 26), fill(C.rose)]), shape([rect(70, 70, 18), fill(C.pink), stroke(C.ink, 6)])],
      {
        p: anim([[0, [298, 60, 0]], [30, [298, 372, 0]], [38, [298, 348, 0]], [46, [298, 354, 0]], [OP, [298, 354, 0]]]),
        s: anim([[0, [100, 100, 100]], [30, [100, 100, 100]], [34, [118, 84, 100]], [42, [96, 106, 100]], [50, [100, 100, 100]], [OP, [100, 100, 100]]]),
        o: anim([[0, [0]], [8, [100]], [104, [100]], [116, [0]], [OP, [0]]]),
      },
    ),
  );
  layers.push(
    layer(
      "ghosts",
      slots.map(([x, y]) => shape([rect(70, 70, 18, x, y), fill(C.ink)], { o: still(10) })),
      { p: still([256, 256, 0]) },
    ),
  );
  layers.push(layer("screen", [shape([rect(168, 306, 24), fill(C.yellow)])]));
  layers.push(layer("phone", [shape([rect(200, 346, 38), fill(C.cream), stroke(C.ink, 8)])]));
  // a little notch
  layers.splice(layers.length - 1, 0, layer("notch", [shape([rect(46, 8, 4), fill(C.ink)])], { p: still([256, 118, 0]) }));
  return doc("Install the app", layers);
}

// ---- Notify: a bell rings, a badge pops in ----
function notify() {
  ind = 0;
  const bellPath = {
    ty: "sh",
    ks: still({
      c: true,
      v: [[0, -95], [68, -10], [70, 50], [108, 82], [-108, 82], [-70, 50], [-68, -10]],
      i: [[-40, 0], [0, -45], [0, -15], [0, 0], [0, 0], [0, 0], [0, 40]],
      o: [[40, 0], [0, 15], [6, 12], [0, 0], [0, 0], [-6, 12], [0, -45]],
    }),
  };
  const ring = (lag, amp) =>
    anim([[lag, 0], [lag + 8, -amp], [lag + 20, amp * 0.9], [lag + 32, -amp * 0.6], [lag + 44, amp * 0.4], [lag + 56, -amp * 0.15], [lag + 68, 0], [OP, 0]].map(([t, v]) => [t, [v]]));
  const anchor = still([0, -95, 0]);
  const pos = still([256, 150, 0]);
  const wave = (side, n) =>
    layer(`wave${side}${n}`, [shape([rect(10, 36, 5), fill(C.rose)])], {
      p: still([256 + side * (128 + n * 26), 210 - n * 4, 0]),
      r: still(side * (20 + n * 14)),
      o: anim([[0, [0]], [8 + n * 6, [100]], [30 + n * 6, [0]], [OP, [0]]]),
    });
  const layers = [];
  layers.push(
    layer("badge", [shape([ell(22, 22), fill(C.ink)]), shape([ell(70, 70), fill(C.pink), stroke(C.ink, 6)])], {
      p: still([370, 140, 0]),
      s: anim([[0, [0, 0, 100]], [20, [0, 0, 100]], [30, [125, 125, 100]], [38, [100, 100, 100]], [104, [100, 100, 100]], [114, [0, 0, 100]], [OP, [0, 0, 100]]]),
    }),
  );
  layers.push(wave(-1, 0), wave(1, 0), wave(-1, 1), wave(1, 1));
  layers.push(
    layer("clapper", [shape([ell(44, 44, 0, 104), fill(C.rose), stroke(C.ink, 6)])], { p: pos, a: anchor, r: ring(4, 24) }),
  );
  layers.push(
    layer("bell", [shape([bellPath, fill(C.yellow), stroke(C.ink, 8)]), shape([ell(26, 26, 0, -102), fill(C.yellow), stroke(C.ink, 8)])], {
      p: pos,
      a: anchor,
      r: ring(0, 16),
    }),
  );
  return doc("Notifications", layers);
}

const out = join(process.cwd(), "public", "lottie");
writeFileSync(join(out, "install-app.json"), JSON.stringify(install()));
writeFileSync(join(out, "notify-bell.json"), JSON.stringify(notify()));
