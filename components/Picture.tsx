import fs from "node:fs";
import path from "node:path";

const WIDTHS = [480, 960, 1440];

/** True once `npm run images` has produced output for `name`. Lets a page render
 *  an image only if it exists, instead of the build failing on a missing file. */
export function hasPicture(name: string): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "img", `${name}.json`));
}

/**
 * Build-time-optimized image. Pairs with scripts/optimize-images.mjs.
 *
 * A plain <picture> rather than next/image: optimization is off under
 * `output: "export"`, so next/image would add a component wrapper around exactly
 * this markup and nothing else.
 *
 * width/height come from the sidecar JSON the script writes, which is what keeps
 * CLS at 0 — the browser reserves the box before the bytes land.
 *
 * `alt` is required by the type. An image that genuinely carries no information
 * should pass alt="" explicitly to be skipped by screen readers.
 */
export default function Picture({
  name,
  alt,
  sizes = "(max-width: 760px) 100vw, 760px",
  priority = false,
  className,
}: {
  name: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const metaPath = path.join(process.cwd(), "public", "img", `${name}.json`);
  if (!fs.existsSync(metaPath)) {
    throw new Error(
      `Picture: no optimized output for "${name}". Add assets/images/${name}.{jpg,png} and run \`npm run images\`.`,
    );
  }
  const { width, height } = JSON.parse(fs.readFileSync(metaPath, "utf8"));

  const available = WIDTHS.filter((w) => w <= width);
  const srcset = (ext: string) =>
    available.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(", ");
  const fallbackWidth = available[available.length - 1] ?? WIDTHS[0];

  return (
    <picture>
      <source type="image/avif" srcSet={srcset("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset("webp")} sizes={sizes} />
      <img
        src={`/img/${name}-${fallbackWidth}.jpg`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        // fetchPriority only helps the LCP candidate; everything else stays lazy.
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
