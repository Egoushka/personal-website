import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { docLinkUrl, docPageUrl } from "./doc-links.mjs";
import { DEFAULT_SECTION, DOC_SECTIONS } from "./doc-check.mjs";
import type { CyrillicLang } from "./lang";

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
  /** The sidebar group, one of DOC_SECTIONS (lib/doc-check.mjs). */
  section: string;
  /** The language the page's Cyrillic is marked with, when it has any. */
  cyrillic?: CyrillicLang;
  href: string;
};

/** The sidebar's groups: DOC_SECTIONS order, reading order inside each, empty ones left out. */
export type DocSection = { title: string; pages: DocPageMeta[] };

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
    // The overview is always the first thing in Get started; a page that names
    // no section is a guide.
    section:
      page === "index"
        ? DOC_SECTIONS[0]
        : typeof data.section === "string" && DOC_SECTIONS.includes(data.section)
          ? data.section
          : DEFAULT_SECTION,
    cyrillic: data.cyrillic === "uk" || data.cyrillic === "ru" ? data.cyrillic : undefined,
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

/** A project's pages grouped for the sidebar. */
export function docSections(pages: DocPageMeta[]): DocSection[] {
  return DOC_SECTIONS.map((title) => ({ title, pages: pages.filter((p) => p.section === title) })).filter(
    (s) => s.pages.length > 0,
  );
}

/** Every project with docs, in sources.json order (alphabetical by slug). */
export function getDocProjects(): { slug: string; source: DocSource; pages: DocPageMeta[] }[] {
  return Object.entries(getDocSources())
    .map(([slug, source]) => ({ slug, source, pages: getDocPages(slug) }))
    .filter((d) => d.pages.length > 0);
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
