/**
 * Generate every browser / installed-PWA icon from the approved Crease artwork.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../public/icons");
const appDir = path.join(__dirname, "../src/app");
const sourcePath = path.join(__dirname, "crease-app-logo-source.png");

const CLUBHOUSE = "#0A0C0B";
const sourceMetadata = await sharp(sourcePath).metadata();
if (!sourceMetadata.width || !sourceMetadata.height) {
  throw new Error("Could not read Crease logo source dimensions");
}
const sourceCropSize = Math.round(
  Math.min(sourceMetadata.width, sourceMetadata.height) * 0.8,
);
const sourceCropLeft = Math.round((sourceMetadata.width - sourceCropSize) / 2);
const sourceCropTop = Math.round((sourceMetadata.height - sourceCropSize) / 2);

/**
 * Resize the same master artwork for browser, Apple, and installed PWA use.
 * @param {number} size
 * @param {{ safeZone?: number }} [opts] Extra inset for maskable icon cropping.
 */
async function writePng(filePath, size, opts) {
  const safeZone = opts?.safeZone ?? 0;
  const inset = Math.round(size * safeZone);
  const artworkSize = size - inset * 2;
  const artwork = await sharp(sourcePath)
    // The generated master includes a rounded preview canvas. Crop that shell
    // away so platform-owned iOS/Android masks receive a full-bleed background.
    .extract({
      left: sourceCropLeft,
      top: sourceCropTop,
      width: sourceCropSize,
      height: sourceCropSize,
    })
    .resize(artworkSize, artworkSize, { fit: "cover" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: CLUBHOUSE,
    },
  })
    .composite([{ input: artwork, left: inset, top: inset }])
    .png({ compressionLevel: 9 })
    .toFile(filePath);
  console.log(
    `wrote ${path.relative(process.cwd(), filePath)} (${size}x${size})`,
  );
}

await mkdir(outDir, { recursive: true });

await writePng(path.join(outDir, "icon-192.png"), 192);
await writePng(path.join(outDir, "icon-512.png"), 512);
await writePng(path.join(outDir, "icon-maskable-512.png"), 512, {
  safeZone: 0.08,
});
await writePng(path.join(outDir, "apple-touch-icon.png"), 180);

await writePng(path.join(appDir, "icon.png"), 32);
await writePng(path.join(appDir, "apple-icon.png"), 180);

const sourceBase64 = (await readFile(sourcePath)).toString("base64");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Crease">
  <image width="512" height="512" href="data:image/png;base64,${sourceBase64}"/>
</svg>`;
await writeFile(path.join(outDir, "icon.svg"), svg, "utf8");
console.log("wrote public/icons/icon.svg");
