import { test } from "node:test";
import assert from "node:assert/strict";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { rehypeTables, TEXT_CELL_CHARS } from "../lib/tables";

type Hast = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: Hast[]; value?: string };

/** A markdown string through the site's pipeline as far as tables go, as a hast tree. */
function render(markdown: string): Hast {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeTables);
  return processor.runSync(processor.parse(markdown)) as Hast;
}

function find(node: Hast, tag: string, out: Hast[] = []): Hast[] {
  if (node.type === "element" && node.tagName === tag) out.push(node);
  for (const child of node.children ?? []) find(child, tag, out);
  return out;
}

const long = "x".repeat(TEXT_CELL_CHARS + 1);

test("tables: every table sits in a focusable, named scroll region", () => {
  const tree = render("| a | b | c |\n|---|---|---|\n| 1 | 2 | 3 |");
  const [region] = find(tree, "div");
  assert.deepEqual(region.properties?.className, ["table-scroll"]);
  assert.equal(region.properties?.role, "region");
  assert.equal(region.properties?.tabIndex, 0);
  assert.equal(region.properties?.["aria-label"], "Table: a, b, c");
  assert.equal(find(region, "table").length, 1);
});

test("tables: an empty header row is just a table, not a label of commas", () => {
  const [region] = find(render("| | |\n|---|---|\n| under 20 characters | 65% |"), "div");
  assert.equal(region.properties?.["aria-label"], "Table");
});

test("tables: a short table keeps its columns and native semantics; every body cell knows its header", () => {
  const [table] = find(render("| name | value | unit |\n|---|---|---|\n| cost | 0.5 | usd |"), "table");
  assert.deepEqual(table.properties?.className, ["table"]);
  assert.equal(table.properties?.role, undefined);
  assert.deepEqual(find(table, "td").map((td) => td.properties?.["data-label"]), ["name", "value", "unit"]);
  assert.equal(find(table, "th").some((th) => th.properties?.["data-label"] !== undefined), false, "headers are not labelled");
});

test("tables: a long cell makes a text table, with the roles display:block would otherwise drop", () => {
  const [table] = find(render(`| name | how we know | x |\n|---|---|---|\n| a | ${long} | c |`), "table");
  assert.deepEqual(table.properties?.className, ["table", "table--text"]);
  assert.equal(table.properties?.role, "table");
  const roles = (tag: string) => [...new Set(find(table, tag).map((n) => n.properties?.role))];
  assert.deepEqual(roles("thead"), ["rowgroup"]);
  assert.deepEqual(roles("tbody"), ["rowgroup"]);
  assert.deepEqual(roles("tr"), ["row"]);
  assert.deepEqual(roles("th"), ["columnheader"]);
  assert.deepEqual(roles("td"), ["cell"]);
  // The boundary: a cell exactly at the limit is short.
  const [edge] = find(render(`| a | b |\n|---|---|\n| ${"x".repeat(TEXT_CELL_CHARS)} | y |`), "table");
  assert.deepEqual(edge.properties?.className, ["table", "table--pairs"]);
});

test("tables: two columns are pairs, and a status cell gets a shape hook only for the three statuses", () => {
  const [pairs] = find(render("| field | meaning |\n|---|---|\n| a | b |"), "table");
  assert.deepEqual(pairs.properties?.className, ["table", "table--pairs"]);

  const [table] = find(render("| Capability | Status | Evidence |\n|---|---|---|\n| a | works | x |\n| b | Not yet | y |\n| c | mostly | z |\n| d | partial | w |"), "table");
  const statuses = find(table, "td").map((td) => td.properties?.["data-status"]);
  assert.deepEqual(statuses.filter((s) => s !== undefined), ["works", "not yet", "partial"]);
  // Only under a Status header: the same word in another column is just a word.
  const [other] = find(render("| a | b |\n|---|---|\n| works | works |"), "table");
  assert.equal(find(other, "td").some((td) => td.properties?.["data-status"] !== undefined), false);
});

test("tables: a short cell with inline code stays a short table", () => {
  const [table] = find(render("| a | b |\n|---|---|\n| `short` | text |"), "table");
  assert.deepEqual(table.properties?.className, ["table", "table--pairs"]);
});
