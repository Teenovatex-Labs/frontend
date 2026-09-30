#!/usr/bin/env node
// Deterministically packs complete posed frames into one transparent atlas per state.
import sharp from "sharp";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "public/alfred/source");
const outputDir = path.join(root, "public/alfred/sprites");
const manifestPath = path.join(root, "public/alfred/animations.json");
const cellWidth = 256;
const cellHeight = 320;
const columns = 4;
const rows = 4;
const baseline = 303;
const maxWidth = 228;
const seatedStates = new Set(["operating", "planning", "resting", "reading"]);
const slowStates = new Set(["resting", "reading", "thinking", "curious"]);
const oneShotStates = new Set(["waking", "done", "failed"]);
const states = [
  "greeting", "reading", "curious", "playful", "offline", "operating", "planning", "thinking",
  "consent", "alerting", "resting", "waking", "failed", "celebrating", "done",
];

function detectBounds(data, info, left, top, right, bottom, threshold) {
  let minX = right;
  let minY = bottom;
  let maxX = left - 1;
  let maxY = top - 1;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha < threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function packageState(state) {
  const inputPath = path.join(sourceDir, `${state}.png`);
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width < columns * 8 || info.height < rows * 8) {
    throw new Error(`${state}.png is too small for a 4 by 4 grid`);
  }
  const frames = [];
  let widest = 0;
  let tallest = 0;

  for (let index = 0; index < columns * rows; index += 1) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cellLeft = Math.floor(col * info.width / columns);
    const cellTop = Math.floor(row * info.height / rows);
    const cellRight = Math.floor((col + 1) * info.width / columns);
    const cellBottom = Math.floor((row + 1) * info.height / rows);
    const safeLeft = cellLeft + 3;
    const safeTop = cellTop + 3;
    const safeRight = cellRight - 3;
    const safeBottom = cellBottom - 3;
    const visible = detectBounds(data, info, safeLeft, safeTop, safeRight, safeBottom, 140);
    if (!visible) throw new Error(`${state}.png frame ${index + 1} is empty at alpha 140`);
    // Near-transparent generation residue must not change apparent body size.
    // Expand the visible silhouette by three pixels to retain its antialiased edge.
    const full = visible;
    const padding = 3;
    const cropLeft = Math.max(safeLeft, full.left - padding);
    const cropTop = Math.max(safeTop, full.top - padding);
    const cropRight = Math.min(safeRight, full.left + full.width + padding);
    const cropBottom = Math.min(safeBottom, full.top + full.height + padding);
    const cropWidth = cropRight - cropLeft;
    const cropHeight = cropBottom - cropTop;
    frames.push({ index, cropLeft, cropTop, cropWidth, cropHeight, visible });
    widest = Math.max(widest, cropWidth);
    tallest = Math.max(tallest, cropHeight);
  }

  // One scale for the entire animation keeps Alfred's proportions stable between frames.
  const maxHeight = seatedStates.has(state) ? 214 : 284;
  const scale = Math.min(maxWidth / widest, maxHeight / tallest);
  const layers = [];
  for (const frame of frames) {
    const width = Math.max(1, Math.round(frame.cropWidth * scale));
    const height = Math.max(1, Math.round(frame.cropHeight * scale));
    const left = Math.round((cellWidth - width) / 2);
    const top = Math.round(baseline - height);
    if (left < 0 || top < 0 || left + width > cellWidth || top + height > cellHeight) {
      throw new Error(`${state}.png frame ${frame.index + 1} would clip in the normalized cell`);
    }
    const framePng = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .extract({ left: frame.cropLeft, top: frame.cropTop, width: frame.cropWidth, height: frame.cropHeight })
      .resize(width, height, { fit: "fill", kernel: "lanczos3" })
      .png()
      .toBuffer();
    layers.push({ input: framePng, left: (frame.index % columns) * cellWidth + left, top: Math.floor(frame.index / columns) * cellHeight + top });
  }

  const sheetBuffer = await sharp({
    create: {
      width: cellWidth * columns,
      height: cellHeight * rows,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(layers).png().toBuffer();

  const webpBuffer = await sharp(sheetBuffer).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toBuffer();
  const webpMetadata = await sharp(webpBuffer).metadata();
  if (webpMetadata.width !== cellWidth * columns || webpMetadata.height !== cellHeight * rows || !webpMetadata.hasAlpha) {
    throw new Error(`${state} WebP atlas dimensions or transparency are invalid`);
  }
  const { data: packedData, info: packedInfo } = await sharp(webpBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < columns * rows; index += 1) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const left = col * cellWidth;
    const top = row * cellHeight;
    let hasAlpha = false;
    let hasTransparency = false;
    for (let y = top; y < top + cellHeight; y += 1) {
      for (let x = left; x < left + cellWidth; x += 1) {
        const alpha = packedData[(y * packedInfo.width + x) * packedInfo.channels + 3];
        if (alpha > 0) hasAlpha = true;
        if (alpha < 255) hasTransparency = true;
      }
    }
    if (!hasAlpha) throw new Error(`${state} output frame ${index + 1} is empty`);
    if (!hasTransparency) throw new Error(`${state} output frame ${index + 1} lost transparency`);
  }

  const outputPath = path.join(outputDir, `${state}.webp`);
  await writeFile(outputPath, webpBuffer);
  return { source: `/alfred/sprites/${state}.webp`, frames: columns * rows, fps: state === "operating" ? 20 : slowStates.has(state) ? 8 : 12, loop: !oneShotStates.has(state) };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const requested = process.argv.slice(2);
  for (const state of requested) {
    if (!states.includes(state)) throw new Error(`Unknown Alfred state: ${state}`);
  }
  const selected = requested.length
    ? [...new Set(requested)]
    : (await Promise.all(states.map(async (state) => (await exists(path.join(sourceDir, `${state}.png`)) ? state : null)))).filter(Boolean);
  if (!selected.length) throw new Error(`No state artwork found in ${sourceDir}`);

  const prior = (await exists(manifestPath)) ? JSON.parse(await readFile(manifestPath, "utf8")) : {};
  const animations = { ...(prior.animations ?? {}) };
  for (const state of selected) animations[state] = await packageState(state);
  // Permission and reconnection both use the approved patient waiting artwork.
  // The permission controller and explicit decisions remain distinct from network status.
  if (!await exists(path.join(sourceDir, "consent.png")) && animations.offline) {
    animations.consent = { ...animations.offline, fps: 8, sharesArtworkWith: "offline" };
  }
  const orderedAnimations = Object.fromEntries(Object.entries(animations).sort(([left], [right]) => states.indexOf(left) - states.indexOf(right)));
  const manifest = { version: 2, cellWidth, cellHeight, columns, animations: orderedAnimations };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Packaged ${selected.length} Alfred animation${selected.length === 1 ? "" : "s"}: ${selected.join(", ")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
