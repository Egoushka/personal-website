import { hasPicture, pictureMeta, PICTURE_WIDTHS as WIDTHS } from "@/lib/pictures";

export { hasPicture };

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
  if (!hasPicture(name)) {
    throw new Error(
      `Picture: no optimized output for "${name}". Add assets/images/${name}.{jpg,png} and run \`npm run images\`.`,
    );
  }
  const { width, height, fallback } = pictureMeta(name);

  const available = WIDTHS.filter((w) => w <= width);
  const srcset = (ext: string) =>
    available.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(", ");

  return (
    <picture>
      <source type="image/avif" srcSet={srcset("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset("webp")} sizes={sizes} />
      <img
        src={`/img/${name}-${fallback}.jpg`}
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
