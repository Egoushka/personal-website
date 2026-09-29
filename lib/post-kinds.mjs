// The kinds of post, and what each one owes a reader (docs/writing/README.md).
// One list, read by lib/posts.ts (the site) and scripts/validate-content.mjs (the
// gate). Plain JavaScript for the same reason as lib/markdown.mjs: the validator
// runs under bare `node`.

/**
 * - `finding`: a measured result is the point.
 * - `incident`: something broke; how, and why nothing showed it.
 * - `build`: why a thing I built is shaped the way it is, and what it costs.
 * - `note`: one finding, short on purpose — the number or the surprise, its
 *   evidence, and what it does not tell you (ADR 0009).
 * @type {readonly ["finding", "incident", "build", "note"]}
 */
export const POST_KINDS = ["finding", "incident", "build", "note"];

/**
 * What a list, a post's page and the feeds call a post of this kind, or nothing.
 * Only a note is named: it is short on purpose, and a reader should know that
 * before opening it. The other kinds are what a post is by default.
 * @param {string | undefined} kind
 * @returns {"Note" | undefined}
 */
export function kindLabel(kind) {
  return kind === "note" ? "Note" : undefined;
}
