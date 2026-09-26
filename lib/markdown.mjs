// How a post body is read, shared by lib/posts.ts (the site) and
// scripts/validate-content.mjs (the gate). Plain JavaScript because the validator
// runs under bare `node`; one module so the two cannot disagree about what a word
// or a heading id is.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { toString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";

const parser = unified().use(remarkParse).use(remarkGfm);

/**
 * The markdown as the renderer sees it: GFM, so a `## ` line inside a fence is
 * code and a table is a table.
 * @param {string} markdown
 * @returns {import("mdast").Root}
 */
export function parseMarkdown(markdown) {
  return parser.parse(markdown);
}

// Nodes whose children are inline: those join without a space, so `**state**ful`
// is one word. Every other container separates its children.
const INLINE_PARENTS = new Set([
  "paragraph", "heading", "tableCell", "emphasis", "strong", "delete", "link", "linkReference",
]);

/** @param {any} node @returns {string} */
function prose(node) {
  if (node.type === "text" || node.type === "inlineCode") return node.value;
  if (!node.children) return " "; // code, html, images, breaks: not prose
  const sep = INLINE_PARENTS.has(node.type) ? "" : " ";
  return sep + node.children.map(prose).join(sep) + sep;
}

/**
 * Words of prose: text and inline code only. Fenced code, raw HTML, URLs and
 * markdown syntax are not words someone reads.
 * @param {import("mdast").Root} tree
 */
export function countWords(tree) {
  return prose(tree).split(/\s+/).filter(Boolean).length;
}

/**
 * Every heading in document order, with the id rehype-slug gives it. Every
 * heading goes through the slugger, not only the ones kept, because
 * github-slugger numbers repeats (`setup`, `setup-1`) across all of them.
 * @param {import("mdast").Root} tree
 * @returns {{ depth: number, id: string, text: string }[]}
 */
export function headings(tree) {
  const slugger = new GithubSlugger();
  /** @type {{ depth: number, id: string, text: string }[]} */
  const out = [];
  /** @param {any} node */
  const walk = (node) => {
    if (node.type === "heading") {
      const text = toString(node);
      out.push({ depth: node.depth, id: slugger.slug(text), text });
    } else if (node.children) node.children.forEach(walk);
  };
  walk(tree);
  return out;
}
