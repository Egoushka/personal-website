import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "./posts";
import { now, projects, usesUpdated } from "./site";

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
  /** Lines of source per published word. Currently, embarrassingly, above 1. */
  linesPerWord: number;
  nowUpdated: string;
  daysSinceNow: number;
  usesVerified: string;
  projects: number;
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
    latest: latest && {
      title: latest.title,
      slug: latest.slug,
      date: latest.date,
      wordCount: latest.wordCount,
    },
    daysSinceLatest: latest ? daysBetween(latest.date, builtOn) : undefined,
    codeLines,
    cssLines,
    linesPerWord: words ? (codeLines + cssLines) / words : 0,
    nowUpdated: now.updated,
    daysSinceNow: daysBetween(now.updated, builtOn),
    usesVerified: usesUpdated,
    projects: projects.length,
  };
}

/** `1394` → `1,394`. Used everywhere a figure is printed. */
export function n(x: number): string {
  return x.toLocaleString("en-US");
}
