import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parseMarkdown, countWords, headings } from "./markdown.mjs";
import type { TopicSlug } from "./topics";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  /** Slugs from lib/topics.ts, the one vocabulary posts, projects and jobs share. */
  topics: TopicSlug[];
  /** Whole minutes at 200 wpm, floored to 1. */
  readingTime: number;
  /** Words of prose — text and inline code; fenced code and markup are not counted. */
  wordCount: number;
  /**
   * Optional. The length of the stretch of time the piece is *about*, in days —
   * `spanDays: 51` for an essay about fifty-one days of a pipeline shipping
   * nothing. The post page sets the words written against it, which is the one
   * measurement a piece of writing can make about itself. Omit it and the line
   * is not printed; there is no default and nothing is estimated.
   */
  spanDays?: number;
  /** Optional frontmatter, read as-is. Validated by validate-content, rendered by the post page. */
  updated?: string;
  /** Optional frontmatter: a note describing what a later edit corrected. */
  correction?: string;
};

export type Post = PostMeta & { content: string };

function readPostFile(slug: string): Post {
  const full = path.join(POSTS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(full, "utf8");
  const { data, content } = matter(raw);
  const words = countWords(parse(content));
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
    updated: typeof data.updated === "string" ? data.updated : undefined,
    correction: typeof data.correction === "string" ? data.correction : undefined,
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
    .sort(byNewest);
}

/** Newest first; the slug breaks ties, so two posts on one day always sort the same way. */
export function byNewest(a: PostMeta, b: PostMeta): number {
  return b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
}

// A post body is parsed once per build, however many callers ask about it.
const trees = new Map<string, ReturnType<typeof parseMarkdown>>();
function parse(markdown: string) {
  let tree = trees.get(markdown);
  if (!tree) trees.set(markdown, (tree = parseMarkdown(markdown)));
  return tree;
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
 * The `##` headings, for the in-page table of contents, with the ids rehype-slug
 * gives them on the page: both go through github-slugger over the same text, and
 * every heading is slugged in order so repeats are numbered alike. Read from the
 * parsed tree, so a `## ` line inside a code fence is not a heading.
 */
export function tableOfContents(markdown: string): { id: string; text: string }[] {
  return headings(parse(markdown))
    .filter((h) => h.depth === 2)
    .map(({ id, text }) => ({ id, text }));
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
    .sort((a, b) => b.shared - a.shared || byNewest(a.post, b.post))
    .slice(0, limit)
    .map((x) => x.post);
}
