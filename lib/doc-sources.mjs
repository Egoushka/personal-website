// The parts of scripts/docs.mjs that need no network, so the tests can run them
// (ADR 0006): which commit a ref names, how a copy differs from its commit, and
// which links from the docs into the rest of the repository do not exist there.
import path from "node:path";
import { classifyDocLink } from "./doc-links.mjs";
import { headings, parseMarkdown } from "./markdown.mjs";

/**
 * The commit a ref names, from `git ls-remote <url> <ref> <ref>^{}` output. A tag
 * wins over a branch of the same name, and an annotated tag is read through to
 * its commit (`^{}`), never taken as the tag object.
 * @param {string} lsRemote
 * @param {string} ref
 */
export function pickCommit(lsRemote, ref) {
  const refs = new Map(
    lsRemote.split("\n").filter(Boolean).map((line) => {
      const [sha, name] = line.split(/\s+/);
      return [name, sha];
    }),
  );
  const sha =
    refs.get(`refs/tags/${ref}^{}`) ?? refs.get(`refs/tags/${ref}`) ?? refs.get(`refs/heads/${ref}`);
  if (!sha) throw new Error(`no tag or branch named "${ref}"`);
  return sha;
}

/**
 * How a copy differs from the files at its commit, both keyed by file name.
 * @param {Map<string, Buffer>} expected the files at the pinned commit
 * @param {Map<string, Buffer>} actual the copy in content/docs/<project>/
 */
export function diffDocs(expected, actual) {
  return {
    missing: [...expected.keys()].filter((f) => !actual.has(f)).sort(),
    extra: [...actual.keys()].filter((f) => !expected.has(f)).sort(),
    changed: [...expected.keys()].filter((f) => actual.has(f) && !expected.get(f).equals(actual.get(f))).sort(),
  };
}

/** Every link and definition url in a markdown tree; code is not walked. */
function urls(node, out = []) {
  if ((node.type === "link" || node.type === "definition") && node.url) out.push(node.url);
  if (node.children) for (const child of node.children) urls(child, out);
  return out;
}

/**
 * Links from the docs to repository files that do not exist at the commit, or to
 * a `#fragment` a markdown file there has no heading for. Links between docs
 * pages are the validator's to check; it has the copy offline.
 * @param {Map<string, string>} pages page file name → markdown
 * @param {string} dir the docs directory in the repository
 * @param {Set<string>} files every file and directory path in the repository
 * @param {(file: string) => string} read a repository file's text
 * @returns {string[]}
 */
export function brokenRepoLinks(pages, dir, files, read) {
  const problems = [];
  for (const [name, markdown] of pages) {
    for (const href of urls(parseMarkdown(markdown))) {
      const link = classifyDocLink(href, dir);
      if (link.kind === "outside") problems.push(`${name}: "${href}" climbs out of the repository`);
      if (link.kind !== "repo") continue;
      if (!files.has(link.file)) {
        problems.push(`${name}: "${href}" — ${link.file} does not exist at this commit`);
      } else if (link.fragment && path.posix.extname(link.file) === ".md") {
        const ids = new Set(headings(parseMarkdown(read(link.file))).map((h) => h.id));
        if (!ids.has(link.fragment)) problems.push(`${name}: "${href}" — ${link.file} has no heading #${link.fragment}`);
      }
    }
  }
  return problems;
}
