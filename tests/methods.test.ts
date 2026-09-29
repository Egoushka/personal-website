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
import {
  byFollowing,
  getAllMethods,
  getMethod,
  getPostMethods,
  getProjectMethods,
  parseMethod,
  type MethodMeta,
} from "../lib/methods";
import { tableOfContents } from "../lib/posts";
import { buildFeed } from "../lib/feed";
import { site } from "../lib/site";
import sitemap from "../app/sitemap";

// ── the loader (lib/methods.ts) ─────────────────────────────────────────────

test("methods: a file reads as it is written, and a missing list reads as empty", () => {
  const m = parseMethod(
    "watch-it-fail",
    [
      "---",
      'title: "Watch it fail"',
      'description: "A rule two projects follow."',
      'lastReviewed: "2026-09-01"',
      'projects: ["chronicle", "attest"]',
      'posts: ["story"]',
      'topics: ["debugging"]',
      "---",
      "",
      "## The rule",
      "",
      "Text.",
    ].join("\n"),
  );
  assert.deepEqual(
    { ...m, content: m.content.trim() },
    {
      slug: "watch-it-fail",
      title: "Watch it fail",
      description: "A rule two projects follow.",
      lastReviewed: "2026-09-01",
      projects: ["chronicle", "attest"],
      posts: ["story"],
      topics: ["debugging"],
      content: "## The rule\n\nText.",
    },
  );
  const bare = parseMethod("bare", '---\ntitle: "Bare"\n---\n\nText.\n');
  assert.deepEqual([bare.projects, bare.posts, bare.topics, bare.lastReviewed], [[], [], [], ""]);
});

test("methods: the one more projects follow comes first, then by title, then by slug", () => {
  const meta = (slug: string, title: string, followers: number): MethodMeta => ({
    slug, title, description: "", lastReviewed: "", posts: [], topics: [],
    projects: Array.from({ length: followers }, (_, i) => `p${i}`),
  });
  const input = [meta("c", "Beta", 2), meta("d", "Alpha", 2), meta("b", "Gamma", 3), meta("a", "Alpha", 2)];
  assert.deepEqual([...input].sort(byFollowing).map((m) => m.slug), ["b", "a", "d", "c"]);
  assert.deepEqual(getAllMethods(), [...getAllMethods()].sort(byFollowing));
});

test("methods: a project's page and a post's line read the methods' own frontmatter", () => {
  const methods = getAllMethods();
  assert.ok(methods.length > 0, "/methods/<slug>/ exports nothing without a method (ADR 0008)");
  for (const m of methods) {
    for (const p of m.projects) assert.ok(getProjectMethods(p).some((x) => x.slug === m.slug), `${p} lists ${m.slug}`);
    for (const p of m.posts) assert.ok(getPostMethods(p).some((x) => x.slug === m.slug), `${p} links ${m.slug}`);
  }
  assert.ok(getPostMethods("silent-deploys").some((m) => m.slug === "checks-that-fail-silently"));
  assert.deepEqual(getProjectMethods("no-such-project"), []);
  assert.deepEqual(getPostMethods("no-such-post"), []);
});

/** The h2 ids the method page gets: the chain react-markdown runs, as in content.test.ts. */
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

test("methods: the contents list's ids are the page's h2 ids", () => {
  for (const { slug } of getAllMethods()) {
    const { content } = getMethod(slug);
    assert.deepEqual(tableOfContents(content).map((h) => h.id), renderedH2Ids(content), slug);
  }
});

test("methods: in the sitemap, and in no feed", () => {
  const urls = sitemap().map((e) => e.url.replace(site.url, ""));
  assert.ok(urls.includes("/methods/"));
  for (const m of getAllMethods()) assert.ok(urls.includes(`/methods/${m.slug}/`), m.slug);

  const feed = buildFeed();
  const items: { url: string }[] = JSON.parse(feed.json1()).items;
  assert.ok(items.length > 0);
  assert.deepEqual(items.filter((i) => i.url.includes("/methods/")), []);
  for (const xml of [feed.rss2(), feed.atom1()]) {
    const links = [...xml.matchAll(/<link>([^<]*)<\/link>|<link\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1] ?? m[2]);
    assert.deepEqual(links.filter((l) => l.includes("/methods/")), []);
  }
});

// ── the validator's method rules, over fixture trees ────────────────────────

const VALIDATOR = path.resolve("scripts/validate-content.mjs");
const EVIDENCE = path.resolve("scripts/evidence.mjs");
const TOPICS_TS = fs.readFileSync("lib/topics.ts", "utf8");
const HIGHLIGHT_TS = fs.readFileSync("lib/highlight.ts", "utf8");
const FILLER = Array.from({ length: 320 }, (_, i) => `word${i}`).join(" ");

// The projects literal the way lib/site.ts writes it (see content.test.ts).
const SITE_TS = [
  "export const projects: Project[] = [",
  "  {",
  '    slug: "chronicle",',
  "  },",
  "  {",
  '    slug: "attest",',
  "  },",
  "];",
  "",
].join("\n");

/** A published post about chronicle, so a link to it can show chronicle. */
const STORY = `---\ntitle: "A story"\ndate: "2026-01-10"\ndescription: "D."\nkind: "incident"\nproject: "chronicle"\ntopics: ["debugging"]\n---\n\n## Found\n\n${FILLER} [home](/)\n`;

const TODAY = new Date().toISOString().slice(0, 10);
const FRONT: Record<string, string | undefined> = {
  title: '"Watch it fail"',
  description: '"A rule two projects follow."',
  lastReviewed: `"${TODAY}"`,
  projects: '["chronicle", "attest"]',
  posts: '["story"]',
  topics: '["debugging"]',
};
const RULE = "## A check counts once it has failed\n\nIt has three outcomes, and one looks like a pass.";
const CAME = "## Two projects where it failed quietly\n\nIn [Chronicle](/projects/chronicle/) a rule never ran.\n\nIn [Attest](/projects/attest/docs/) the tests were fiction.";
const COST = "## The test is bigger than the check\n\nA second test.";
const BREAK = "## Where I still let it slide\n\nWhen I know it and say so.";

/** A method file: FRONT with these keys replaced (undefined drops one), and these sections. */
function method(front: Record<string, string | undefined> = {}, sections = [RULE, CAME, COST, BREAK]): string {
  const lines = Object.entries({ ...FRONT, ...front })
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join("\n")}\n---\n\n${sections.join("\n\n")}\n`;
}

/** Runs the validator in a temporary tree: lib/, the story post, and these files. */
function validate(files: Record<string, string>, args: string[] = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "methods-"));
  try {
    const tree = {
      "lib/topics.ts": TOPICS_TS,
      "lib/highlight.ts": HIGHLIGHT_TS,
      "lib/site.ts": SITE_TS,
      "content/posts/story.md": STORY,
      ...files,
    };
    for (const [file, text] of Object.entries(tree)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), text);
    }
    const run = spawnSync(process.execPath, [VALIDATOR, ...args], { cwd: dir, encoding: "utf8" });
    return { code: run.status, out: run.stdout + run.stderr };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function passes(text: string) {
  const r = validate({ "content/methods/watch.md": text });
  assert.equal(r.code, 0, r.out);
  return r.out;
}

function fails(text: string, message: RegExp) {
  const r = validate({ "content/methods/watch.md": text });
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, message);
}

test("validator: a method with two projects, four sections and a link to each project passes", () => {
  assert.match(passes(method()), /\+ 1 method\(s\) checked/);
  // No post tells its story yet: the projects' own pages still show where it came from.
  passes(method({ posts: "[]" }));
});

test("validator: a method is earned by two projects that exist", () => {
  fails(method({ projects: '["chronicle"]' }), /projects names 1 project\(s\) — a method is earned by two or more/);
  fails(method({ projects: '["chronicle", "chronicle"]' }), /projects names 1 project\(s\)/);
  fails(method({ projects: '["chronicle", "production"]' }), /project "production" is not a project slug in lib\/site.ts/);
  fails(method({ projects: undefined }), /projects must be a list of project slugs/);
});

test("validator: a method's posts are published, never drafts", () => {
  const r = validate(
    { "content/methods/watch.md": method({ posts: '["draft-only"]' }), "content/drafts/draft-only.md": STORY },
    ["--drafts"],
  );
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /posts names "draft-only", which has no content\/posts\/draft-only.md/);
  fails(method({ posts: undefined }), /posts must be a list of published post slugs/);
});

test("validator: a method is four sections, in order, each with prose", () => {
  fails(method({}, [RULE, CAME, COST]), /body has 3 `##` section\(s\) — a method has four, in order: the rule, where it came from/);
  fails(method({}, [RULE, CAME, COST, BREAK, "## Also\n\nMore."]), /body has 5 `##` section\(s\)/);
  fails(method({}, [RULE, CAME, "## The test is bigger than the check", BREAK]), /section "The test is bigger than the check" has no prose/);
  fails(method({}, ["# Title", RULE, CAME, COST, BREAK]), /top-level '# heading'/);
});

test("validator: where it came from links every project it names — its page, its docs, or a post about it", () => {
  fails(
    method({}, [RULE, "## Two projects\n\nIn [Chronicle](/projects/chronicle/) a rule never ran. Attest too.", COST, BREAK]),
    /"Two projects" does not link attest — its project page, its docs, or a post about it/,
  );
  // A link to a post about chronicle shows chronicle; a project's docs show it too.
  passes(method({}, [RULE, "## Two projects\n\n[The story](/writing/story/). [Attest](/projects/attest/docs/quickstart/).", COST, BREAK]));
  // A link in another section does not count.
  fails(
    method({}, [RULE, "## Two projects\n\n[Chronicle](/projects/chronicle/).", COST, "## Breaking it\n\n[Attest](/projects/attest/)."]),
    /does not link attest/,
  );
});

test("validator: lastReviewed is a real, quoted date; an old one warns and never fails", () => {
  const old = validate({ "content/methods/watch.md": method({ lastReviewed: '"2020-01-01"' }) });
  assert.equal(old.code, 0, old.out);
  assert.match(old.out, /warn {2}content\/methods\/watch.md: lastReviewed "2020-01-01" is \d+ days old/);
  assert.doesNotMatch(passes(method()), /days old/);
  fails(method({ lastReviewed: '"2999-01-01"' }), /lastReviewed "2999-01-01" is in the future/);
  fails(method({ lastReviewed: "2026-01-10" }), /lastReviewed must be a quoted "YYYY-MM-DD" string/);
  fails(method({ lastReviewed: undefined }), /lastReviewed is required/);
});

test("validator: a method's frontmatter, a TODO, and a slug a post already has", () => {
  fails(method({ description: `"${"x".repeat(161)}"` }), /description is 161 chars, max 160/);
  fails(method({ topics: '["no-such-topic"]' }), /topic "no-such-topic" is not in lib\/topics.ts/);
  fails(method({ title: undefined }), /title is required/);
  fails(method({}, [RULE, CAME, "## What it costs\n\nTODO: the price.", BREAK]), /still has a TODO/);
  const twin = validate({ "content/methods/story.md": method() });
  assert.equal(twin.code, 1, twin.out);
  assert.match(twin.out, /slug is also content\/posts\/story.md: the two would share content\/drafts\/story.evidence.md/);
});

test("validator: a link to a method is checked like a link to a post", () => {
  const linking = (href: string) =>
    validate({
      "content/methods/watch.md": method(),
      "content/posts/story.md": STORY.replace("[home](/)", `[the method](${href})`),
    });
  assert.equal(linking("/methods/watch/").code, 0);
  assert.equal(linking("/methods/watch/#a-check-counts-once-it-has-failed").code, 0);
  assert.match(linking("/methods/gone/").out, /links to \/methods\/gone\/ which does not exist/);
  assert.match(linking("/methods/watch/#nowhere").out, /links to \/methods\/watch\/#nowhere but that method has no heading/);
  assert.match(linking("/methods/watch").out, /"\/methods\/watch" needs a trailing slash/);
});

// ── the evidence gate reads a method ────────────────────────────────────────

test("evidence: the gate reads a method when no draft or post has its slug", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-method-"));
  const run = (...args: string[]) => spawnSync(process.execPath, [EVIDENCE, ...args], { cwd: dir, encoding: "utf8" });
  try {
    fs.mkdirSync(path.join(dir, "content", "methods"), { recursive: true });
    fs.mkdirSync(path.join(dir, "content", "drafts"), { recursive: true });
    fs.writeFileSync(path.join(dir, "content", "methods", "m.md"), '---\ntitle: "Watch it fail"\ndescription: "x"\n---\n\nIt took 51 days.\n');
    assert.equal(run("m", "--init").status, 0);
    assert.equal(run("m").status, 1, "a row without a source fails");
    fs.writeFileSync(
      path.join(dir, "content", "drafts", "m.evidence.md"),
      "Thesis: A check counts once it has failed.\n\n| Claim | Value | Source |\n|---|---|---|\n| how long | 51 days | a post's frontmatter |\n",
    );
    const done = run("m");
    assert.equal(done.status, 0, done.stdout + done.stderr);
    assert.match(done.stdout, /1 figure\(s\) in the post, 1 row\(s\) in the pack/);
    fs.rmSync(path.join(dir, "content", "methods", "m.md"));
    assert.match(run("m").stderr, /no content\/drafts\/m.md, content\/posts\/m.md or content\/methods\/m.md/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
