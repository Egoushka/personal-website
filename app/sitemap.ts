import type { MetadataRoute } from "next";
import { site, projects, experience } from "@/lib/site";
import { getAllPosts, getPostsByTopic } from "@/lib/posts";
import { ALL_TOPICS } from "@/lib/topics";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const posts = getAllPosts();
  // Newest post date, not `new Date()` — a rebuild that changed nothing should
  // not tell crawlers the content is fresh.
  const newest = posts[0]?.date;

  // Same rule as the topic route itself: only topics something references get a
  // page, so only those belong in the sitemap.
  const topics = ALL_TOPICS.filter(
    (t) =>
      getPostsByTopic(t).length > 0 ||
      projects.some((p) => (p.topics as string[]).includes(t)) ||
      experience.some((j) => (j.topics as string[]).includes(t)),
  );

  return [
    { url: `${base}/`, lastModified: newest, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/writing/`, lastModified: newest, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/projects/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cv/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/links/`, changeFrequency: "yearly", priority: 0.4 },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...topics.map((t) => ({
      url: `${base}/topics/${t}/`,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
    ...posts.map((p) => ({
      url: `${base}/writing/${p.slug}/`,
      lastModified: p.date,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
