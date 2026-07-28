import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /admin/ is the CMS shell, /search/ has nothing to index. Neither is
      // secret — this is about keeping junk out of results, not access control.
      // (Cloudflare prepends its own managed block to this file; see README.)
      disallow: ["/admin/", "/search/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
