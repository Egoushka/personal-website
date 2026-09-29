#!/usr/bin/env node
// Starts a post (docs/writing/README.md): `npm run new -- <kind> <slug>` copies the
// kind's skeleton to content/drafts/<slug>.md, dated today, and starts its
// evidence pack beside it. Refuses a slug that is already a draft or a post: the
// slug becomes the URL. The skeletons are read from this repo, wherever it runs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POST_KINDS } from "../lib/post-kinds.mjs";
import { initPack } from "../lib/evidence.mjs";

const [kind, slug] = process.argv.slice(2);
if (!POST_KINDS.includes(kind) || !slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`usage: npm run new -- <${POST_KINDS.join("|")}> <slug>  (lowercase kebab-case; it becomes the URL)`);
  process.exit(2);
}

const ROOT = process.cwd();
const rel = (/** @type {string} */ p) => path.relative(ROOT, p);
const draft = path.join(ROOT, "content", "drafts", `${slug}.md`);
const pack = path.join(ROOT, "content", "drafts", `${slug}.evidence.md`);
const taken = [draft, path.join(ROOT, "content", "posts", `${slug}.md`)].find((p) => fs.existsSync(p));
if (taken) {
  console.error(`ERROR ${rel(taken)} already exists`);
  process.exit(1);
}

const templates = fileURLToPath(new URL("../docs/writing/templates/", import.meta.url));
const skeleton = fs.readFileSync(path.join(templates, `${kind}.md`), "utf8");
// The local date, in the form the validator wants: "sv-SE" writes YYYY-MM-DD.
const today = new Date().toLocaleDateString("sv-SE");

fs.mkdirSync(path.dirname(draft), { recursive: true });
fs.writeFileSync(draft, skeleton.replace('date: "YYYY-MM-DD"', `date: "${today}"`));
if (!fs.existsSync(pack)) fs.writeFileSync(pack, initPack(slug));

console.log(`wrote ${rel(draft)} (${kind}) and ${rel(pack)}

Next, in docs/writing/README.md order:
  1. the pack's Thesis: line, then a row for every figure with its source
  2. the draft: rename every heading, replace every TODO
  3. npm run evidence -- ${slug}
  4. npm run validate -- --drafts`);
