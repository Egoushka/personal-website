// How a link in a project's docs becomes a link on this site (ADR 0006).
// The docs are written in the tool's own repository, so their relative links
// point at files there. A link to another page of the docs becomes that page
// here; a link to anything else in the repository becomes the file on GitHub at
// the pinned commit, so it shows what the docs were written against. Shared by
// lib/docs.ts, the validator and scripts/docs.mjs, so it is plain JavaScript.
import path from "node:path";

/** `https:`, `mailto:` and any other scheme: left as written. */
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * What a link in a docs page points at. `dir` is the docs directory in the
 * repository (`docs/guide`); a page is a `.md` file directly in it. A path that
 * starts with `/` is repository-root-relative, as GitHub reads it.
 * @param {string} href
 * @param {string} dir
 * @returns {{ kind: "external" } | { kind: "anchor", fragment: string }
 *   | { kind: "page", page: string, fragment: string }
 *   | { kind: "repo", file: string, fragment: string, tree: boolean }
 *   | { kind: "outside" }}
 */
export function classifyDocLink(href, dir) {
  if (SCHEME.test(href) || href.startsWith("//")) return { kind: "external" };
  const hash = href.indexOf("#");
  const target = hash < 0 ? href : href.slice(0, hash);
  const fragment = hash < 0 ? "" : href.slice(hash + 1);
  if (target === "") return { kind: "anchor", fragment };
  const file = path.posix.normalize(
    target.startsWith("/") ? target.slice(1) : path.posix.join(dir, target),
  ).replace(/\/$/, "");
  if (file === ".." || file.startsWith("../")) return { kind: "outside" };
  if (path.posix.dirname(file) === dir && file.endsWith(".md")) {
    return { kind: "page", page: path.posix.basename(file, ".md"), fragment };
  }
  return { kind: "repo", file, fragment, tree: target.endsWith("/") };
}

/** A docs page's route: the overview (`index.md`) is the docs root. */
export function docPageUrl(/** @type {string} */ project, /** @type {string} */ page) {
  return page === "index" ? `/projects/${project}/docs/` : `/projects/${project}/docs/${page}/`;
}

/**
 * Where a link lands on the site. `outside` — a path that climbs out of the
 * repository — is left as written; the validator fails it before it ships.
 * @param {string} href
 * @param {{ project: string, repo: string, commit: string, dir: string }} source
 */
export function docLinkUrl(href, source) {
  const link = classifyDocLink(href, source.dir);
  const hash = "fragment" in link && link.fragment ? `#${link.fragment}` : "";
  switch (link.kind) {
    case "anchor":
      return hash;
    case "page":
      return docPageUrl(source.project, link.page) + hash;
    case "repo":
      return `https://github.com/${source.repo}/${link.tree ? "tree" : "blob"}/${source.commit}/${link.file}${hash}`;
    default:
      return href;
  }
}
