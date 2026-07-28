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
