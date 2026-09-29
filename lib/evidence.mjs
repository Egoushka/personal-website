// The evidence pack: every figure a post states, next to where it came from
// (docs/writing/README.md). Pure functions, so the tests can run them on
// strings; scripts/evidence.mjs reads the files. Plain JavaScript so that script
// runs under bare `node`, like the validator.
import { parseMarkdown } from "./markdown.mjs";

/**
 * A figure as prose writes it: `37`, `1,217`, `48.2`, `$0.237`, and a dotted run
 * like `0.2.0` or `100.64.0.2` as one figure rather than three.
 *
 * Digits glued to a letter, or after a dot, slash, `@` or `#`, are an identifier,
 * not a claim: `H4`, `cx53`, `UTF-16`, `gpt-4o`, `p@1`, `#5`. A number written as
 * a word ("fifty-one") is a claim too, and invisible here; the review reads those.
 */
const FIGURE =
  /(?<![\p{L}\p{N}_./@#]|\p{L}-)[$€£]?(\d+(?:\.\d+){2,}|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/gu;
const DOTTED = /^\d+(?:\.\d+){2,}$/;

/**
 * One spelling per figure, so the post and the pack can write it differently:
 * `1,217` and `1217` match, `0.20` and `0.2` match, a dotted run matches exactly.
 * @param {string} raw
 */
export function normalize(raw) {
  const f = raw.replace(/^[$€£]/, "").replaceAll(",", "");
  return DOTTED.test(f) ? f : String(Number(f));
}

/**
 * Every figure in a string, in order.
 * @param {string} text
 * @returns {{ raw: string, value: string, index: number }[]}
 */
export function figures(text) {
  return [...text.matchAll(FIGURE)].map((m) => ({ raw: m[0], value: normalize(m[1]), index: m.index }));
}

// Nodes whose children are inline, as in lib/markdown.mjs: they join without a
// space, so `**48.2**%` stays one figure with its sign.
const INLINE_PARENTS = new Set([
  "paragraph", "heading", "tableCell", "emphasis", "strong", "delete", "link", "linkReference",
]);

/**
 * The prose a reader reads as claims: text, not code. Unlike the word count,
 * inline code is left out — `pg16` and `--budget 3` are names, not figures.
 * @param {any} node
 * @returns {string}
 */
function claimText(node) {
  if (node.type === "text") return node.value;
  if (node.type === "inlineCode" || !node.children) return " ";
  const sep = INLINE_PARENTS.has(node.type) ? "" : " ";
  return sep + node.children.map(claimText).join(sep) + sep;
}

/** About forty characters either side of a figure, on one line, in whole words. */
function around(text, index, length) {
  let from = Math.max(0, index - 40);
  let to = Math.min(text.length, index + length + 40);
  if (from > 0) from = text.indexOf(" ", from) + 1 || from;
  if (to < text.length) to = Math.max(text.lastIndexOf(" ", to), index + length);
  return text.slice(from, to).replace(/\s+/g, " ").trim();
}

/**
 * Every figure a post states — in the title, the description and the prose —
 * with a line of context, in reading order.
 * @param {{ title: string, description: string, body: string }} post
 */
export function statedFigures(post) {
  const parts = [
    ["title", post.title],
    ["description", post.description],
    ["body", claimText(parseMarkdown(post.body))],
  ];
  return parts.flatMap(([where, text]) =>
    figures(text).map((f) => ({ ...f, where, context: around(text, f.index, f.raw.length) })),
  );
}

/**
 * A pack: the `Thesis:` line and the rows of its Claim | Value | Source table.
 * @param {string} markdown
 */
export function parsePack(markdown) {
  const thesis = markdown.match(/^Thesis:[ \t]*(.*)$/m)?.[1].trim() ?? "";
  /** @type {{ claim: string, value: string, source: string, line: number }[]} */
  const rows = [];
  markdown.split("\n").forEach((line, i) => {
    if (!line.trimStart().startsWith("|")) return;
    const cells = line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());
    if (cells.every((c) => /^:?-{3,}:?$/.test(c))) return; // the separator row
    if (cells[0].toLowerCase() === "claim") return; // the header row
    const [claim = "", value = "", source = ""] = cells;
    rows.push({ claim, value, source, line: i + 1 });
  });
  return { thesis, rows };
}

/** A source that is still a promise. */
const UNSOURCED = /^(|todo\b.*|tbd\b.*|\?+)$/i;

/**
 * What the pack does not cover. A figure is covered when it appears in any row's
 * Claim or Value; a row is sourced when its Source says something other than a
 * placeholder. `unused` are Value figures the post no longer states.
 * @param {{ title: string, description: string, body: string }} post
 * @param {ReturnType<typeof parsePack>} pack
 */
export function checkPack(post, pack) {
  const covered = new Set(pack.rows.flatMap((r) => figures(`${r.claim} ${r.value}`).map((f) => f.value)));
  const stated = statedFigures(post);
  const statedValues = new Set(stated.map((f) => f.value));

  const missing = [];
  const reported = new Set();
  for (const f of stated) {
    if (covered.has(f.value) || reported.has(f.value)) continue;
    reported.add(f.value);
    missing.push(f);
  }

  const values = new Set(pack.rows.flatMap((r) => figures(r.value).map((f) => f.value)));
  return {
    thesis: !pack.thesis || /^todo\b/i.test(pack.thesis)
      ? "no Thesis: line — the post in one sentence, before the prose"
      : null,
    missing,
    unsourced: pack.rows.filter((r) => UNSOURCED.test(r.source)),
    unused: [...values].filter((v) => !statedValues.has(v)),
    stated: stated.length,
    rows: pack.rows.length,
  };
}

const cell = (/** @type {string} */ s) => s.replaceAll("|", "\\|");

/**
 * A new pack. With the post, one row per distinct figure it states, the Claim
 * cell holding the figure's context and every Source a TODO for the writer.
 * @param {string} slug
 * @param {{ title: string, description: string, body: string }} [post]
 */
export function initPack(slug, post) {
  const rows = [];
  const seen = new Set();
  for (const f of post ? statedFigures(post) : []) {
    if (seen.has(f.value)) continue;
    seen.add(f.value);
    rows.push(`| ${cell(f.context)} | ${cell(f.raw)} | TODO |`);
  }
  return [
    `# Evidence: ${slug}`,
    "",
    "Thesis: TODO — the post in one sentence. If it takes two, it is two posts.",
    "",
    "Every figure the post states, and where it came from: a commit, a file at a",
    `commit, a URL, or a command and its output. \`npm run evidence -- ${slug}\` fails`,
    "on a figure in the post that is not in this table, and on a row without a source.",
    "This file stays local (content/drafts/ is gitignored): a source may name a private repo.",
    "",
    "| Claim | Value | Source |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}
