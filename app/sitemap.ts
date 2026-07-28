import type { MetadataRoute } from "next";
import { site, now } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const posts = getAllPosts();
  // Newest post date, not `new Date()` — a rebuild that changed nothing should
  // not tell crawlers the content is fresh.
  const newest = posts[0]?.date;

  return [
    { url: `${base}/`, lastModified: newest, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/blog/`, lastModified: newest, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/resume/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/uses/`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/now/`, lastModified: now.updated, changeFrequency: "monthly", priority: 0.5 },
    ...posts.map((p) => ({
      url: `${base}/posts/${p.slug}/`,
      lastModified: p.date,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
