// GitHub's alert syntax as callouts: a blockquote that opens with `[!NOTE]`,
// `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]` or `[!CAUTION]` renders as a
// `div.callout` with a title line, the same five GitHub renders. A project's docs
// are written in its own repository (ADR 0006), so they use the syntax that reads
// right there too (docs/project-docs.md). Plain JavaScript: components/Prose.tsx
// runs it, and a test runs it without a bundler.

const KINDS = /** @type {const} */ ({
  NOTE: "note",
  TIP: "tip",
  IMPORTANT: "important",
  WARNING: "warning",
  CAUTION: "caution",
});

/** What each kind's title line says. */
export const CALLOUT_TITLES = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/;

/** @param {any} node */
function transform(node) {
  if (node.type === "blockquote") {
    const first = node.children?.[0];
    const text = first?.type === "paragraph" ? first.children?.[0] : undefined;
    const hit = text?.type === "text" ? MARKER.exec(text.value) : null;
    if (hit) {
      const kind = KINDS[/** @type {keyof typeof KINDS} */ (hit[1])];
      text.value = text.value.slice(hit[0].length);
      if (text.value === "") first.children.shift();
      // A marker alone on its line may leave a hard break at the start.
      if (first.children[0]?.type === "break") first.children.shift();
      if (first.children.length === 0) node.children.shift();
      node.data = { hName: "div", hProperties: { className: ["callout", `callout--${kind}`] } };
      node.children.unshift({
        type: "paragraph",
        data: { hProperties: { className: ["callout-title"] } },
        children: [{ type: "text", value: CALLOUT_TITLES[kind] }],
      });
    }
  }
  for (const child of node.children ?? []) transform(child);
}

/** The remark plugin. */
export default function remarkCallouts() {
  return (/** @type {any} */ tree) => transform(tree);
}
