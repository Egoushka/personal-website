import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import matter from "gray-matter";

const SCRIPT = path.resolve("scripts/new-post.mjs");

test("new: a draft from the kind's skeleton, dated today, and an empty evidence pack", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "new-post-"));
  const run = (...args: string[]) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: "utf8" });
  try {
    assert.equal(run("essay", "a-post").status, 2, "an unknown kind is a usage error");
    assert.equal(run("finding", "Not_Kebab").status, 2, "the slug becomes the URL");

    const made = run("incident", "a-post");
    assert.equal(made.status, 0, made.stderr);
    const draft = fs.readFileSync(path.join(dir, "content", "drafts", "a-post.md"), "utf8");
    const { data } = matter(draft);
    assert.equal(data.kind, "incident");
    assert.equal(data.date, new Date().toLocaleDateString("sv-SE"));
    assert.match(draft, /## TODO: why nothing looked wrong/);
    assert.match(fs.readFileSync(path.join(dir, "content", "drafts", "a-post.evidence.md"), "utf8"), /^Thesis: TODO/m);

    assert.equal(run("finding", "a-post").status, 1, "an existing draft is never overwritten");
    fs.mkdirSync(path.join(dir, "content", "posts"));
    fs.writeFileSync(path.join(dir, "content", "posts", "b-post.md"), "---\n---\n");
    assert.match(run("finding", "b-post").stderr, /content\/posts\/b-post.md already exists/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("new: every kind has a skeleton the validator reads the kind from", () => {
  for (const kind of ["finding", "incident", "build"]) {
    const { data, content } = matter(fs.readFileSync(`docs/writing/templates/${kind}.md`, "utf8"));
    assert.equal(data.kind, kind);
    assert.match(content, /^## TODO: /m, `${kind} has TODO headings to rename`);
  }
});
