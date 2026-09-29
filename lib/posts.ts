import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parseMarkdown, countWords, headings } from "./markdown.mjs";
import { POST_KINDS } from "./post-kinds.mjs";
import type { TopicSlug } from "./topics";
import type { CyrillicLang } from "./lang";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostKind = (typeof POST_KINDS)[number];

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  /**
   * What the post owes a reader (docs/writing/README.md). The validator requires
   * it; read as-is here, so a post the validator would reject has none.
   */
  kind?: PostKind;
  /** Slug of the project in lib/site.ts the post is about, when it is about one. */
  project?: string;
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
  /** Optional frontmatter: the language of the post's Cyrillic text, for `lang` (lib/lang.ts). */
  cyrillic?: CyrillicLang;
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
    kind: (POST_KINDS as readonly unknown[]).includes(data.kind) ? (data.kind as PostKind) : undefined,
    project: typeof data.project === "string" ? data.project : undefined,
    topics: Array.isArray(data.topics) ? (data.topics.map(String) as TopicSlug[]) : [],
    readingTime: Math.max(1, Math.round(words / 200)),
    wordCount: words,
    spanDays: Number.isFinite(Number(data.spanDays)) && data.spanDays != null
      ? Number(data.spanDays)
      : undefined,
    updated: typeof data.updated === "string" ? data.updated : undefined,
    correction: typeof data.correction === "string" ? data.correction : undefined,
    cyrillic: data.cyrillic === "uk" || data.cyrillic === "ru" ? data.cyrillic : undefined,
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

/**
 * A published post's `spanDays`, for prose elsewhere that names the same stretch,
 * so the figure is read from the post rather than typed again (ADR 0002). Throws
 * when the post or its span is missing: the build fails instead of printing it.
 */
export function getSpanDays(slug: string): number {
  const days = getPost(slug).spanDays;
  if (!days) throw new Error(`post "${slug}" has no spanDays`);
  return days;
}

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** `51` → `fifty-one`: a whole number below a hundred in words, as prose writes it; figures above. */
export function inWords(x: number): string {
  if (!Number.isInteger(x) || x < 0 || x >= 100) return x.toLocaleString("en-US");
  if (x < 20) return ONES[x];
  return TENS[Math.floor(x / 10)] + (x % 10 ? `-${ONES[x % 10]}` : "");
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
 * The `##` headings (and `###` with `maxDepth` 3, as the docs use), for the
 * in-page table of contents, with the ids rehype-slug
 * gives them on the page: both go through github-slugger over the same text, and
 * every heading is slugged in order so repeats are numbered alike. Read from the
 * parsed tree, so a `## ` line inside a code fence is not a heading.
 */
export function tableOfContents(markdown: string, maxDepth: 2 | 3 = 2): { id: string; text: string; depth: number }[] {
  return headings(parse(markdown))
    .filter((h) => h.depth >= 2 && h.depth <= maxDepth)
    .map(({ id, text, depth }) => ({ id, text, depth }));
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
 * Up to `limit` posts related to `slug`: another post about the same project
 * first — it is the same story, continued — then by shared topics. Falls back to
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
      sameProject: current.project !== undefined && p.project === current.project,
      shared: p.topics.filter((t) => current.topics.includes(t)).length,
    }))
    .sort((a, b) => Number(b.sameProject) - Number(a.sameProject) || b.shared - a.shared || byNewest(a.post, b.post))
    .slice(0, limit)
    .map((x) => x.post);
}

/**
 * The posts about one project, for its page: the write-up first when it has one,
 * then the rest newest first. A post's `project` decides whether it belongs;
 * `writeup` in lib/site.ts only picks which one leads (docs/writing/README.md).
 */
export function getProjectPosts(project: string, writeup?: string): PostMeta[] {
  const posts = getAllPosts().filter((p) => p.project === project);
  const lead = posts.find((p) => p.slug === writeup);
  return lead ? [lead, ...posts.filter((p) => p !== lead)] : posts;
}
