import { test } from "node:test";
import assert from "node:assert/strict";
import { collectNow, pickPrs, nugetItems, postItems, prItems, publicRepos, releaseItems, sinceDate, sortItems, validNow } from "../lib/now.mjs";

const repos = [
  { full_name: "Egoushka/attest", fork: false, private: false, owner: { login: "Egoushka" } },
  { full_name: "Egoushka/forked", fork: true, private: false, owner: { login: "Egoushka" } },
  { full_name: "Egoushka/hidden", fork: false, private: true, owner: { login: "Egoushka" } },
];
const allowed = publicRepos(repos);
const pr = (repo: string, title: string) => ({
  title,
  closed_at: "2026-11-14T10:00:00Z",
  repository_url: `https://api.github.com/repos/Egoushka/${repo}`,
  html_url: `https://github.com/Egoushka/${repo}/pull/1`,
  pull_request: { merged_at: "2026-11-14T10:00:00Z" },
});

test("only public, non-fork repositories survive, whatever the search returned", () => {
  assert.deepEqual([...allowed], ["Egoushka/attest"]);
  const items = prItems({ items: [pr("attest", "ok"), pr("hidden", "secret"), pr("forked", "f")] }, allowed);
  assert.deepEqual(items.map((i) => i.title), ["ok"]);
  assert.equal(items[0].date, "2026-11-14");
  assert.equal(items[0].repo, "attest");
});

test("a release outside the window or a private repository is dropped", () => {
  const ev = (repo: string, at: string) => ({
    type: "ReleaseEvent",
    repo: { name: `Egoushka/${repo}` },
    created_at: at,
    payload: { action: "published", release: { name: "", tag_name: "v1", published_at: at, html_url: `https://github.com/Egoushka/${repo}/releases/tag/v1` } },
  });
  const out = releaseItems([ev("attest", "2026-11-10T00:00:00Z"), ev("hidden", "2026-11-10T00:00:00Z"), ev("attest", "2026-01-01T00:00:00Z")], allowed, "2026-10-16");
  assert.deepEqual(out.map((i) => [i.repo, i.title, i.date]), [["attest", "v1", "2026-11-10"]]);
});

test("only a package's newest version in the window is listed, linked to its package page", () => {
  const out = nugetItems("Attest", [{ version: "1.0.0", published: "2026-01-01T00:00:00Z" }, { version: "1.2.0", published: "2026-11-10T09:00:00Z" }, { version: "1.2.1", published: "2026-11-11T09:00:00Z" }], "2026-10-16");
  assert.deepEqual(out.map((i) => i.href), ["https://www.nuget.org/packages/Attest/1.2.1"]);
});

test("posts link inside the site and the order is stable", () => {
  const posts = postItems([{ date: "2026-11-12", slug: "a", title: "A" }, { date: "2026-09-01", slug: "b", title: "B" }] as never, "2026-10-16");
  assert.deepEqual(posts.map((p) => p.href), ["/writing/a/"]);
  const sorted = sortItems([{ date: "2026-11-01", href: "b" }, { date: "2026-11-02", href: "z" }, { date: "2026-11-01", href: "a" }] as never);
  assert.deepEqual(sorted.map((i) => i.href), ["z", "a", "b"]);
});

test("a failing NuGet or events call drops that source, a failing GitHub search rejects", async () => {
  const search = { total_count: 7, items: [pr("attest", "ok")] };
  const fetchJson = async (url: string) => {
    if (url.includes("/repos?")) return repos;
    if (url.includes("search/issues")) return search;
    throw new Error("429");
  };
  const doc = await collectNow({ fetchJson, now: new Date("2026-11-15T00:00:00Z") });
  assert.equal(doc.mergedPrs, 7);
  assert.equal(doc.items.length, 1);
  assert.ok(validNow(doc));
  await assert.rejects(collectNow({ fetchJson: async () => { throw new Error("403"); } }));
});

test("sinceDate and validNow", () => {
  assert.equal(sinceDate(new Date("2026-11-15T12:00:00Z")), "2026-10-16");
  assert.equal(validNow({ generated: "x", items: [{ kind: "merged", date: "bad", title: "t", href: "h" }] }), false);
  assert.equal(validNow(null), false);
});

test("one busy repository and release-please PRs do not fill the page", () => {
  const mk = (repo: string, title: string) => ({ kind: "merged", date: "2026-11-14", repo, title, href: `https://github.com/Egoushka/${repo}/pull/${title}` });
  const items = [mk("a", "1"), mk("a", "2"), mk("a", "3"), mk("a", "4"), mk("a", "chore(main): release 1.0.0"), mk("b", "5")];
  assert.deepEqual(pickPrs(items as never).map((i) => i.title), ["1", "2", "3", "5"]);
});

test("dependency bumps are not shown", () => {
  const mk = (title: string) => ({ kind: "merged", date: "2026-11-14", repo: "a", title, href: `https://github.com/Egoushka/a/pull/${title.length}` });
  assert.deepEqual(pickPrs([mk("build: Bump X from 1 to 2"), mk("chore(deps): bump Y"), mk("feat: real")] as never).map((i) => i.title), ["feat: real"]);
});
