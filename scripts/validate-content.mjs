#!/usr/bin/env node
// Frontmatter and link gate for content/posts/*.md.
// Runs locally (`npm run validate`) and in CI before the site is built, so a bad
// post fails fast with a readable message instead of a stack trace from the renderer.
// `--drafts` also checks content/drafts/*.md by the same rules, and `--draft <slug>`
// only that one: from a worktree the drafts are the main checkout's (lib/drafts.mjs),
// so every draft in flight is in the one folder. That is local only: drafts are
// gitignored, so CI never has any.
// Reads everything relative to the working directory, which is what lets the tests
// run it over fixture trees.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parseMarkdown, countWords, headings, proseText } from "../lib/markdown.mjs";
import { POST_KINDS } from "../lib/post-kinds.mjs";
import { checkDocPages, highlightLangs, readDocDir } from "../lib/doc-check.mjs";
import { draftsDir } from "../lib/drafts.mjs";
import { readingRefs, refProblem } from "../lib/evidence.mjs";

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "content", "posts");
const DRAFTS_DIR = draftsDir(ROOT);
const ONE_DRAFT = process.argv.includes("--draft") ? process.argv[process.argv.indexOf("--draft") + 1] ?? "" : null;
const WITH_DRAFTS = process.argv.includes("--drafts") || ONE_DRAFT !== null;
const MAX_DESCRIPTION = 160; // Google truncates around here.

/**
 * The closed vocabulary, read out of lib/topics.ts.
 *
 * Sliced to the TOPICS literal first rather than regexed over the whole file,
 * so a nested `{` elsewhere in the module cannot pass for a topic entry.
 */
const TOPICS_TS = fs.readFileSync(path.join(ROOT, "lib", "topics.ts"), "utf8");
const BLOCK = TOPICS_TS.slice(
  TOPICS_TS.indexOf("export const TOPICS = {"),
  TOPICS_TS.indexOf("} as const satisfies"),
);
const VOCAB = [...BLOCK.matchAll(/^ {2}"?([a-z0-9-]+)"?:\s*\{/gm)].map((m) => m[1]);

if (VOCAB.length === 0) {
  console.error("ERROR could not parse any topics out of lib/topics.ts — has its shape changed?");
  process.exit(1);
}

/**
 * The projects, read out of lib/site.ts the same way: sliced to the `projects`
 * literal, one entry per `{` at two spaces of indent, so a `slug:` in the jobs
 * or the eras below it cannot pass for a project. Each keeps its write-up slug.
 * A tree with no `projects` literal (the tests' fixtures) has none.
 */
const siteTs = fs.readFileSync(path.join(ROOT, "lib", "site.ts"), "utf8");
const projectsAt = siteTs.indexOf("export const projects");
const PROJECTS =
  projectsAt < 0
    ? []
    : [...siteTs.slice(projectsAt, siteTs.indexOf("\n];", projectsAt)).matchAll(/^ {2}\{\n([\s\S]*?)^ {2}\},?$/gm)]
        .map(([, body]) => ({
          slug: body.match(/^ {4}slug: "([^"]+)"/m)?.[1],
          writeup: body.match(/^ {4}writeup: "([^"]+)"/m)?.[1],
        }))
        .filter((p) => p.slug);

// The latest date that is already today somewhere (UTC+14). A post dated after
// it is dated in the future everywhere.
const LATEST_TODAY = new Date(Date.now() + 14 * 3_600_000).toISOString().slice(0, 10);

/**
 * A frontmatter date: a quoted "YYYY-MM-DD" that names a real day, not in the
 * future. Returns the problem, or null.
 */
function dateProblem(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // gray-matter parses unquoted YAML dates into Date objects, which then
    // stringify differently than the string the rest of the app expects.
    return `must be a quoted "YYYY-MM-DD" string, got ${JSON.stringify(value)}`;
  }
  // Round-trip: Date.parse accepts 2026-02-31 and rolls it into March.
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    return `"${value}" is not a real date`;
  }
  if (value > LATEST_TODAY) return `"${value}" is in the future`;
  return null;
}

const errors = [];
const warnings = [];
const seenSlugs = new Map();

/**
 * Every post in a directory, parsed. An evidence pack (`<slug>.evidence.md`,
 * docs/writing/README.md) sits beside its draft and is not a post.
 */
function readPosts(dir, label) {
  const names = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.endsWith(".evidence.md")).sort()
    : [];
  return names.map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    const tree = parseMarkdown(content);
    return { file, where: `${label}/${file}`, slug: file.replace(/\.md$/, ""), data, content, tree };
  });
}

// Parse every post first: a deep link from one post into another needs the
// target's heading ids. Only published posts are link targets — a draft that
// links to another draft would ship a 404 if it went out first.
const posts = readPosts(POSTS_DIR, "content/posts");
const drafts = (WITH_DRAFTS ? readPosts(DRAFTS_DIR, "content/drafts") : []).filter(
  (d) => ONE_DRAFT === null || d.slug === ONE_DRAFT,
);
if (posts.length === 0) errors.push("content/posts/ contains no .md files");
if (ONE_DRAFT !== null && drafts.length === 0) errors.push(`--draft: no content/drafts/${ONE_DRAFT}.md`);
const ids = new Map(posts.map((p) => [p.slug, new Set(headings(p.tree).map((h) => h.id))]));

/**
 * One internal href, wherever it was written. `selfIds` are the heading ids of
 * the post it appears in, so a bare `#fragment` can be checked against them.
 */
function hrefProblems(href, selfIds) {
  const problems = [];
  const [beforeHash, fragment] = href.split("#", 2);
  const route = beforeHash.split("?")[0];

  if (route === "") {
    if (selfIds && fragment && !selfIds.has(fragment)) {
      problems.push(`links to "#${fragment}" but this post has no heading with that id`);
    }
    return problems;
  }
  if (route.startsWith("/posts/")) {
    problems.push(`links to "${href}" — posts live under /writing/ now`);
  }
  if (!route.endsWith("/") && !path.extname(route)) {
    problems.push(`internal link "${href}" needs a trailing slash (trailingSlash: true)`);
  }
  const post = route.match(/^\/writing\/([^/]+)\/?$/)?.[1];
  if (post) {
    if (!ids.has(post)) problems.push(`links to /writing/${post}/ which does not exist`);
    else if (fragment && !ids.get(post).has(fragment)) {
      problems.push(`links to /writing/${post}/#${fragment} but that post has no heading with that id`);
    }
  }
  return problems;
}

/** Every link and definition url in the tree. Code is not walked, so a URL in a fence is not a link. */
function urls(node, out = []) {
  if ((node.type === "link" || node.type === "definition") && node.url) out.push(node.url);
  if (node.children) for (const child of node.children) urls(child, out);
  return out;
}

for (const { where, slug, data, content, tree } of [...posts, ...drafts]) {
  const draft = where.startsWith("content/drafts/");
  const fail = (msg) => errors.push(`${where}: ${msg}`);
  const warn = (msg) => warnings.push(`${where}: ${msg}`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    fail(`slug "${slug}" must be lowercase kebab-case — it becomes the URL`);
  }
  if (seenSlugs.has(slug.toLowerCase())) {
    fail(`slug collides with ${seenSlugs.get(slug.toLowerCase())}`);
  }
  seenSlugs.set(slug.toLowerCase(), where);

  if (!data.title || typeof data.title !== "string") fail("frontmatter: title is required");

  // What the post owes a reader decides its shape and its review (docs/writing/).
  if (data.kind === undefined) {
    fail(`frontmatter: kind is required — one of ${POST_KINDS.join(", ")} (docs/writing/README.md)`);
  } else if (!POST_KINDS.includes(data.kind)) {
    fail(`frontmatter: kind must be one of ${POST_KINDS.join(", ")}, got ${JSON.stringify(data.kind)}`);
  }

  // A project a post names must exist, or its page would never list the post.
  if (data.project !== undefined && !PROJECTS.some((p) => p.slug === data.project)) {
    fail(`frontmatter: project ${JSON.stringify(data.project)} is not a project slug in lib/site.ts`);
  }

  const dateBad = data.date === undefined ? "is required" : dateProblem(data.date);
  if (dateBad) fail(`frontmatter: date ${dateBad}`);

  if (data.updated !== undefined) {
    const bad = dateProblem(data.updated);
    if (bad) fail(`frontmatter: updated ${bad}`);
    else if (!dateBad && data.updated < data.date) {
      fail(`frontmatter: updated "${data.updated}" is before date "${data.date}"`);
    }
  }
  if (data.correction !== undefined) {
    if (typeof data.correction !== "string" || !data.correction.trim()) {
      fail("frontmatter: correction must be a non-empty string — one sentence saying what was corrected");
    } else if (data.updated === undefined) {
      fail("frontmatter: correction needs `updated` — the date the correction was made");
    }
  }

  // Cyrillic in the title or the prose carries its language (lib/lang.ts marks
  // it with `lang`). Declared, never guessed: "ок" is Ukrainian and Russian alike.
  if (data.cyrillic !== undefined && data.cyrillic !== "uk" && data.cyrillic !== "ru") {
    fail(`frontmatter: cyrillic must be "uk" or "ru", got ${JSON.stringify(data.cyrillic)}`);
  } else if (data.cyrillic === undefined && /[\u0400-\u04FF]/.test(`${data.title ?? ""} ${proseText(tree)}`)) {
    fail('frontmatter: the post has Cyrillic text, so it needs `cyrillic: "uk"` or `"ru"` — the language its words are marked with');
  }

  if (data.spanDays !== undefined && !(Number.isInteger(data.spanDays) && data.spanDays > 0)) {
    fail(`frontmatter: spanDays must be a positive whole number of days, got ${JSON.stringify(data.spanDays)}`);
  }

  if (!data.description || typeof data.description !== "string") {
    fail("frontmatter: description is required — it is the meta description and the feed summary");
  } else if (data.description.length > MAX_DESCRIPTION) {
    fail(`frontmatter: description is ${data.description.length} chars, max ${MAX_DESCRIPTION}`);
  }

  if (data.tags) {
    fail("frontmatter: `tags` is gone — the key is `topics`, and the vocabulary is lib/topics.ts");
  }

  if (!Array.isArray(data.topics) || data.topics.length === 0) {
    fail("frontmatter: topics must be a non-empty array");
  } else if (data.topics.some((t) => typeof t !== "string")) {
    fail("frontmatter: every topic must be a string");
  } else {
    // A topic outside the vocabulary silently creates a one-post hub nobody links to.
    for (const t of data.topics) {
      if (!VOCAB.includes(t)) {
        fail(`frontmatter: topic "${t}" is not in lib/topics.ts (known: ${VOCAB.join(", ")})`);
      }
    }
  }

  if (content.trim().length === 0) fail("body is empty");
  // The skeletons in docs/writing/templates/ are TODO prompts. One left in a
  // published post is a sentence nobody wrote; in a draft it is the next job.
  if (/\bTODO\b/.test(`${data.title ?? ""} ${data.description ?? ""} ${content}`)) {
    (draft ? warn : fail)("still has a TODO from its skeleton");
  }
  if (headings(tree).some((h) => h.depth === 1)) {
    fail("body has a top-level '# heading' — the page already renders an <h1> from the title");
  }

  // Internal links must resolve to a real route. Static export has no redirects,
  // and trailingSlash: true means a missing slash costs a 404 behind the file server.
  const internal = urls(tree).filter((u) => u.startsWith("/") || u.startsWith("#"));
  const selfIds = new Set(headings(tree).map((h) => h.id));
  for (const href of internal) for (const p of hrefProblems(href, selfIds)) fail(p);

  const words = countWords(tree);
  if (words < 300) warn(`only ${words} words — thin for search`);
  if (!internal.some((u) => u.startsWith("/"))) warn("no internal links — costs SEO and session depth");
}

// lib/site.ts carries hand-written internal hrefs and write-up slugs too.
// Deleting or un-publishing a post would otherwise leave them dangling silently.
for (const [, href] of siteTs.matchAll(/href:\s*"(\/[^"]*)"/g)) {
  for (const p of hrefProblems(href, null)) errors.push(`lib/site.ts: ${p}`);
}
for (const [, slug] of siteTs.matchAll(/writeup:\s*"([^"]+)"/g)) {
  if (!ids.has(slug)) {
    errors.push(
      `lib/site.ts: writeup "${slug}" has no content/posts/${slug}.md — a draft cannot be a write-up`,
    );
  }
}
// A reading's `ref` is the file at a commit that `npm run readings` opens to find the
// reading's value in (docs/writing/README.md), so it must be one it can open, on the
// line that holds that value.
for (const r of readingRefs(siteTs)) {
  const bad = refProblem(r.ref);
  if (bad) errors.push(`lib/site.ts:${r.line}: ${r.project} "${r.label}": ref ${bad}`);
  else if (!r.label || !r.value) errors.push(`lib/site.ts:${r.line}: a ref goes on the line of its reading, beside the label and value`);
}

// ── Docs (ADR 0006) ──────────────────────────────────────────────────────────
// A project's docs are copied from its repository into content/docs/<project>/,
// and content/docs/sources.json says from where. `npm run docs:verify` checks the
// copy against the commit, with the network; this checks what can be checked
// offline: the sources, each page's frontmatter, and links between the pages.
const DOCS_DIR = path.join(ROOT, "content", "docs");
const SOURCES_FILE = path.join(DOCS_DIR, "sources.json");
const docSources = fs.existsSync(SOURCES_FILE) ? JSON.parse(fs.readFileSync(SOURCES_FILE, "utf8")) : {};
// The languages lib/highlight.ts loads. A fence in any other renders as plain text.
const LANGS = await highlightLangs(ROOT);
let docPages = 0;

for (const [project, source] of Object.entries(docSources)) {
  const where = `content/docs/${project}`;
  const fail = (msg) => errors.push(`${where}: ${msg}`);
  if (!PROJECTS.some((p) => p.slug === project)) fail(`"${project}" is not a project slug in lib/site.ts`);
  if (!/^[\w.-]+\/[\w.-]+$/.test(source.repo ?? "")) fail(`sources.json: repo must be "owner/name", got ${JSON.stringify(source.repo)}`);
  if (typeof source.path !== "string" || !source.path) fail("sources.json: path is required — the docs directory in the repository");
  if (!/^[0-9a-f]{40}$/.test(source.commit ?? "")) fail("sources.json: commit must be a full 40-character sha");
  const pulledBad = dateProblem(source.pulled);
  if (pulledBad) fail(`sources.json: pulled ${pulledBad}`);

  // The page rules are lib/doc-check.mjs, the same ones `npm run docs:check`
  // runs in the tool's checkout before a pull.
  const pages = readDocDir(path.join(DOCS_DIR, project));
  const found = checkDocPages(pages, { dir: source.path, where, langs: LANGS });
  errors.push(...found.errors);
  warnings.push(...found.warnings);
  docPages += pages.length;
}

// A project's write-up is about that project and must say so: `project` is the one
// field that ties a post to a project, and `writeup` only picks which post leads.
for (const { slug, writeup } of PROJECTS) {
  const post = writeup && posts.find((p) => p.slug === writeup);
  if (post && post.data.project !== slug) {
    errors.push(`${post.where}: it is ${slug}'s write-up in lib/site.ts, so it needs project: "${slug}"`);
  }
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\n${posts.length} post(s)${WITH_DRAFTS ? ` + ${drafts.length} draft(s)` : ""} + lib/site.ts ` +
    `${docPages ? `+ ${docPages} docs page(s) ` : ""}checked against ${VOCAB.length} topics and ${PROJECTS.length} projects — ` +
    `${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length > 0 ? 1 : 0);
