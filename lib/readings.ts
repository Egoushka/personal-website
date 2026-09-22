import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "./posts";
import { now, projects, experience, usesUpdated } from "./site";
import { ALL_TOPICS, type TopicSlug } from "./topics";

/**
 * Every counted figure on the site, in one place.
 *
 * **No figure is typed by hand if the build can count it.** Post counts, word
 * counts, ages and the code-to-prose ratio are computed here from
 * `content/posts`, `lib/site.ts` and the source tree, every build. A
 * hand-maintained number is a claim pretending to be evidence — and it is how an
 * earlier version of this site ended up printing a 79-day silence that had never
 * happened.
 *
 * This file is what survived the trial-balance design. The claims, the balance
 * column and the expiries went with it (ADR 0002); the counting stayed, because
 * counting is what keeps a warm, informal voice from reading as an unserious
 * one. Figures that genuinely cannot be counted from this repo live beside the
 * thing they describe and name their source — see `Project.readings`.
 *
 * Build-time only: reads the filesystem and the build clock. **Never import this
 * from a client component.**
 */

const DAY_MS = 86_400_000;

/** Directories whose source counts against the code-to-prose ratio. */
const SOURCE_DIRS = ["app", "components", "lib"];
const STYLESHEET = path.join("app", "globals.css");

/** Whole days between two ISO dates. Both parse as UTC midnight, so no DST drift. */
function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
}

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
  /** Build date, UTC. Every age below is measured from it. */
  builtOn: string;
  posts: number;
  words: number;
  latest?: { title: string; slug: string; date: string; wordCount: number };
  daysSinceLatest?: number;
  codeLines: number;
  cssLines: number;
  nowUpdated: string;
  daysSinceNow: number;
  usesVerified: string;
  projects: number;
  /** Of those, how many are still running. Counted, so "all three" cannot rot. */
  projectsRunning: number;
  /**
   * The longest stretch of time any post is *about* (`spanDays`), and the post
   * that is about it. The hero sentence and the proof row both cite this figure
   * and neither types it: the 51 in "not 51 days later" is the frontmatter of
   * content/posts/silent-deploys.md, read at build.
   *
   * Undefined when no post carries a span, and every line that cites it is
   * written to disappear rather than print a blank.
   */
  longestSpan?: { days: number; slug: string; title: string };
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

  const spanned = posts
    .filter((p): p is typeof p & { spanDays: number } => typeof p.spanDays === "number")
    .sort((a, b) => b.spanDays - a.spanDays)[0];

  return {
    builtOn,
    posts: posts.length,
    words,
    latest: latest && {
      title: latest.title,
      slug: latest.slug,
      date: latest.date,
      wordCount: latest.wordCount,
    },
    daysSinceLatest: latest ? daysBetween(latest.date, builtOn) : undefined,
    codeLines,
    cssLines,
    nowUpdated: now.updated,
    daysSinceNow: daysBetween(now.updated, builtOn),
    usesVerified: usesUpdated,
    projects: projects.length,
    projectsRunning: projects.filter((p) => p.status === "running").length,
    longestSpan: spanned && {
      days: spanned.spanDays,
      slug: spanned.slug,
      title: spanned.title,
    },
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
 * cycle. It is the single source for three questions that were being answered
 * separately and had already drifted: which topics get a page
 * (`/topics/[topic]/generateStaticParams`), which go in the sitemap, and which
 * the home page lists. The home page used to ask a fourth, narrower question —
 * "which topics do posts use" — which is why a section headed "things I keep
 * coming back to" listed four tags and left six topic pages reachable only from
 * each other.
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

/**
 * "latest today" / "latest 1 day ago" / "latest 6 days ago".
 *
 * Both call sites printed "latest 0 days ago" on the day something shipped,
 * which is the same class of bug as the "1 days ago" that was fixed in three
 * places earlier: a plural rule applied to a number whose edge cases are words,
 * not digits. One function, so the next page to print this cannot disagree.
 */
export function latestPhrase(days: number | undefined): string {
  if (days === undefined) return "";
  if (days <= 0) return "latest today";
  if (days === 1) return "latest yesterday";
  return `latest ${days} days ago`;
}
