// The kinds of post, and what each one owes a reader (docs/writing/README.md).
// One list, read by lib/posts.ts (the site) and scripts/validate-content.mjs (the
// gate). Plain JavaScript for the same reason as lib/markdown.mjs: the validator
// runs under bare `node`.

/**
 * - `finding`: a measured result is the point.
 * - `incident`: something broke; how, and why nothing showed it.
 * - `build`: why a thing I built is shaped the way it is, and what it costs.
 * @type {readonly ["finding", "incident", "build"]}
 */
export const POST_KINDS = ["finding", "incident", "build"];
