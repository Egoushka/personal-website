import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { formatDate, getAllPosts, getAllSlugs } from "../lib/posts";
import { getReadings, n } from "../lib/readings";

// `npm test` runs under tsx because Node's own type stripping cannot follow
// lib/readings.ts's extensionless `./posts` import (ERR_MODULE_NOT_FOUND).

test("lib/posts.ts loads every post, newest first", () => {
  const files = fs
    .readdirSync("content/posts")
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3));
  assert.deepEqual(getAllSlugs().sort(), files.sort());

  const posts = getAllPosts();
  assert.equal(posts.length, files.length);
  posts.forEach((p, i) => {
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, p.slug);
    assert.ok(p.wordCount > 0 && p.readingTime >= 1, p.slug);
    if (i > 0) assert.ok(posts[i - 1].date >= p.date, `${posts[i - 1].slug} sorts before ${p.slug}`);
  });

  assert.equal(formatDate("2026-07-28"), "28 July 2026");
});

test("lib/readings.ts counts the posts it reports", () => {
  const posts = getAllPosts();
  const r = getReadings();
  assert.equal(r.posts, posts.length);
  assert.equal(r.latest?.slug, posts[0]?.slug);
  assert.equal(n(1394), "1,394");
});
