import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import { byNewest, getAllPosts, getPost, getProjectPosts, getRelatedPosts, tableOfContents, type PostMeta } from "../lib/posts";
import { countWords, parseMarkdown } from "../lib/markdown.mjs";

/** The h2 ids the post page gets: the same remark → rehype → rehype-slug chain react-markdown runs. */
function renderedH2Ids(markdown: string): string[] {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeSlug);
  const tree = processor.runSync(processor.parse(markdown)) as { children?: unknown[] };
  const ids: string[] = [];
  const walk = (node: any) => {
    if (node.type === "element" && node.tagName === "h2") ids.push(String(node.properties.id));
    node.children?.forEach(walk);
  };
  walk(tree);
  return ids;
}

const FIXTURES: Record<string, string> = {
  underscore: "## snake_case and __bold__\n\ntext\n\n## plain",
  link: "## See [the docs](https://example.com) now\n\n## `inline` code\n",
  inlineCode: "## The `--toc-y` property\n",
  duplicates: "## Setup\n\n### Setup\n\n## Setup\n\n## Setup\n",
  fence: "## Real\n\n```md\n## Not a heading\n```\n\n## Also real\n",
};

test("TOC ids equal rehype-slug's h2 ids, on every post and every fixture", () => {
  const cases: [string, string][] = [
    ...getAllPosts().map((p): [string, string] => [p.slug, getPost(p.slug).content]),
    ...Object.entries(FIXTURES),
  ];
  for (const [name, markdown] of cases) {
    const toc = tableOfContents(markdown).map((h) => h.id);
    assert.deepEqual(toc, renderedH2Ids(markdown), name);
    assert.ok(toc.length > 0, `${name} has headings`);
  }
});

test("TOC text drops markup, and a heading in a fence is not one", () => {
  assert.deepEqual(tableOfContents(FIXTURES.fence).map((h) => h.text), ["Real", "Also real"]);
  assert.deepEqual(tableOfContents(FIXTURES.link).map((h) => h.text), ["See the docs now", "inline code"]);
  assert.deepEqual(tableOfContents(FIXTURES.duplicates).map((h) => h.id), ["setup", "setup-2", "setup-3"]);
});

test("the word count is prose only", () => {
  const words = (md: string) => countWords(parseMarkdown(md));
  assert.equal(words("one two three"), 3);
  assert.equal(words("**state**ful and [a link](/x/) with `code`"), 6);
  assert.equal(words("## Heading\n\n- item one\n- item two"), 5);
  assert.equal(words("before\n\n```bash\n# a comment\nkubectl get pods -A\n```\n\nafter"), 2);
  assert.equal(words("text <span>html</span>\n\n<div>\nblock html\n</div>"), 2);
  assert.equal(words("| a | b |\n|---|---|\n| c d | e |"), 5);
});

test("posts sort newest first and the slug breaks ties", () => {
  const post = (slug: string, date: string) => ({ slug, date }) as PostMeta;
  const input = [post("b", "2026-01-01"), post("c", "2026-02-01"), post("a", "2026-01-01")];
  const sorted = [...input].sort(byNewest).map((p) => p.slug);
  assert.deepEqual(sorted, ["c", "a", "b"]);
  assert.deepEqual([...input].reverse().sort(byNewest).map((p) => p.slug), sorted);
  assert.deepEqual(getAllPosts(), [...getAllPosts()].sort(byNewest));
});

test("a project's posts: its write-up leads, the rest follow newest first", () => {
  const homelab = getProjectPosts("homelab-gitops", "homelab").map((p) => p.slug);
  assert.equal(homelab[0], "homelab");
  const rest = getAllPosts().filter((p) => p.project === "homelab-gitops" && p.slug !== "homelab");
  assert.deepEqual(homelab.slice(1), rest.map((p) => p.slug));
  assert.ok(homelab.length >= 3, "the homelab write-up, the DNS post and the silent deploys");
  // No write-up: newest first. No posts: nothing, never an error.
  assert.deepEqual(getProjectPosts("homelab-gitops").map((p) => p.slug), [...homelab.slice(1), "homelab"].sort(
    (a, b) => byNewest(getAllPosts().find((p) => p.slug === a)!, getAllPosts().find((p) => p.slug === b)!),
  ));
  assert.deepEqual(getProjectPosts("no-such-project"), []);
});

test("read next: another post about the same project comes before a shared topic", () => {
  for (const post of getAllPosts().filter((p) => p.project)) {
    const siblings = getAllPosts().filter((p) => p.project === post.project && p.slug !== post.slug);
    if (siblings.length === 0) continue;
    assert.equal(getRelatedPosts(post.slug, 1)[0]?.project, post.project, post.slug);
  }
});

// ── validate-content, run over fixture trees ────────────────────────────────

const VALIDATOR = path.resolve("scripts/validate-content.mjs");
const TOPICS_TS = fs.readFileSync("lib/topics.ts", "utf8");
const FILLER = Array.from({ length: 320 }, (_, i) => `word${i}`).join(" ");

function post(front: Record<string, string>, body: string): string {
  const lines = Object.entries(front).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join("\n")}\n---\n\n${body}\n\n${FILLER} [home](/)\n`;
}

const BASE: Record<string, string> = {
  title: '"A post"',
  date: '"2026-01-10"',
  description: '"A description."',
  kind: '"finding"',
  topics: '["dotnet"]',
};

/**
 * Runs the validator in a temporary tree holding these posts, and these drafts;
 * returns its exit code and output.
 */
function validate(
  posts: Record<string, string>,
  siteTs = "export const site = {};\n",
  drafts: Record<string, string> = {},
  args: string[] = [],
) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-"));
  try {
    fs.mkdirSync(path.join(dir, "content", "posts"), { recursive: true });
    fs.mkdirSync(path.join(dir, "content", "drafts"), { recursive: true });
    fs.mkdirSync(path.join(dir, "lib"));
    fs.writeFileSync(path.join(dir, "lib", "topics.ts"), TOPICS_TS);
    fs.writeFileSync(path.join(dir, "lib", "site.ts"), siteTs);
    for (const [slug, text] of Object.entries(posts)) {
      fs.writeFileSync(path.join(dir, "content", "posts", `${slug}.md`), text);
    }
    for (const [slug, text] of Object.entries(drafts)) {
      fs.writeFileSync(path.join(dir, "content", "drafts", `${slug}.md`), text);
    }
    const run = spawnSync(process.execPath, [VALIDATOR, ...args], { cwd: dir, encoding: "utf8" });
    return { code: run.status, out: run.stdout + run.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function passes(posts: Record<string, string>, siteTs?: string) {
  const r = validate(posts, siteTs);
  assert.equal(r.code, 0, r.out);
}

function fails(posts: Record<string, string>, message: RegExp, siteTs?: string) {
  const r = validate(posts, siteTs);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, message);
}

const TARGET = post(BASE, "## Getting started\n\ntext");

test("validator: a clean post passes, and a bash comment in a fence is not a heading", () => {
  passes({ a: post(BASE, "## One\n\n```bash\n# not a heading\necho hi\n```") });
});

test("validator: deep links are checked against the target's headings", () => {
  passes({ a: post(BASE, "[x](/writing/b/#getting-started)"), b: TARGET });
  fails(
    { a: post(BASE, "[x](/writing/b/#nowhere)"), b: TARGET },
    /links to \/writing\/b\/#nowhere but that post has no heading with that id/,
  );
  fails({ a: post(BASE, "[x](/writing/missing/)") }, /links to \/writing\/missing\/ which does not exist/);
  fails({ a: post(BASE, "[x](#nowhere)") }, /links to "#nowhere" but this post has no heading/);
  fails({ a: post(BASE, "[x](/about)") }, /"\/about" needs a trailing slash/);
  passes({ a: post(BASE, "```md\n[x](/writing/missing/)\n```") });
});

test("validator: dates are quoted, real and not in the future", () => {
  fails({ a: post({ ...BASE, date: "2026-01-10" }, "") }, /date must be a quoted "YYYY-MM-DD" string/);
  fails({ a: post({ ...BASE, date: '"2026-02-31"' }, "") }, /date "2026-02-31" is not a real date/);
  fails({ a: post({ ...BASE, date: '"2999-01-01"' }, "") }, /date "2999-01-01" is in the future/);
});

test("validator: updated and correction", () => {
  passes({ a: post({ ...BASE, updated: '"2026-02-01"', correction: '"The census was 5,357."' }, "") });
  fails({ a: post({ ...BASE, updated: '"2026-01-09"' }, "") }, /updated "2026-01-09" is before date/);
  fails({ a: post({ ...BASE, updated: "2026-02-01" }, "") }, /updated must be a quoted/);
  fails({ a: post({ ...BASE, updated: '"2999-01-01"' }, "") }, /updated "2999-01-01" is in the future/);
  fails({ a: post({ ...BASE, correction: '"Fixed."' }, "") }, /correction needs `updated`/);
});

test("validator: topics and spanDays", () => {
  fails({ a: post({ ...BASE, topics: '["no-such-topic"]' }, "") }, /topic "no-such-topic" is not in lib\/topics.ts/);
  fails({ a: post({ ...BASE, spanDays: "1.5" }, "") }, /spanDays must be a positive whole number/);
  fails({ a: post({ ...BASE, spanDays: "0" }, "") }, /spanDays must be a positive whole number/);
  passes({ a: post({ ...BASE, spanDays: "51" }, "") });
});

test("validator: Cyrillic text declares its language", () => {
  passes({ a: post({ ...BASE, cyrillic: '"ru"' }, "Mostly `ок`.") });
  fails({ a: post(BASE, "Mostly `ок`.") }, /has Cyrillic text, so it needs `cyrillic/);
  fails({ a: post({ ...BASE, title: '"The word ок"' }, "") }, /has Cyrillic text/);
  fails({ a: post({ ...BASE, cyrillic: '"ua"' }, "") }, /cyrillic must be "uk" or "ru", got "ua"/);
  // A code block is code: lib/lang.ts leaves it alone, so it needs no declaration.
  passes({ a: post(BASE, "```txt\nпривіт\n```") });
});

test("validator: a write-up must be a published post", () => {
  passes({ a: TARGET }, 'const p = { writeup: "a" };\n');
  fails({ a: TARGET }, /writeup "draft-only" has no content\/posts\/draft-only.md/, 'const p = { writeup: "draft-only" };\n');
  fails({ a: TARGET }, /lib\/site.ts: links to \/writing\/a\/#nowhere/, 'const l = { href: "/writing/a/#nowhere" };\n');
});

// The projects literal the way lib/site.ts writes it: entries at two spaces, and
// a `slug:` outside it that must not pass for a project.
const PROJECTS_TS = [
  "export const projects: Project[] = [",
  "  {",
  '    slug: "chronicle",',
  '    writeup: "a",',
  "    readings: [",
  '      { label: "x", value: "1", source: "y" },',
  "    ],",
  "  },",
  "  {",
  '    slug: "attest",',
  "  },",
  "];",
  "",
  'export const jobs = [{ slug: "production" }];',
  "",
].join("\n");

test("validator: every post has a kind", () => {
  const noKind = Object.fromEntries(Object.entries(BASE).filter(([k]) => k !== "kind"));
  fails({ a: post(noKind, "") }, /kind is required — one of finding, incident, build/);
  fails({ a: post({ ...BASE, kind: '"essay"' }, "") }, /kind must be one of finding, incident, build, got "essay"/);
  passes({ a: post({ ...BASE, kind: '"incident"' }, "") });
});

test("validator: a project is a slug in lib/site.ts, and a write-up names its project", () => {
  const chronicle = post({ ...BASE, project: '"chronicle"' }, "");
  passes({ a: chronicle, b: post({ ...BASE, project: '"attest"' }, "") }, PROJECTS_TS);
  fails({ a: chronicle, b: post({ ...BASE, project: '"production"' }, "") }, /project "production" is not a project slug/, PROJECTS_TS);
  fails({ a: post(BASE, "") }, /it is chronicle's write-up in lib\/site.ts, so it needs project: "chronicle"/, PROJECTS_TS);
});

test("validator: a TODO fails a published post and only warns in a draft", () => {
  fails({ a: post(BASE, "TODO: the fix") }, /still has a TODO from its skeleton/);
  const r = validate({ a: TARGET }, undefined, { d: post(BASE, "TODO: the fix") }, ["--drafts"]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /warn {2}content\/drafts\/d.md: still has a TODO/);
});

test("validator: --drafts checks drafts by the same rules, and an evidence pack is not a draft", () => {
  const drafts = { d: post({ ...BASE, kind: '"essay"' }, ""), "d.evidence": "# Evidence: d\n" };
  assert.equal(validate({ a: TARGET }, undefined, drafts).code, 0, "drafts are read only with --drafts");
  const r = validate({ a: TARGET }, undefined, drafts, ["--drafts"]);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /content\/drafts\/d.md: frontmatter: kind must be one of/);
  assert.doesNotMatch(r.out, /d\.evidence\.md/);
  // A draft may link to a published post, never to another draft.
  const linked = validate({ a: TARGET }, undefined, { d: post(BASE, "[x](/writing/e/)"), e: post(BASE, "") }, ["--drafts"]);
  assert.match(linked.out, /links to \/writing\/e\/ which does not exist/);
});
