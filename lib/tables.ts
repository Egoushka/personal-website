/**
 * Tables, as the site renders them (docs and posts alike).
 *
 * A markdown table is a grid, and a grid does not survive a phone: three columns
 * with paragraph-length cells run to several hundred pixels of width, and the
 * whole page scrolls sideways. This plugin gives the stylesheet what it needs:
 *
 * - Every table sits in a `.table-scroll` region: a numeric table (a benchmark's
 *   columns are worth comparing) keeps its columns and scrolls inside it, and the
 *   region is focusable so the keyboard can scroll it.
 * - A table with a long cell is a `table--text` table. Below 700px the stylesheet
 *   stacks each of its rows into a labelled block, and the plugin gives it explicit
 *   ARIA roles, because `display: block` drops a table's native semantics.
 * - Every body cell carries `data-label`, its column's header, for the stacked form.
 * - A two-column table is `table--pairs`: field and meaning, where the second
 *   column's label would only repeat the header.
 * - A cell under a "Status" header holding works, partial or not yet carries
 *   `data-status`, so the stylesheet can mark it with a shape as well as a word.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** A cell longer than this makes a table a text table, stacked on a narrow screen. */
export const TEXT_CELL_CHARS = 60;

const STATUSES = new Set(["works", "partial", "not yet"]);

const ROLES: Record<string, string> = {
  table: "table",
  thead: "rowgroup",
  tbody: "rowgroup",
  tr: "row",
  th: "columnheader",
  td: "cell",
};

function textOf(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(textOf).join("");
}

const isElement = (n: HastNode, tag: string) => n.type === "element" && n.tagName === tag;

/** Every descendant element with this tag name, in document order. */
function find(node: HastNode, tag: string, out: HastNode[] = []): HastNode[] {
  for (const child of node.children ?? []) {
    if (isElement(child, tag)) out.push(child);
    find(child, tag, out);
  }
  return out;
}

const cells = (row: HastNode) => (row.children ?? []).filter((c) => isElement(c, "td") || isElement(c, "th"));
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

function enhance(table: HastNode): HastNode {
  const rows = find(table, "tr");
  const headerRow = rows.find((r) => cells(r).some((c) => isElement(c, "th")));
  const labels = headerRow ? cells(headerRow).map((c) => clean(textOf(c))) : [];
  const bodyRows = rows.filter((r) => r !== headerRow);
  const text = bodyRows.some((r) => cells(r).some((c) => clean(textOf(c)).length > TEXT_CELL_CHARS));

  for (const row of bodyRows) {
    cells(row).forEach((cell, i) => {
      cell.properties = { ...cell.properties };
      if (labels[i]) cell.properties["data-label"] = labels[i];
      const value = clean(textOf(cell)).toLowerCase();
      if (labels[i]?.toLowerCase() === "status" && STATUSES.has(value)) cell.properties["data-status"] = value;
    });
  }

  const classes = ["table"];
  if (text) classes.push("table--text");
  if (labels.length === 2) classes.push("table--pairs");
  table.properties = { ...table.properties, className: classes };

  if (text) {
    for (const el of [table, ...find(table, "thead"), ...find(table, "tbody"), ...rows, ...find(table, "th"), ...find(table, "td")]) {
      el.properties = { ...el.properties, role: ROLES[el.tagName ?? ""] };
    }
  }

  return {
    type: "element",
    tagName: "div",
    properties: {
      className: ["table-scroll"],
      role: "region",
      tabIndex: 0,
      // A table can have an empty header row (a bare list of figures): no names, just "Table".
      "aria-label": labels.some(Boolean) ? `Table: ${labels.filter(Boolean).join(", ")}` : "Table",
    },
    children: [table],
  };
}

/** Rehype plugin: see the file comment. */
export function rehypeTables() {
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (!node.children) return;
      node.children = node.children.map((child) => (isElement(child, "table") ? enhance(child) : (visit(child), child)));
    };
    visit(tree);
  };
}
