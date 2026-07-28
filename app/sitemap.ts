import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllSlugs } from "@/lib/posts";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const staticRoutes = ["/", "/blog/", "/resume/"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
  const postRoutes = getAllSlugs().map((slug) => ({
    url: `${base}/posts/${slug}/`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...postRoutes];
}
