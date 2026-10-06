import fs from "node:fs";
import path from "node:path";

/** The widths scripts/optimize-images.mjs writes. */
export const PICTURE_WIDTHS = [480, 960, 1440];

const sidecar = (name: string) => path.join(process.cwd(), "public", "img", `${name}.json`);

/** True once `npm run images` has produced output for `name`. */
export function hasPicture(name: string): boolean {
  return fs.existsSync(sidecar(name));
}

/** Intrinsic size and the fallback JPEG's width, from the sidecar the image script writes. */
export function pictureMeta(name: string): { width: number; height: number; fallback: number } {
  const { width, height } = JSON.parse(fs.readFileSync(sidecar(name), "utf8"));
  const available = PICTURE_WIDTHS.filter((w) => w <= width);
  return { width, height, fallback: available[available.length - 1] ?? PICTURE_WIDTHS[0] };
}
