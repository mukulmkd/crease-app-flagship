/**
 * Generate PWA / home-screen icons that match BrandMark
 * (clubhouse #082417 + lime crease mark #c9f64b).
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public/icons");
const appDir = path.join(__dirname, "../src/app");

const CLUBHOUSE = "#082417";
const LIME = "#C9F64B";

/**
 * Cricket crease mark centered in a square — same geometry as BrandMark
 * (side posts + bottom bar + center stump).
 * @param {number} size
 * @param {{ safeZone?: number }} [opts] safeZone 0–1; maskable uses ~0.2 padding
 */
function brandSvg(size, { safeZone = 0 } = {}) {
  const inset = size * safeZone;
  const canvas = size - inset * 2;
  // Match BrandMark proportions: mark is ~50% of the 40px tile.
  const mark = canvas * 0.5;
  const stroke = Math.max(2, Math.round(size * 0.045));
  const centerStroke = Math.max(2, Math.round(size * 0.02));
  const x = inset + (canvas - mark) / 2;
  const y = inset + (canvas - mark) / 2;
  const cx = x + mark / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${CLUBHOUSE}"/>
  <!-- Left post -->
  <rect x="${x}" y="${y}" width="${stroke}" height="${mark}" fill="${LIME}"/>
  <!-- Right post -->
  <rect x="${x + mark - stroke}" y="${y}" width="${stroke}" height="${mark}" fill="${LIME}"/>
  <!-- Bottom crease -->
  <rect x="${x}" y="${y + mark - stroke}" width="${mark}" height="${stroke}" fill="${LIME}"/>
  <!-- Center stump -->
  <rect x="${cx - centerStroke / 2}" y="${y}" width="${centerStroke}" height="${mark}" fill="${LIME}"/>
</svg>`;
}

async function writePng(filePath, size, opts) {
  const svg = Buffer.from(brandSvg(size, opts));
  await sharp(svg).png({ compressionLevel: 9 }).toFile(filePath);
  console.log(
    `wrote ${path.relative(process.cwd(), filePath)} (${size}x${size})`,
  );
}

await mkdir(outDir, { recursive: true });

await writePng(path.join(outDir, "icon-192.png"), 192);
await writePng(path.join(outDir, "icon-512.png"), 512);
// Maskable: keep mark inside ~80% safe zone for Android adaptive icons.
await writePng(path.join(outDir, "icon-maskable-512.png"), 512, {
  safeZone: 0.18,
});
// iOS home screen (Add to Home Screen uses apple-touch-icon).
await writePng(path.join(outDir, "apple-touch-icon.png"), 180);

// Next.js App Router conventions — favicon + apple-icon for <head>.
await writePng(path.join(appDir, "icon.png"), 32);
await writePng(path.join(appDir, "apple-icon.png"), 180);

// Optional SVG source of truth for the mark.
await writeFile(
  path.join(outDir, "icon.svg"),
  brandSvg(512).replace(
    'width="512" height="512"',
    'width="512" height="512" role="img" aria-label="Crease"',
  ),
  "utf8",
);

console.log("PWA icons regenerated from BrandMark.");
