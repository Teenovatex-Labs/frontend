// Performance budget: fails the build if a page's first-load JavaScript grows past its limit.
// Usage: next build | tee build.log && node scripts/check-budget.mjs build.log
//
// Limits live in scripts/budget.config.json, keyed by route prefix. A route uses the
// longest matching prefix: "/admin" covers "/admin" and "/admin/members" (but not
// "/administer"). "/" only matches the landing page itself; any route without a match
// falls back to "default". To give a new surface its own limit, add one entry there.
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(new URL("./budget.config.json", import.meta.url), "utf8"));
const prefixes = Object.keys(config.routes).sort((a, b) => b.length - a.length);

function limitFor(route) {
  const match = prefixes.find((p) => route === p || (p !== "/" && route.startsWith(`${p}/`)));
  return match ? config.routes[match].kb : config.default.kb;
}

const log = readFileSync(process.argv[2] ?? "build.log", "utf8");
const rows = [...log.matchAll(/^[┌├└] [○ƒ●] (\S+)\s+[\d.]+ k?B\s+([\d.]+) (kB|MB)/gm)].map(
  ([, route, size, unit]) => ({
    route,
    sizeKb: unit === "MB" ? Number(size) * 1024 : Number(size),
    limitKb: limitFor(route),
  }),
);
if (rows.length === 0) {
  console.error("Budget check: found no routes in the build output.");
  process.exit(1);
}

const over = rows.filter((r) => r.sizeKb > r.limitKb);
if (over.length) {
  const fmt = (r) => `${r.route}: ${r.sizeKb} kB (limit ${r.limitKb} kB)`;
  const heaviest = [...rows].sort((a, b) => b.sizeKb - a.sizeKb).slice(0, 5);
  console.error(`Performance budget exceeded:\n  ${over.map(fmt).join("\n  ")}`);
  console.error(`\nHeaviest routes:\n  ${heaviest.map(fmt).join("\n  ")}`);
  console.error("\nLimits are in scripts/budget.config.json. Dynamically import heavy libraries (charts, editors).");
  process.exit(1);
}
console.log(`Performance budget OK for ${rows.length} routes.`);
