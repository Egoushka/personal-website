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
      // /admin/ is the CMS shell, /search/ has nothing to index, and /lab/ is
      // three unfinished prototypes kept so the directions can be compared —
      // two of them superseded by /skills/ and /journey/. None is secret: this
      // is about keeping junk out of results, not access control. They stay
      // reachable by URL on purpose.
      // (Cloudflare prepends its own managed block to this file; see README.)
      disallow: ["/admin/", "/search/", "/lab/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
