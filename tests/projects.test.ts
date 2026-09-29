import { test } from "node:test";
import assert from "node:assert/strict";
import { figuresOf, groupProjects, type ProjectRow } from "../lib/project-rows";
import { projects } from "../lib/site";

const row = (slug: string, over: Partial<ProjectRow> = {}): ProjectRow => ({
  slug, name: slug, lang: "C#", shape: "library", status: "running", summary: "s",
  visibility: "public", posts: 0, featured: false, topics: [], ...over,
});
const slugs = (rows: ProjectRow[]) => rows.map((r) => r.slug);

test("projects: what other people can run comes first; the rest group by state, public before private", () => {
  const rows = [
    row("private-a", { visibility: "private" }),
    row("lead", { featured: true }),
    row("public-b"),
    row("building-x", { status: "building", visibility: "private" }),
    row("public-c"),
    row("paused-y", { status: "paused" }),
    row("building-z", { status: "building" }),
  ];
  const g = groupProjects(rows, { topic: null, publicOnly: false });
  assert.deepEqual(slugs(g.featured), ["lead"]);
  assert.deepEqual(g.states.map((s) => s.label), ["Running", "Building", "Paused"]);
  assert.deepEqual(slugs(g.states[0].rows), ["public-b", "public-c", "private-a"], "public first, then source order");
  assert.deepEqual(slugs(g.states[1].rows), ["building-z", "building-x"]);
  assert.deepEqual(slugs(g.states[2].rows), ["paused-y"]);
  assert.equal(g.shown.length, rows.length);
});

test("projects: topic and public filters both have to hold, and the featured section obeys them too", () => {
  const rows = [
    row("a", { topics: [{ slug: "mcp", name: "MCP" }], featured: true }),
    row("b", { topics: [{ slug: "mcp", name: "MCP" }], visibility: "private" }),
    row("c", { topics: [{ slug: "python", name: "Python" }] }),
  ];
  assert.deepEqual(slugs(groupProjects(rows, { topic: "mcp", publicOnly: false }).shown), ["a", "b"]);
  const both = groupProjects(rows, { topic: "mcp", publicOnly: true });
  assert.deepEqual(slugs(both.shown), ["a"]);
  assert.deepEqual(both.states.map((s) => s.rows.length), [0, 0, 0]);
  assert.deepEqual(slugs(groupProjects(rows, { topic: "python", publicOnly: true }).featured), []);
  assert.equal(groupProjects(rows, { topic: "nope", publicOnly: false }).shown.length, 0);
});

test("projects: a card shows at most three short figures, never the user count", () => {
  const readings = [
    { label: "Users", value: "1 — me" },
    { label: "Countries", value: "87" },
    { label: "Long", value: "x".repeat(31) },
    { label: "Defects fixed", value: "197" },
    { label: "Published", value: "nuget.org/packages/Attest" },
    { label: "Fourth", value: "4" },
  ];
  assert.deepEqual(figuresOf(readings).map((f) => f.label), ["Countries", "Defects fixed", "Published"]);
  assert.equal(figuresOf(readings, 1).length, 1);
});

test("projects: every project on the site lands in exactly one section", () => {
  const rows = projects.map((p) => row(p.slug, { featured: !p.side, status: p.status, visibility: p.visibility }));
  const g = groupProjects(rows, { topic: null, publicOnly: false });
  const placed = [...g.featured, ...g.states.flatMap((s) => s.rows)];
  assert.deepEqual(slugs(placed).sort(), slugs(rows).sort());
  assert.ok(g.featured.length >= 1, "at least one project is built for other people");
});
