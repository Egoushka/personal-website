import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
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
