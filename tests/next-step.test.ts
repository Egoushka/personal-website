import { test } from "node:test";
import assert from "node:assert/strict";
import { pickNext } from "../lib/next-step";
import { projects } from "../lib/site";
import type { PostMeta } from "../lib/posts";

const post = (slug: string, date: string, over: Partial<PostMeta> = {}): PostMeta => ({
  slug, title: slug, date, description: "d", topics: [], readingTime: 1, wordCount: 200, ...over,
});
const pub = projects.find((p) => p.visibility === "public" && p.href)!;
const priv = projects.find((p) => p.visibility !== "public" || !p.href)!;

test("next: frontmatter related wins, then the closest post, then the newest", () => {
  const a = post("a", "2026-01-01", { related: "c" });
  const all = [a, post("b", "2026-02-01"), post("c", "2025-01-01")];
  assert.equal(pickNext(a, all, all[1]).read?.slug, "c");
  assert.equal(pickNext({ ...a, related: undefined }, all, all[2]).read?.slug, "c");
  assert.equal(pickNext({ ...a, related: undefined }, all, undefined).read?.slug, "b");
  assert.equal(pickNext(a, [a], undefined).read, undefined);
});

test("next: try goes to the public repo, else the project page, else the override, else nothing", () => {
  const all = [post("a", "2026-01-01")];
  const t = (over: Partial<PostMeta>) => pickNext(post("x", "2026-01-01", over), all, undefined).tryIt;
  assert.deepEqual(t({ project: pub.slug }), { label: `Try ${pub.name}`, href: pub.href, external: true });
  assert.deepEqual(t({ project: priv.slug }), { label: `About ${priv.name}`, href: `/projects/${priv.slug}/`, external: false });
  assert.deepEqual(t({ project: pub.slug, try: "/mira/" }), { label: "Try it", href: "/mira/", external: false });
  assert.deepEqual(t({ try: "https://example.com/x" }), { label: "Try it", href: "https://example.com/x", external: true });
  assert.equal(t({}), undefined);
});
