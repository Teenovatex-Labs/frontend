// Fails if any Lottie JSON in public/lottie is over the size budget.
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const MAX = 30 * 1024;
const dir = join(process.cwd(), "public", "lottie");
if (!existsSync(dir)) process.exit(0);

let failed = false;
for (const name of readdirSync(dir)) {
  if (!name.endsWith(".json")) continue;
  const size = statSync(join(dir, name)).size;
  if (size > MAX) {
    console.error(`${name}: ${(size / 1024).toFixed(1)} KB exceeds the ${MAX / 1024} KB budget`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
