import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  /** Whole minutes at 200 wpm, floored to 1. */
  readingTime: number;
  wordCount: number;
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
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingTime: Math.max(1, Math.round(words / 200)),
    wordCount: words,
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

export function formatDate(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 7); // YYYY-MM to match the terminal aesthetic
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

/** Posts carrying a given tag, newest first. */
export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

/** Every tag actually used, with counts — drives /blog/ chips and the tag index. */
export function getTagCounts(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) {
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Up to `limit` posts related to `slug`, ranked by shared tags. Falls back to
 * the newest other posts so the section is never empty on a small blog.
 */
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const all = getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const others = all.filter((p) => p.slug !== slug);
  return others
    .map((p) => ({ post: p, shared: p.tags.filter((t) => current.tags.includes(t)).length }))
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
