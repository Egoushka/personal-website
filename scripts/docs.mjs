#!/usr/bin/env node
// A project's docs live in its own repository; this copies them here (ADR 0006).
//   npm run docs:pull -- <project> [ref]      copy <repo>@<ref>:<path>/*.md into content/docs/<project>/
//   npm run docs:pull -- <project> <ref> --repo <owner/name> --path <dir>   the first time
//   npm run docs:verify                       fail when a copy differs from its commit by a byte
// Both keep content/docs/sources.json, and both fail on a link from the docs to a
// repository file or heading that does not exist at the commit. Network: GitHub
// only — `git ls-remote` for the ref, codeload for the tarball; public repositories,
// no token. The build never runs this: it reads the copy.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { brokenRepoLinks, diffDocs, pickCommit } from "../lib/doc-sources.mjs";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "content", "docs");
const SOURCES = path.join(DOCS, "sources.json");
const [command, ...rest] = process.argv.slice(2);
const flag = (name) => {
  const i = rest.indexOf(name);
  return i < 0 ? undefined : rest[i + 1];
};
const positional = rest.filter((a, i) => !a.startsWith("--") && !rest[i - 1]?.startsWith("--"));

const readSources = () => (fs.existsSync(SOURCES) ? JSON.parse(fs.readFileSync(SOURCES, "utf8")) : {});

/** The repository at a commit, unpacked into a temporary directory. */
async function checkout(repo, commit) {
  const res = await fetch(`https://codeload.github.com/${repo}/tar.gz/${commit}`);
  if (!res.ok) throw new Error(`${repo}@${commit}: codeload answered ${res.status}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docs-"));
  const tarball = path.join(tmp, "repo.tar.gz");
  fs.writeFileSync(tarball, Buffer.from(await res.arrayBuffer()));
  execFileSync("tar", ["-xzf", tarball, "-C", tmp]);
  fs.rmSync(tarball);
  const [top] = fs.readdirSync(tmp); // GitHub's tarball holds one directory, <name>-<commit>
  const root = path.join(tmp, top);
  const files = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      files.add(path.relative(root, full).split(path.sep).join("/"));
      if (entry.isDirectory()) walk(full);
    }
  };
  walk(root);
  return { root, files, done: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

/** The docs directory at the commit: flat, markdown only. */
function docsAt(repoRoot, dir) {
  const full = path.join(repoRoot, dir);
  if (!fs.existsSync(full)) throw new Error(`${dir}/ does not exist at this commit`);
  const pages = new Map();
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.isDirectory()) throw new Error(`${dir}/${entry.name}/: docs are one flat directory`);
    if (entry.name.endsWith(".md")) pages.set(entry.name, fs.readFileSync(path.join(full, entry.name)));
  }
  if (pages.size === 0) throw new Error(`${dir}/ has no .md files`);
  return pages;
}

function linkProblems(checkoutDir, files, dir, pages) {
  const text = new Map([...pages].map(([name, buf]) => [name, buf.toString("utf8")]));
  return brokenRepoLinks(text, dir, files, (file) => fs.readFileSync(path.join(checkoutDir, file), "utf8"));
}

async function pull() {
  const [project, refArg] = positional;
  if (!project || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(project)) {
    throw new Error("usage: npm run docs:pull -- <project> [ref] [--repo owner/name --path dir]");
  }
  const sources = readSources();
  const known = sources[project] ?? {};
  const repo = flag("--repo") ?? known.repo;
  const dir = (flag("--path") ?? known.path)?.replace(/\/$/, "");
  const ref = refArg ?? known.ref ?? "main";
  if (!repo || !dir) throw new Error(`${project} is not in content/docs/sources.json yet: pass --repo and --path`);

  const commit = /^[0-9a-f]{40}$/.test(ref)
    ? ref
    : pickCommit(
        execFileSync("git", ["ls-remote", `https://github.com/${repo}.git`, ref, `${ref}^{}`], { encoding: "utf8" }),
        ref,
      );
  const co = await checkout(repo, commit);
  try {
    const pages = docsAt(co.root, dir);
    const problems = linkProblems(co.root, co.files, dir, pages);
    if (problems.length > 0) throw new Error(`broken links at ${commit.slice(0, 7)}:\n  ${problems.join("\n  ")}`);

    const target = path.join(DOCS, project);
    fs.mkdirSync(target, { recursive: true });
    for (const f of fs.readdirSync(target)) if (f.endsWith(".md")) fs.rmSync(path.join(target, f));
    for (const [name, buf] of pages) fs.writeFileSync(path.join(target, name), buf);

    sources[project] = { repo, path: dir, ref, commit, pulled: new Date().toLocaleDateString("sv-SE") };
    const sorted = Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(SOURCES, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`${project}: ${pages.size} page(s) from ${repo}@${ref} (${commit.slice(0, 7)}) into content/docs/${project}/`);
  } finally {
    co.done();
  }
}

async function verify() {
  const sources = readSources();
  const errors = [];
  for (const [project, { repo, path: dir, commit }] of Object.entries(sources)) {
    const co = await checkout(repo, commit);
    try {
      const expected = docsAt(co.root, dir);
      const local = path.join(DOCS, project);
      const actual = new Map(
        (fs.existsSync(local) ? fs.readdirSync(local) : [])
          .filter((f) => f.endsWith(".md"))
          .map((f) => [f, fs.readFileSync(path.join(local, f))]),
      );
      const { missing, extra, changed } = diffDocs(expected, actual);
      for (const f of missing) errors.push(`content/docs/${project}/${f}: missing — it is in ${repo}@${commit.slice(0, 7)}`);
      for (const f of extra) errors.push(`content/docs/${project}/${f}: not in ${repo}@${commit.slice(0, 7)}`);
      for (const f of changed) errors.push(`content/docs/${project}/${f}: differs from ${repo}@${commit.slice(0, 7)} — edit it there, then pull`);
      for (const p of linkProblems(co.root, co.files, dir, expected)) errors.push(`${project}: ${p}`);
      if (!missing.length && !extra.length && !changed.length) {
        console.log(`${project}: ${expected.size} page(s) match ${repo}@${commit.slice(0, 7)}`);
      }
    } finally {
      co.done();
    }
  }
  for (const e of errors) console.error(`ERROR ${e}`);
  if (errors.length > 0) process.exit(1);
}

try {
  if (command === "pull") await pull();
  else if (command === "verify") await verify();
  else throw new Error("usage: node scripts/docs.mjs pull|verify");
} catch (e) {
  console.error(`ERROR ${e instanceof Error ? e.message : e}`);
  process.exit(1);
}
