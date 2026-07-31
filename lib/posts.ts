import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import type { TopicSlug } from "./topics";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  /**
   * Slugs from lib/topics.ts. The frontmatter key is `topics`, not `tags` — one
   * vocabulary now covers posts, projects and jobs, so calling the post's half
   * of it something different was the thing keeping them apart.
   */
  topics: TopicSlug[];
  /** Whole minutes at 200 wpm, floored to 1. */
  readingTime: number;
  wordCount: number;
  /**
   * Optional. The length of the stretch of time the piece is *about*, in days —
   * `spanDays: 51` for an essay about fifty-one days of a pipeline shipping
   * nothing. The post page sets the words written against it, which is the one
   * measurement a piece of writing can make about itself. Omit it and the line
   * is not printed; there is no default and nothing is estimated.
   */
  spanDays?: number;
};

export type Post = PostMeta & { content: string };

function readPostFile(slug: string): Post {
  const full = path.join(POSTS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);
  const words = content.trim().split(/\s+/).length;
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    description: String(data.description ?? ""),
    topics: Array.isArray(data.topics) ? (data.topics.map(String) as TopicSlug[]) : [],
    readingTime: Math.max(1, Math.round(words / 200)),
    wordCount: words,
    spanDays: Number.isFinite(Number(data.spanDays)) && data.spanDays != null
      ? Number(data.spanDays)
      : undefined,
    content,
  };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPosts(): PostMeta[] {
  return getAllSlugs()
    .map((slug) => {
      const { content, ...meta } = readPostFile(slug);
      void content;
      return meta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post {
  return readPostFile(slug);
}

/** `2026-07-28` → `28 July 2026`. Written out, because the site reads like a person. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Headings for the in-page table of contents.
 *
 * Uses github-slugger — the exact slugger rehype-slug uses — rather than
 * reimplementing it. A hand-rolled version got "Secrets & config" wrong
 * (`secrets-config` vs `secrets--config`, because github-slugger replaces each
 * space individually instead of collapsing runs), which silently produced anchors
 * that pointed nowhere.
 */
export function tableOfContents(markdown: string): { id: string; text: string }[] {
  const slugger = new GithubSlugger();
  return [...markdown.matchAll(/^##\s+(.+)$/gm)].map(([, raw]) => {
    const text = raw.replace(/[*_`]/g, "").trim();
    return { text, id: slugger.slug(text) };
  });
}

/** Posts carrying a given topic, newest first. */
export function getPostsByTopic(topic: string): PostMeta[] {
  return getAllPosts().filter((p) => (p.topics as string[]).includes(topic));
}

/** Every topic a post actually uses, with counts. */
export function getTopicCounts(): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) {
    for (const t of p.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

/**
 * Up to `limit` posts related to `slug`, ranked by shared topics. Falls back to
 * the newest other posts so the section is never empty on a small blog.
 */
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const others = all.filter((p) => p.slug !== slug);
  return others
    .map((p) => ({
      post: p,
      shared: p.topics.filter((t) => current.topics.includes(t)).length,
    }))
    .sort((a, b) => b.shared - a.shared || (a.post.date < b.post.date ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.post);
}

/** Previous (older) and next (newer) post in publication order. */
export function getAdjacentPosts(slug: string): { prev?: PostMeta; next?: PostMeta } {
  const all = getAllPosts(); // newest first
  const i = all.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { next: all[i - 1], prev: all[i + 1] };
}
