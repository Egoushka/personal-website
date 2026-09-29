import type { MetadataRoute } from "next";
import { site, projects } from "@/lib/site";
import { getAllPosts } from "@/lib/posts";
import { getTopicUsage } from "@/lib/readings";
import { getDocPages, getDocSources } from "@/lib/docs";
import { getAllMethods } from "@/lib/methods";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const posts = getAllPosts();
  const methods = getAllMethods();
  // Newest post change, not `new Date()` — a rebuild that changed nothing should
  // not tell crawlers the content is fresh.
  const newest = posts.map((p) => p.updated ?? p.date).sort().at(-1);

  // Same source as the topic route's generateStaticParams, so the sitemap can
  // never list a page the build did not render. A hub with one item is rendered
  // but `noindex` (app/topics/[topic]/page.tsx), so it is left out here.
  const topics = getTopicUsage()
    .filter((t) => t.total >= 2)
    .map((t) => t.slug);

  return [
    { url: `${base}/`, lastModified: newest, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/writing/`, lastModified: newest, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/projects/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/docs/`, changeFrequency: "monthly", priority: 0.7 },
    // Methods are not posts and stay out of the feeds, but not out of search (ADR 0008).
    {
      url: `${base}/methods/`,
      lastModified: methods.map((m) => m.lastReviewed).sort().at(-1),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${base}/skills/`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/journey/`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cv/`, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // Every page of every project's docs, the same list the docs routes render.
    ...Object.keys(getDocSources()).flatMap((project) =>
      getDocPages(project).map((d) => ({
        url: `${base}${d.href}`,
        lastModified: getDocSources()[project].pulled,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ),
    ...methods.map((m) => ({
      url: `${base}/methods/${m.slug}/`,
      lastModified: m.lastReviewed,
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
      lastModified: p.updated ?? p.date,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
