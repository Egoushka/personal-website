#!/usr/bin/env node
/**
 * Build-time image pipeline.
 *
 * `output: "export"` disables next/image optimization, and the documented
 * alternative is a custom loader pointing at a remote service — an external
 * dependency for a site whose whole premise is self-hosting. So: sharp, at build,
 * emitting AVIF + WebP + a fallback at a few widths, consumed by <Picture>.
 *
 * Sources live in `assets/images/`, output goes to `public/img/`. Output is
 * gitignored and regenerated; sources are committed.
 *
 * Idempotent — skips any variant already newer than its source, so repeat builds
 * cost nothing.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "assets", "images");
const OUT = path.join(process.cwd(), "public", "img");
const WIDTHS = [480, 960, 1440];
const SOURCE_RE = /\.(jpe?g|png)$/i;

if (!fs.existsSync(SRC)) {
  console.log("images: no assets/images/ — nothing to do");
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });

const sources = fs.readdirSync(SRC).filter((f) => SOURCE_RE.test(f));
if (sources.length === 0) {
  console.log("images: assets/images/ is empty — nothing to do");
  process.exit(0);
}

let written = 0;
let skipped = 0;

for (const file of sources) {
  const srcPath = path.join(SRC, file);
  const base = file.replace(SOURCE_RE, "");
  const srcStat = fs.statSync(srcPath);
  const meta = await sharp(srcPath).metadata();

  for (const width of WIDTHS) {
    // Never upscale — a 480px source does not become a sharper 1440px one.
    if (meta.width && width > meta.width) continue;

    for (const [ext, opts] of [
      ["avif", { quality: 55 }],
      ["webp", { quality: 72 }],
      ["jpg", { quality: 78, mozjpeg: true }],
    ]) {
      const outPath = path.join(OUT, `${base}-${width}.${ext}`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }
      await sharp(srcPath).resize({ width }).toFormat(ext, opts).toFile(outPath);
      written++;
    }
  }

  // Intrinsic size, so <Picture> can set width/height and keep CLS at 0.
  fs.writeFileSync(
    path.join(OUT, `${base}.json`),
    JSON.stringify({ width: meta.width, height: meta.height }),
  );
}

console.log(`images: ${written} written, ${skipped} up to date, from ${sources.length} source(s)`);
