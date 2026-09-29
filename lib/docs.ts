import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { docLinkUrl, docPageUrl } from "./doc-links.mjs";

/**
 * A project's docs, as this site renders them (ADR 0006).
 *
 * The docs are written in the tool's own repository. `npm run docs:pull` copies
 * them into content/docs/<project>/ at a commit and records where they came from
 * in content/docs/sources.json; `npm run docs:verify` fails when the copy and the
 * commit disagree by a byte. The build reads only the copy, so it stays offline.
 */
const DOCS_DIR = path.join(process.cwd(), "content", "docs");

export type DocSource = {
  /** `owner/name` on GitHub. */
  repo: string;
  /** The docs directory in that repository, e.g. `docs/guide`. */
  path: string;
  /** What was asked for when pulling: a tag, a branch or a commit. */
  ref: string;
  /** The commit the copy is of. Everything links here, never to a branch. */
  commit: string;
  /** The day of the pull, `YYYY-MM-DD`. */
  pulled: string;
};

export type DocPageMeta = {
  project: string;
  /** The file name without `.md`; `index` is the overview. */
  page: string;
  title: string;
  description: string;
  order: number;
  href: string;
};

export type DocPage = DocPageMeta & { content: string };

/** Every project with docs, keyed by project slug. Empty when there are none. */
export function getDocSources(): Record<string, DocSource> {
  const file = path.join(DOCS_DIR, "sources.json");
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, DocSource>) : {};
}

export function getDocSource(project: string): DocSource | undefined {
  return getDocSources()[project];
}

function readPage(project: string, page: string): DocPage {
  const { data, content } = matter(fs.readFileSync(path.join(DOCS_DIR, project, `${page}.md`), "utf8"));
  return {
    project,
    page,
    title: String(data.title ?? page),
    description: String(data.description ?? ""),
    order: Number(data.order),
    href: docPageUrl(project, page),
    content,
  };
}

/** A project's pages in reading order: `order` from each page's frontmatter. */
export function getDocPages(project: string): DocPageMeta[] {
  if (!getDocSource(project)) return [];
  return fs
    .readdirSync(path.join(DOCS_DIR, project))
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { content, ...meta } = readPage(project, f.replace(/\.md$/, ""));
      void content;
      return meta;
    })
    .sort((a, b) => a.order - b.order || a.page.localeCompare(b.page));
}

export function getDocPage(project: string, page: string): DocPage {
  return readPage(project, page);
}

/** `v0.4.0` when the pull named a tag; otherwise the branch and the commit it was at. */
export function docVersion(source: DocSource): string {
  const short = source.commit.slice(0, 7);
  if (/^v\d/.test(source.ref)) return source.ref;
  return source.ref === source.commit ? short : `${source.ref} @ ${short}`;
}

/** The docs, or one page of them, on GitHub at the pinned commit. */
export function docSourceUrl(source: DocSource, page?: string): string {
  return page === undefined
    ? `https://github.com/${source.repo}/tree/${source.commit}/${source.path}`
    : `https://github.com/${source.repo}/blob/${source.commit}/${source.path}/${page}.md`;
}

/** A link from a docs page, as the site should print it (lib/doc-links.mjs). */
export function resolveDocHref(project: string, source: DocSource, href: string): string {
  return docLinkUrl(href, { project, repo: source.repo, commit: source.commit, dir: source.path });
}
