// Generates the PWA / home-screen icons from a single branded SVG.
// Run:  node scripts/generate-pwa-icons.mjs
// Requires `sharp` (already a transitive dependency of Next.js image optimization).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const BRAND = "#E62E04";

// A "link" glyph (Feather-style) centered on a 512 canvas.
// `bleed` = full-square background (for maskable / Apple); otherwise a rounded square.
function svg({ glyphScale = 10.8, bleed = false } = {}) {
  const s = glyphScale;
  const t = 256 - 12 * s; // center the 24x24 glyph on the 512 canvas
  const bg = bleed
    ? `<rect width="512" height="512" fill="${BRAND}"/>`
    : `<rect width="512" height="512" rx="112" ry="112" fill="${BRAND}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${bg}
  <g transform="translate(${t} ${t}) scale(${s})" fill="none" stroke="#ffffff"
     stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, svg: svg() },
  { file: "icon-512.png", size: 512, svg: svg() },
  // Maskable: full-bleed bg + smaller glyph so it survives the circular safe-zone crop.
  { file: "icon-maskable-512.png", size: 512, svg: svg({ glyphScale: 8.6, bleed: true }) },
  // Apple touch icon: iOS applies its own rounding, so use a full-bleed square (no alpha corners).
  { file: "apple-touch-icon.png", size: 180, svg: svg({ bleed: true }) },
];

await mkdir(OUT, { recursive: true });
for (const t of targets) {
  await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toFile(join(OUT, t.file));
  console.log("wrote", join("public/icons", t.file), `(${t.size}px)`);
}
console.log("done");
