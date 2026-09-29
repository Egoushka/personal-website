import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyDocLink, docLinkUrl, docPageUrl } from "../lib/doc-links.mjs";
import { brokenRepoLinks, diffDocs, pickCommit } from "../lib/doc-sources.mjs";

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
