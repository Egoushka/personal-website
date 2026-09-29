import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { draftsDir } from "../lib/drafts.mjs";

const NEW_POST = path.resolve("scripts/new-post.mjs");

/** A throwaway repository with one commit and a linked worktree under .claude/worktrees/. */
function repoWithWorktree() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "drafts-")));
  const main = path.join(dir, "main");
  const git = (cwd: string, ...args: string[]) => {
    const r = spawnSync("git", ["-c", "user.email=t@example.com", "-c", "user.name=t", ...args], { cwd, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  };
  fs.mkdirSync(main);
  git(main, "init", "-q");
  git(main, "commit", "-q", "--allow-empty", "--no-verify", "-m", "init");
  const worktree = path.join(main, ".claude", "worktrees", "post-a");
  git(main, "worktree", "add", "-q", "-b", "post-a", worktree);
  return { dir, main, worktree };
}

test("drafts: a worktree's drafts are the main checkout's, so removing the worktree keeps them", () => {
  const { dir, main, worktree } = repoWithWorktree();
  try {
    assert.equal(draftsDir(main), path.join(main, "content", "drafts"));
    assert.equal(draftsDir(worktree), path.join(main, "content", "drafts"));
    const below = path.join(worktree, "tests", "fixture");
    fs.mkdirSync(below, { recursive: true });
    assert.equal(draftsDir(below), path.join(below, "content", "drafts"), "a tree below the top keeps its own");
    assert.equal(draftsDir(dir), path.join(dir, "content", "drafts"), "outside git, its own");

    const made = spawnSync(process.execPath, [NEW_POST, "finding", "a-post"], { cwd: worktree, encoding: "utf8" });
    assert.equal(made.status, 0, made.stderr);
    assert.ok(fs.existsSync(path.join(main, "content", "drafts", "a-post.md")));
    assert.ok(fs.existsSync(path.join(main, "content", "drafts", "a-post.evidence.md")));
    assert.ok(!fs.existsSync(path.join(worktree, "content", "drafts")), "nothing is written into the worktree");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
