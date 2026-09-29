import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyDocLink, docLinkUrl, docPageUrl } from "../lib/doc-links.mjs";
import { brokenRepoLinks, diffDocs, pickCommit } from "../lib/doc-sources.mjs";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkCallouts from "../lib/callouts.mjs";
import { checkDocPages } from "../lib/doc-check.mjs";
import { parseMarkdown } from "../lib/markdown.mjs";
import { docSections, type DocPageMeta } from "../lib/docs";

const DIR = "docs/guide";
const SOURCE = { project: "chargehand", repo: "Egoushka/chargehand", commit: "a".repeat(40), dir: DIR };

test("docs: a link to another page stays on the site, anything else in the repo goes to GitHub at the commit", () => {
  assert.equal(docLinkUrl("quickstart.md", SOURCE), "/projects/chargehand/docs/quickstart/");
  assert.equal(docLinkUrl("./reference.md#commands", SOURCE), "/projects/chargehand/docs/reference/#commands");
  assert.equal(docLinkUrl("index.md", SOURCE), "/projects/chargehand/docs/");
  assert.equal(
    docLinkUrl("../adr/0017-split.md#decision", SOURCE),
    `https://github.com/Egoushka/chargehand/blob/${"a".repeat(40)}/docs/adr/0017-split.md#decision`,
  );
  assert.equal(docLinkUrl("../../README.md", SOURCE), `https://github.com/Egoushka/chargehand/blob/${"a".repeat(40)}/README.md`);
  assert.equal(docLinkUrl("../../schemas/", SOURCE), `https://github.com/Egoushka/chargehand/tree/${"a".repeat(40)}/schemas`);
  assert.equal(docLinkUrl("/LICENSE", SOURCE), `https://github.com/Egoushka/chargehand/blob/${"a".repeat(40)}/LICENSE`);
  assert.equal(docLinkUrl("#status", SOURCE), "#status");
  assert.equal(docLinkUrl("https://example.com/x", SOURCE), "https://example.com/x");
  assert.equal(docPageUrl("chargehand", "index"), "/projects/chargehand/docs/");
});

test("docs: a path out of the repository is `outside`, and a page is only a .md directly in the docs directory", () => {
  assert.deepEqual(classifyDocLink("../../../x.md", DIR), { kind: "outside" });
  assert.equal(classifyDocLink("sub/page.md", DIR).kind, "repo");
  assert.equal(classifyDocLink("../guide/quickstart.md", DIR).kind, "page");
  assert.equal(classifyDocLink("mailto:a@b.c", DIR).kind, "external");
});

test("docs: a ref names a commit — a tag before a branch, an annotated tag through to its commit", () => {
  const out = [
    "1111111111111111111111111111111111111111\trefs/heads/v1",
    "2222222222222222222222222222222222222222\trefs/tags/v1",
    "3333333333333333333333333333333333333333\trefs/tags/v1^{}",
    "4444444444444444444444444444444444444444\trefs/heads/main",
  ].join("\n");
  assert.equal(pickCommit(out, "v1"), "3".repeat(40));
  assert.equal(pickCommit(out, "main"), "4".repeat(40));
  assert.throws(() => pickCommit(out, "nope"), /no tag or branch named "nope"/);
});

test("docs: a copy differs from its commit by missing, extra and changed files", () => {
  const b = (s: string) => Buffer.from(s);
  const expected = new Map([["index.md", b("a")], ["quickstart.md", b("b")], ["reference.md", b("c")]]);
  const actual = new Map([["index.md", b("a")], ["quickstart.md", b("B")], ["extra.md", b("x")]]);
  assert.deepEqual(diffDocs(expected, actual), { missing: ["reference.md"], extra: ["extra.md"], changed: ["quickstart.md"] });
});

test("docs: links into the repository must exist at the commit, headings included", () => {
  const files = new Set(["README.md", "docs", "docs/adr", "docs/adr/0017-split.md"]);
  const read = (file: string) => (file === "docs/adr/0017-split.md" ? "## Decision\n\ntext\n" : "");
  const pages = new Map([
    ["index.md", "[ok](../adr/0017-split.md#decision) [bad heading](../adr/0017-split.md#nope) [gone](../../MISSING.md) [out](../../../x)"],
  ]);
  const problems = brokenRepoLinks(pages, DIR, files, read);
  assert.equal(problems.length, 3, problems.join("\n"));
  assert.match(problems.join("\n"), /has no heading #nope/);
  assert.match(problems.join("\n"), /MISSING.md does not exist at this commit/);
  assert.match(problems.join("\n"), /climbs out of the repository/);
});

// ── The docs contract (docs/project-docs.md) ────────────────────────────────


const LANGS = new Set(["text", "bash"]);

/** Pages as readDocDir() returns them, from name → file text. */
function pagesOf(files: Record<string, string>) {
  return Object.entries(files).map(([file, text]) => {
    const { data, content } = matter(text);
    return { file, page: file.replace(/\.md$/, ""), data, content, tree: parseMarkdown(content) };
  });
}

const page = (fm: string, body = "Text.") => `---\n${fm}\n---\n\n${body}\n`;

test("docs: a sidebar section comes from the closed list, and the overview belongs in Get started", () => {
  const ok = pagesOf({
    "index.md": page('title: "Overview"\ndescription: "d"\norder: 0\nsection: "Get started"'),
    "reference.md": page('title: "Reference"\ndescription: "d"\norder: 1\nsection: "Reference"'),
  });
  assert.deepEqual(checkDocPages(ok, { dir: DIR, where: "x", langs: LANGS }).errors, []);

  const bad = pagesOf({
    "index.md": page('title: "Overview"\ndescription: "d"\norder: 0\nsection: "Guides"'),
    "api.md": page('title: "API"\ndescription: "d"\norder: 1\nsection: "API"'),
  });
  const errors = checkDocPages(bad, { dir: DIR, where: "x", langs: LANGS }).errors.join("\n");
  assert.match(errors, /section must be one of/);
  assert.match(errors, /the overview belongs in "Get started"/);
});

test("docs: Cyrillic in a page needs `cyrillic`, or the site's build check fails after the pull", () => {
  const unmarked = pagesOf({ "index.md": page('title: "Overview"\ndescription: "d"\norder: 0', "The ИНН field.") });
  assert.match(checkDocPages(unmarked, { dir: DIR, where: "x", langs: LANGS }).errors.join("\n"), /needs `cyrillic/);

  const marked = pagesOf({ "index.md": page('title: "Overview"\ndescription: "d"\norder: 0\ncyrillic: "ru"', "The ИНН field.") });
  assert.deepEqual(checkDocPages(marked, { dir: DIR, where: "x", langs: LANGS }).errors, []);

  const wrong = pagesOf({ "index.md": page('title: "Overview"\ndescription: "d"\norder: 0\ncyrillic: "ua"') });
  assert.match(checkDocPages(wrong, { dir: DIR, where: "x", langs: LANGS }).errors.join("\n"), /must be "uk" or "ru"/);
});

test("docs: sections print in the contract's order, pages in reading order inside each, empty ones left out", () => {
  const meta = (p: string, order: number, section: string): DocPageMeta => ({
    project: "x", page: p, title: p, description: "", order, section, href: `/${p}/`,
  });
  const sections = docSections([
    meta("index", 0, "Get started"),
    meta("status", 9, "Project"),
    meta("reference", 5, "Reference"),
    meta("quickstart", 1, "Get started"),
  ]);
  assert.deepEqual(sections.map((s) => s.title), ["Get started", "Reference", "Project"]);
  assert.deepEqual(sections[0].pages.map((p) => p.page), ["index", "quickstart"]);
});

test("docs: GitHub's alert syntax renders as a titled callout, and a plain quote stays a quote", async () => {
  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkCallouts)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process("> [!WARNING]\n> The token is single-use.\n\n> Just a quote.\n"),
  );
  assert.match(html, /<div class="callout callout--warning">\s*<p class="callout-title">Warning<\/p>\s*<p>The token is single-use.<\/p>/);
  assert.match(html, /<blockquote>\s*<p>Just a quote.<\/p>\s*<\/blockquote>/);
  assert.doesNotMatch(html, /\[!WARNING\]/);
});

test("docs: a relative age fails the check before it can fail the site's build", () => {
  const pages = pagesOf({ "index.md": page('title: "Overview"\ndescription: "d"\norder: 0', "It re-fetches from 7 days ago.") });
  assert.match(checkDocPages(pages, { dir: DIR, where: "x", langs: LANGS }).errors.join("\n"), /relative age/);
});
