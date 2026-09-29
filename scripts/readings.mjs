#!/usr/bin/env node
// The readings a project page prints that cite a file (`ref` on a reading in
// lib/site.ts, docs/writing/README.md):
//   npm run readings              open each ref: every number in the reading's value must be
//                                 in the file at that commit, or in the lines the ref names
//   npm run readings -- --latest  also follow those lines to the repository's default branch,
//                                 and warn DRIFT where a number is no longer in them
// A ref is read in the local clone .evidence-repos.json names for its repository, or from
// raw.githubusercontent.com: public repositories, no token. The build never runs this.
import fs from "node:fs";
import path from "node:path";
import { draftsDir } from "../lib/drafts.mjs";
import { readingRefs, sourceChecker, sourceReader } from "../lib/evidence.mjs";

const ROOT = process.cwd();
const LATEST = process.argv.includes("--latest");
// Beside the main checkout's content/, like the drafts, so every worktree reads one.
const CLONES = path.join(draftsDir(ROOT), "..", "..", ".evidence-repos.json");
const check = sourceChecker(sourceReader(fs.existsSync(CLONES) ? JSON.parse(fs.readFileSync(CLONES, "utf8")) : {}));
const readings = readingRefs(fs.readFileSync(path.join(ROOT, "lib", "site.ts"), "utf8"));

const errors = [];
const warnings = [];
for (const r of readings) {
  const what = `${r.project} "${r.label}": "${r.value}"`;
  const v = await check(r.ref, r.value);
  const line = `lib/site.ts:${r.line}: ${v.status}${v.detail && ` ${v.detail}`} — ${what}${v.where}`;
  if (v.status !== "ok") {
    errors.push(line);
    console.error(`ERROR ${line}`);
    continue;
  }
  console.log(line);
  // The reading still holds at its commit; the default branch says whether it still
  // holds today. Read whole there, because the lines a ref names move.
  if (!LATEST) continue;
  const now = await check(r.ref, r.value, { latest: true });
  if (now.status === "ok") continue;
  const moved = `lib/site.ts:${r.line}: ${now.status}${now.detail && ` ${now.detail}`} — ${what}${now.where}`;
  if (now.status === "DRIFT") {
    warnings.push(moved);
    console.warn(`warn  ${moved}`);
  } else {
    errors.push(moved);
    console.error(`ERROR ${moved}`);
  }
}

console.log(
  `\n${readings.length} reading(s) with a ref${LATEST ? ", each also read on its default branch" : ""} — ` +
    `${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length > 0 ? 1 : 0);
