import type { MetadataRoute } from "next";
import { site, isPrelive } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Prelive is a tailnet address that nothing can crawl, so this is insurance
  // rather than a control: it is what keeps a staging copy out of results if it
  // is ever reachable from somewhere else.
  if (isPrelive) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /search/ has nothing to index, and /lab/ is unfinished prototypes kept
      // so the directions can be compared. Neither is secret: this is about
      // keeping junk out of results, not access control.
      // (Cloudflare prepends its own managed block to this file; see README.)
      disallow: ["/search/", "/lab/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
