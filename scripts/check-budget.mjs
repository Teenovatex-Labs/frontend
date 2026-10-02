// Performance budget: fails the build if a page's first-load JavaScript grows past its limit.
// Usage: next build | tee build.log && node scripts/check-budget.mjs build.log
import { readFileSync } from "node:fs";

const LIMITS_KB = {
  default: 215, // member app and admin pages
  "/": 280, // the landing page carries the 3D and animation
  "/auth": 240,
};

const log = readFileSync(process.argv[2] ?? "build.log", "utf8");
const rows = [...log.matchAll(/^[┌├└] [○ƒ●] (\S+)\s+[\d.]+ k?B\s+([\d.]+) (kB|MB)/gm)];
if (rows.length === 0) {
  console.error("Budget check: found no routes in the build output.");
  process.exit(1);
}

const over = [];
for (const [, route, size, unit] of rows) {
  const kb = unit === "MB" ? Number(size) * 1024 : Number(size);
  const limit = LIMITS_KB[route] ?? LIMITS_KB.default;
  if (kb > limit) over.push(`${route}: ${kb} kB (limit ${limit} kB)`);
}

if (over.length) {
  console.error(`Performance budget exceeded:\n  ${over.join("\n  ")}`);
  process.exit(1);
}
console.log(`Performance budget OK for ${rows.length} routes.`);
