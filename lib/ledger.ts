import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "./posts";
import { now, projects, usesUpdated } from "./site";

/**
 * The trial balance.
 *
 * Every claim this site makes about its owner is an entry on the left; what can
 * actually be measured about that claim is the entry on the right. Where the two
 * do not meet, the row says so and stays open.
 *
 * The one rule that makes this worth building: **no figure below is typed by
 * hand if it can be counted.** Post counts, word counts, ages, the code-to-prose
 * ratio and every expiry are computed here at build time from `content/posts`,
 * `lib/site.ts` and the source tree itself. A hand-maintained number is a claim
 * pretending to be evidence, which is the exact failure this page exists to
 * catch — and it is how the first mockup of this design ended up printing a
 * 79-day silence that had never happened.
 *
 * Figures that genuinely cannot be counted from this repo (Chronicle's archive,
 * Baseline's behaviour) are typed, and each one names where it came from. If a
 * claim needs a number that can neither be counted nor sourced, the claim does
 * not belong here.
 *
 * Build-time only — reads the filesystem and the build clock. **Never import
 * this from a client component.**
 */

const DAY_MS = 86_400_000;

/** Directories whose source counts against the code-to-prose ratio. */
const SOURCE_DIRS = ["app", "components", "lib"];
const STYLESHEET = path.join("app", "globals.css");

/** Whole days between two ISO dates. Both parse as UTC midnight, so no DST drift. */
function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
}

/** `2026-07` + 6 → `2027-01`. Month arithmetic, no Date object, no timezone. */
function addMonths(yyyyMm: string, months: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
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

const n = (x: number) => x.toLocaleString("en-US");

export type Readings = {
  /** Build date, UTC. Printed on the page: every age below is measured from it. */
  drawnOn: string;
  posts: number;
  words: number;
  latest?: { title: string; slug: string; date: string; wordCount: number };
  shortest?: { wordCount: number };
  daysSinceLatest?: number;
  codeLines: number;
  cssLines: number;
  /** Lines of source per published word. The row that does not close with a redesign. */
  linesPerWord: number;
  nowUpdated: string;
  daysSinceNow: number;
  usesVerified: string;
  usesExpires: string;
  projects: number;
};

/**
 * Every counted figure on the site, in one place, so a claim and a page cannot
 * quote the same reading differently.
 */
export function getReadings(): Readings {
  const drawnOn = new Date().toISOString().slice(0, 10);
  const posts = getAllPosts(); // newest first
  const words = posts.reduce((sum, p) => sum + p.wordCount, 0);
  const latest = posts[0];

  const code = SOURCE_DIRS.flatMap((d) =>
    walk(d, (f) => f.endsWith(".ts") || f.endsWith(".tsx")),
  );
  const codeLines = countLines(code);
  const cssLines = countLines([STYLESHEET]);

  return {
    drawnOn,
    posts: posts.length,
    words,
    latest: latest && {
      title: latest.title,
      slug: latest.slug,
      date: latest.date,
      wordCount: latest.wordCount,
    },
    shortest: posts.length
      ? { wordCount: Math.min(...posts.map((p) => p.wordCount)) }
      : undefined,
    daysSinceLatest: latest ? daysBetween(latest.date, drawnOn) : undefined,
    codeLines,
    cssLines,
    linesPerWord: words ? (codeLines + cssLines) / words : 0,
    nowUpdated: now.updated,
    daysSinceNow: daysBetween(now.updated, drawnOn),
    usesVerified: usesUpdated,
    usesExpires: addMonths(usesUpdated, 6),
    projects: projects.length,
  };
}

export type Claim = {
  /** The assertion. Left column. Written in the owner's voice, flat and factual. */
  claim: string;
  /** What can be measured about it. Right column. Counted wherever counting is possible. */
  evidence: string;
  /** The verdict, in two or three words. Printed in the balance column. */
  balance: string;
  /** True when the books do not meet. The row prints open and is not closed by a redesign. */
  unbalanced?: boolean;
  /** Opens under the row: the arithmetic, the caveat, and what the evidence does not cover. */
  detail: string;
  /**
   * `YYYY-MM` after which the claim is unverified. Past it the row is struck
   * through rather than quietly kept — nothing here is allowed to be true
   * indefinitely. Omit for claims that cannot go stale.
   */
  expires?: string;
};

/**
 * The claims, in the order they are printed.
 *
 * Cut to eight from the mockup's nine. Every row is a standing maintenance
 * obligation — an expiry that passes strikes the row through in public — and a
 * ledger this site cannot keep up with is worse than no ledger. Add a row only
 * when there is a reading to put beside it.
 */
export function getLedger(): Claim[] {
  const r = getReadings();
  const ratio = r.linesPerWord.toFixed(1);

  return [
    {
      claim: "Writes about what he builds.",
      evidence: r.latest
        ? `${r.posts} posts · ${n(r.words)} words · latest ${r.latest.date}`
        : "nothing published",
      balance:
        r.daysSinceLatest === undefined
          ? "unbalanced"
          : r.daysSinceLatest <= 60
            ? `current, ${r.daysSinceLatest} days`
            : `short ${r.daysSinceLatest} days`,
      unbalanced: r.daysSinceLatest === undefined || r.daysSinceLatest > 60,
      detail:
        `Counted from the markdown source with frontmatter stripped: ${n(r.words)} words across ` +
        `${r.posts} posts. The shortest is ${n(r.shortest?.wordCount ?? 0)} words, which is short ` +
        `enough that calling it a post is generous. Sixty days is the interval this row treats as ` +
        `current; past it the balance prints the gap instead. Does not cover drafts or anything ` +
        `unpublished — unpublished writing is not evidence.`,
    },
    {
      claim: "Measures rather than assumes.",
      evidence: "681,331 messages · 487 chats · 65% under 20 characters",
      balance: "balanced",
      detail:
        "Counted, not sampled, across the whole archive before any embedding ran. The previous " +
        "setup embedded every message, so roughly 442,000 vectors stood for “ок”, “+1” and “да”, " +
        "crowding out the 1.5% carrying a proposition. Chronicle groups events into episodes with " +
        "a time gap fitted per conversation: about 11× smaller index, better retrieval. Better on " +
        "the author's own queries, which is not a benchmark. Figures are from Chronicle's own " +
        "measurement pass, not from this repo, and cannot be recomputed here.",
    },
    {
      claim: "Builds instruments that refuse to lie.",
      evidence: "Baseline breaks the line at a 7-day gap · records change, never a score",
      balance: "balanced, unwitnessed",
      detail:
        "Baseline records perceived change relative to the previous mark. After a seven-day gap " +
        "the line visibly breaks rather than pretending the comparison still holds, and an " +
        "uncertain entry is stored as a fuzzy point instead of being laundered into false " +
        "precision. There is no global scale, because a chain of subjective deltas is a random " +
        "walk — and the app says so, on screen, where a product would have put a number. Both " +
        "claims are testable. Neither has been tested by anyone but the author.",
    },
    {
      claim: "Runs the machine this is served from.",
      evidence: "1 VPS · Helsinki · every service defined in git",
      balance: "balanced",
      detail:
        "Caddy, Tailscale with Headscale, Vaultwarden, AdGuard Home, SOPS and age for encrypted " +
        "config. Rebuildable from nothing, last verified by doing it. The live reading beside " +
        "this row comes from /status.json, fetched after paint. Older than 48 hours, or absent, " +
        "and the figure is not shown at all rather than shown stale — the row survives, the " +
        "number does not.",
    },
    {
      claim: "The site is well made.",
      evidence: `${n(r.codeLines)} lines of application code + ${n(r.cssLines)} of CSS ⁄ ${n(r.words)} words served`,
      balance: `${ratio} lines per word`,
      unbalanced: r.linesPerWord >= 1,
      detail:
        `“The infrastructure here is well ahead of the content it serves, and that is the wrong ` +
        `way round.” — /now, the owner's own words, kept. Counted across app, components and lib ` +
        `plus the single stylesheet, this file included. The row stays open until the ratio falls ` +
        `under 1.0, which needs about ${n(Math.ceil(r.codeLines + r.cssLines))} words rather than ` +
        `a redesign. A redesign cannot close it. That is why it is printed here and not in a footer.`,
    },
    {
      claim: "Says what he is doing now.",
      evidence: `/now edited ${r.nowUpdated} · ${r.daysSinceNow} days ago`,
      balance: r.daysSinceNow <= 180 ? "balanced" : "stale",
      unbalanced: r.daysSinceNow > 180,
      detail:
        "Standing rule in the codebase: at six months without an edit the link is removed rather " +
        "than left standing. A missing page is neutral. A stale one is a statement.",
    },
    {
      claim: "The tool list is accurate.",
      evidence: `/uses verified ${r.usesVerified}`,
      balance: `balanced, expires ${r.usesExpires}`,
      expires: r.usesExpires,
      detail:
        "Every claim on this page carries an expiry where one can be set. Past it, and not " +
        "re-verified, the balance column says so and the evidence is struck through. Nothing on " +
        "this site is allowed to be true indefinitely.",
    },
    /*
     * The row most likely to read as a pose rather than a reading: a public
     * count of zero users is self-deprecation, and self-deprecation goes stale
     * as fast as vanity. It earns its place only while the flat wording holds
     * and the number stays counted. Cut it rather than soften it.
     */
    {
      claim: "Has finished things.",
      evidence: `${r.projects} projects · both running daily · 0 with a user other than the author`,
      balance: "unbalanced",
      unbalanced: true,
      detail:
        "Chronicle and Baseline both run every day and neither has been installed by anybody " +
        "else. Finished was doing work that running does not do, so the word is withdrawn and " +
        "the row left open.",
    },
  ];
}
