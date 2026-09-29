import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { TopicSlug } from "./topics";

/**
 * Methods: how I work, where two or more projects do it the same way (ADR 0008).
 *
 * A method is not a post. It has no date and no kind, it is kept current and
 * says when it was last reviewed, and it stays out of the feeds. `projects` is
 * the one field that ties a method to a project: a project's page lists the
 * methods that name it, read from here, never from lib/site.ts. The rules are
 * scripts/validate-content.mjs; this reads the files as they are.
 *
 * Reads the filesystem: never import it from a client component.
 */
const METHODS_DIR = path.join(process.cwd(), "content", "methods");

export type MethodMeta = {
  slug: string;
  /** The rule itself, in sentence case: an imperative or a plain claim. */
  title: string;
  description: string;
  /** `YYYY-MM-DD`, the day it was last checked against the projects it names. */
  lastReviewed: string;
  /** Slugs of the projects in lib/site.ts that follow it, two or more. */
  projects: string[];
  /** Slugs of the published posts that tell the stories behind it. May be empty. */
  posts: string[];
  /** Slugs from lib/topics.ts, the one vocabulary. */
  topics: TopicSlug[];
};

export type Method = MethodMeta & { content: string };

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

/** One method's file, parsed as-is: a method the validator would reject still reads. */
export function parseMethod(slug: string, raw: string): Method {
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    lastReviewed: String(data.lastReviewed ?? ""),
    projects: strings(data.projects),
    posts: strings(data.posts),
    topics: strings(data.topics) as TopicSlug[],
    content,
  };
}

export function getMethodSlugs(): string[] {
  if (!fs.existsSync(METHODS_DIR)) return [];
  return fs
    .readdirSync(METHODS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getMethod(slug: string): Method {
  return parseMethod(slug, fs.readFileSync(path.join(METHODS_DIR, `${slug}.md`), "utf8"));
}

/**
 * The index's order: the method more projects follow comes first — it is more
 * how I work and less how one project went — then by title, then by slug, so
 * the order never depends on the directory listing.
 */
export function byFollowing(a: MethodMeta, b: MethodMeta): number {
  return b.projects.length - a.projects.length || a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug);
}

export function getAllMethods(): MethodMeta[] {
  return getMethodSlugs()
    .map((slug) => {
      const { content, ...meta } = getMethod(slug);
      void content;
      return meta;
    })
    .sort(byFollowing);
}

/** The methods a project follows, for its page: every method whose `projects` names it. */
export function getProjectMethods(project: string): MethodMeta[] {
  return getAllMethods().filter((m) => m.projects.includes(project));
}

/** The methods a post tells a story behind, for the one line under it. */
export function getPostMethods(post: string): MethodMeta[] {
  return getAllMethods().filter((m) => m.posts.includes(post));
}
