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

  // Cloudflare prepends its own managed block to the served file; see README.
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
