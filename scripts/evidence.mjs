#!/usr/bin/env node
// The evidence gate for one post (docs/writing/README.md):
//   npm run evidence -- <slug>            check content/drafts/<slug>.evidence.md
//   npm run evidence -- <slug> --init     start that file, one row per figure in the post
//   npm run evidence -- <slug> --verify   also open each row's source where a machine can
//                                         (a file at a commit, or `=` arithmetic) and check
//                                         the row's value against it
// Reads the draft, or the published post when there is no draft of that slug.
// Local only: packs sit beside the drafts, gitignored, because a source may name a
// private repo, so CI never runs this. Both are in the main checkout, whichever
// worktree runs it (lib/drafts.mjs), so a pack outlives the branch that used it.
// Without --verify it never opens the network.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { checkPack, initPack, parsePack, sourceChecker, sourceReader } from "../lib/evidence.mjs";
import { draftsDir } from "../lib/drafts.mjs";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error("usage: npm run evidence -- <slug> [--init | --verify]");
  process.exit(2);
}

const ROOT = process.cwd();
// From a worktree the drafts are in the main checkout: print those paths whole.
const rel = (/** @type {string} */ p) => (path.relative(ROOT, p).startsWith("..") ? p : path.relative(ROOT, p));
const DRAFTS = draftsDir(ROOT);
const packPath = path.join(DRAFTS, `${slug}.evidence.md`);
const postPath = [path.join(DRAFTS, `${slug}.md`), path.join(ROOT, "content", "posts", `${slug}.md`)]
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
  console.error(`ERROR no ${rel(path.join(DRAFTS, `${slug}.md`))} or content/posts/${slug}.md`);
  process.exit(1);
}

const pack = parsePack(fs.readFileSync(packPath, "utf8"));
const result = checkPack(readPost(), pack);
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

// A row whose source a machine can open is checked against it, in the pack's order.
// Local clones, by "owner/repo", open private repositories: .evidence-repos.json,
// beside the main checkout's content/ like the drafts, so every worktree reads one.
const VERIFY = args.includes("--verify");
const opened = { ok: 0, MISSING: 0, "DERIVED MISMATCH": 0, "FETCH FAILED": 0, skipped: 0 };
if (VERIFY) {
  const clones = path.join(DRAFTS, "..", "..", ".evidence-repos.json");
  const check = sourceChecker(sourceReader(fs.existsSync(clones) ? JSON.parse(fs.readFileSync(clones, "utf8")) : {}));
  for (const row of pack.rows) {
    const v = await check(row.source, row.value);
    opened[v.status] += 1;
    const line = `${rel(packPath)}:${row.line}: ${v.status}${v.detail && ` ${v.detail}`} — "${row.value || row.claim}"${v.where}`;
    if (v.status === "ok" || v.status === "skipped") console.log(line);
    else {
      errors.push(line);
      console.error(`ERROR ${line}`);
    }
  }
}

console.log(
  `\n${result.stated} figure(s) in the post, ${result.rows} row(s) in the pack — ` +
    `${errors.length} error(s), ${result.unused.length} warning(s)`,
);
if (VERIFY) {
  console.log(
    `${result.rows} row(s) opened: ${opened.ok} ok, ${opened.MISSING} MISSING, ` +
      `${opened["DERIVED MISMATCH"]} DERIVED MISMATCH, ${opened["FETCH FAILED"]} FETCH FAILED, ` +
      `${opened.skipped} skipped (not machine-checkable)`,
  );
}
process.exit(errors.length > 0 ? 1 : 0);
