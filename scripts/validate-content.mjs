#!/usr/bin/env node
// Frontmatter gate for content/posts/*.md.
// Runs locally (`npm run validate`) and in CI before the site is built, so a bad
// post fails fast with a readable message instead of a stack trace from the renderer.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const MAX_DESCRIPTION = 160; // Google truncates around here.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The closed vocabulary, read out of lib/topics.ts.
 *
 * Sliced to the TOPICS literal first rather than regexed over the whole file:
 * that module also declares `graphGroups`, nested `graph: { … }` objects and a
 * list of edges, and a loose pattern picked up entries from all of them.
 */
const TOPICS_TS = fs.readFileSync(path.join(process.cwd(), "lib", "topics.ts"), "utf8");
const BLOCK = TOPICS_TS.slice(
  TOPICS_TS.indexOf("export const TOPICS = {"),
  TOPICS_TS.indexOf("} as const satisfies"),
);
const VOCAB = [...BLOCK.matchAll(/^ {2}"?([a-z0-9-]+)"?:\s*\{/gm)].map((m) => m[1]);

if (VOCAB.length === 0) {
  console.error("ERROR could not parse any topics out of lib/topics.ts — has its shape changed?");
  process.exit(1);
}

const errors = [];
const warnings = [];
const seenSlugs = new Map();

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

if (files.length === 0) errors.push("content/posts/ contains no .md files");

for (const file of files) {
  const slug = file.replace(/\.md$/, "");
  const where = `content/posts/${file}`;
  const fail = (msg) => errors.push(`${where}: ${msg}`);
  const warn = (msg) => warnings.push(`${where}: ${msg}`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    fail(`slug "${slug}" must be lowercase kebab-case — it becomes the URL`);
  }
  if (seenSlugs.has(slug.toLowerCase())) {
    fail(`slug collides with ${seenSlugs.get(slug.toLowerCase())}`);
  }
  seenSlugs.set(slug.toLowerCase(), where);

  const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));

  if (!data.title || typeof data.title !== "string") fail("frontmatter: title is required");
  if (!data.date) fail("frontmatter: date is required");
  else if (!DATE_RE.test(String(data.date))) {
    // gray-matter parses unquoted YAML dates into Date objects, which then
    // stringify differently than the `date` the rest of the app expects.
    fail(`frontmatter: date must be a quoted "YYYY-MM-DD" string, got ${JSON.stringify(data.date)}`);
  } else if (Number.isNaN(Date.parse(String(data.date)))) {
    fail(`frontmatter: date "${data.date}" is not a real date`);
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

  const body = content.trim();
  if (body.length === 0) fail("body is empty");
  if (/^#\s/m.test(body)) {
    fail("body starts a top-level '# heading' — the page already renders an <h1> from the title");
  }

  // Relative links must resolve to a real route. Static export has no redirects,
  // and trailingSlash: true means a missing slash costs a 404 behind the file server.
  for (const [, href] of body.matchAll(/]\((\/[^)\s]*)\)/g)) {
    if (href.startsWith("/writing/")) {
      const target = href.replace(/^\/writing\//, "").replace(/\/$/, "");
      if (target && !files.includes(`${target}.md`)) {
        fail(`links to /writing/${target}/ which does not exist`);
      }
    }
    if (href.startsWith("/posts/")) {
      fail(`links to "${href}" — posts live under /writing/ now`);
    }
    if (!href.endsWith("/") && !path.extname(href)) {
      fail(`internal link "${href}" needs a trailing slash (trailingSlash: true)`);
    }
  }

  const words = body.split(/\s+/).length;
  if (words < 300) warn(`only ${words} words — thin for search`);
  if (!/]\(\//.test(body)) warn("no internal links — costs SEO and session depth");
}

// lib/site.ts carries hand-written internal hrefs too. Deleting a post used to
// leave those dangling silently, because this script only ever looked inside markdown.
const siteTs = fs.readFileSync(path.join(process.cwd(), "lib", "site.ts"), "utf8");
for (const [, href] of siteTs.matchAll(/href:\s*"(\/[^"]*)"/g)) {
  if (href.startsWith("/writing/")) {
    const target = href.replace(/^\/writing\//, "").replace(/\/$/, "");
    if (target && !files.includes(`${target}.md`)) {
      errors.push(`lib/site.ts: links to /writing/${target}/ which does not exist`);
    }
  }
  if (!href.endsWith("/") && !path.extname(href) && !href.includes("#")) {
    errors.push(`lib/site.ts: internal link "${href}" needs a trailing slash`);
  }
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\n${files.length} post(s) + lib/site.ts checked against ${VOCAB.length} topics — ` +
    `${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length > 0 ? 1 : 0);
