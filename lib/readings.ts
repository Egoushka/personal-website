import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "./posts";
import { projects, experience } from "./site";
import { ALL_TOPICS, type TopicSlug } from "./topics";

/**
 * Every counted figure on the site, in one place.
 *
 * **No figure is typed by hand if the build can count it.** Post counts, word
 * counts and the code-to-prose ratio are computed here from `content/posts`,
 * `lib/site.ts` and the source tree, every build. A hand-maintained number is a
 * claim pretending to be evidence. Counting is what keeps a warm, informal voice
 * from reading as an unserious one (ADR 0002). Figures that genuinely cannot be
 * counted from this repo live beside the thing they describe and name their
 * source — see `Project.readings`.
 *
 * Pages print absolute dates, never an age measured against the build date: a
 * static page keeps printing it long after the build, so "N days ago" goes
 * stale the day after a deploy.
 *
 * Build-time only: reads the filesystem and the build clock. **Never import this
 * from a client component.**
 */

/** Directories whose source counts against the code-to-prose ratio. */
const SOURCE_DIRS = ["app", "components", "lib"];
const STYLESHEET = path.join("app", "globals.css");

function walk(dir: string, keep: (file: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, keep));
    else if (keep(entry.name)) out.push(full);
  }
  return out;
}

function countLines(files: string[]): number {
  return files.reduce((n, f) => n + fs.readFileSync(f, "utf8").split("\n").length, 0);
}

export type Readings = {
  /** Build date, UTC. */
  builtOn: string;
  posts: number;
  words: number;
  latest?: { slug: string; date: string };
  codeLines: number;
  cssLines: number;
  projects: number;
  /** Of those, how many are still running. Counted, so a typed total cannot rot. */
  projectsRunning: number;
};

export function getReadings(): Readings {
  const builtOn = new Date().toISOString().slice(0, 10);
  const posts = getAllPosts(); // newest first
  const words = posts.reduce((sum, p) => sum + p.wordCount, 0);
  const latest = posts[0];

  const code = SOURCE_DIRS.flatMap((d) =>
    walk(d, (f) => f.endsWith(".ts") || f.endsWith(".tsx")),
  );
  const codeLines = countLines(code);
  const cssLines = countLines([STYLESHEET]);

  return {
    builtOn,
    posts: posts.length,
    words,
    latest: latest && { slug: latest.slug, date: latest.date },
    codeLines,
    cssLines,
    projects: projects.length,
    projectsRunning: projects.filter((p) => p.status === "running").length,
  };
}

/** `1394` → `1,394`. Used everywhere a figure is printed. */
export function n(x: number): string {
  return x.toLocaleString("en-US");
}

export type TopicUsage = {
  slug: TopicSlug;
  posts: number;
  projects: number;
  jobs: number;
  /** Everything referencing it. Zero means the topic gets no page at all. */
  total: number;
};

/**
 * How much each topic is actually backed by, counted across all three things
 * that reference the vocabulary.
 *
 * This lives here rather than in lib/topics.ts because it needs `lib/site.ts`,
 * and site.ts already imports the topic types — putting it there would be a
 * cycle. It is the single source for which topics get a page
 * (`/topics/[topic]/generateStaticParams`), which go in the sitemap, and which
 * the home page lists — asked separately, those answers drift, and a topic page
 * ends up reachable only from other topic pages.
 */
export function getTopicUsage(): TopicUsage[] {
  const posts = getAllPosts();
  return ALL_TOPICS.map((slug) => {
    const p = posts.filter((x) => (x.topics as string[]).includes(slug)).length;
    const pr = projects.filter((x) => (x.topics as string[]).includes(slug)).length;
    const j = experience.filter((x) => (x.topics as string[]).includes(slug)).length;
    return { slug, posts: p, projects: pr, jobs: j, total: p + pr + j };
  })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total || a.slug.localeCompare(b.slug));
}
