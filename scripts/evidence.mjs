#!/usr/bin/env node
// The evidence gate for one post or method (docs/writing/README.md, ADR 0008):
//   npm run evidence -- <slug>          check content/drafts/<slug>.evidence.md
//   npm run evidence -- <slug> --init   start that file, one row per figure in the post
// Reads the draft, or the published post when there is no draft of that slug.
// Local only: packs sit beside the drafts, gitignored, because a source may name a
// private repo, so CI never runs this.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { checkPack, initPack, parsePack } from "../lib/evidence.mjs";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("usage: npm run evidence -- <slug> [--init]");
  process.exit(2);
}

const ROOT = process.cwd();
const rel = (/** @type {string} */ p) => path.relative(ROOT, p);
const packPath = path.join(ROOT, "content", "drafts", `${slug}.evidence.md`);
const postPath = ["drafts", "posts", "methods"]
  .map((dir) => path.join(ROOT, "content", dir, `${slug}.md`))
  .find((p) => fs.existsSync(p));

function readPost() {
  const { data, content } = matter(fs.readFileSync(/** @type {string} */ (postPath), "utf8"));
  return { title: String(data.title ?? ""), description: String(data.description ?? ""), body: content };
}

if (args.includes("--init")) {
  if (fs.existsSync(packPath)) {
    console.error(`ERROR ${rel(packPath)} already exists — edit it`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(packPath), { recursive: true });
  fs.writeFileSync(packPath, initPack(slug, postPath ? readPost() : undefined));
  console.log(`wrote ${rel(packPath)}${postPath ? `, a row per figure in ${rel(postPath)}` : ""}`);
  process.exit(0);
}

if (!fs.existsSync(packPath)) {
  console.error(`ERROR no ${rel(packPath)} — start one: npm run evidence -- ${slug} --init`);
  process.exit(1);
}
if (!postPath) {
  console.error(`ERROR no content/drafts/${slug}.md, content/posts/${slug}.md or content/methods/${slug}.md`);
  process.exit(1);
}

const result = checkPack(readPost(), parsePack(fs.readFileSync(packPath, "utf8")));
const errors = [];
if (result.thesis) errors.push(`${rel(packPath)}: ${result.thesis}`);
for (const f of result.missing) {
  errors.push(`${rel(postPath)}: ${f.raw} (${f.where}) is not in the pack — "${f.context}"`);
}
for (const row of result.unsourced) {
  errors.push(`${rel(packPath)}:${row.line}: "${row.value || row.claim}" has no source`);
}
for (const v of result.unused) {
  console.warn(`warn  ${rel(packPath)}: ${v} is in the pack but not in the post — stale, or a claim the post dropped`);
}
for (const e of errors) console.error(`ERROR ${e}`);

console.log(
  `\n${result.stated} figure(s) in the post, ${result.rows} row(s) in the pack — ` +
    `${errors.length} error(s), ${result.unused.length} warning(s)`,
);
process.exit(errors.length > 0 ? 1 : 0);
