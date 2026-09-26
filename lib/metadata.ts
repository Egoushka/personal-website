import type { Metadata } from "next";
import { site, feedTypes } from "./site";

/** The root card, app/opengraph-image.tsx. Same alt as that route exports. */
const CARD = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.role}`,
};

/**
 * A page's metadata: canonical, feeds, Open Graph and Twitter card.
 *
 * A page that sets `openGraph` replaces the parent's whole object, images
 * included, so every page names its card here rather than inheriting one.
 * Next copies the title (with the layout's template) and the description into
 * the og: and twitter: tags, so they are set once.
 *
 * `ownCard`: the route segment has its own opengraph-image.tsx. Its card is
 * used only while the page's metadata names no images, so this names none.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  ownCard = false,
}: {
  title: string | { absolute: string };
  description: string;
  /** Root-relative, with the trailing slash: `/writing/`. */
  path: string;
  type?: "website" | "article" | "profile";
  ownCard?: boolean;
}): Metadata {
  const images = ownCard ? {} : { images: [CARD] };
  return {
    title,
    description,
    alternates: { canonical: path, types: feedTypes },
    openGraph: { type, url: path, siteName: site.name, locale: site.locale, ...images },
    twitter: { card: "summary_large_image", ...images },
  };
}
