// The rules a project's docs directory must pass before this site can render it
// (ADR 0006, docs/project-docs.md). Shared by scripts/validate-content.mjs, which
// runs them over the copies in content/docs/, and `npm run docs:check`, which runs
// them over a docs directory in the tool's own checkout before it is pushed.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { classifyDocLink } from "./doc-links.mjs";
import { headings, parseMarkdown, proseText } from "./markdown.mjs";

/** Google truncates a description around here, and the card under a title too. */
export const MAX_DESCRIPTION = 160;
/** Longer and the sidebar entry wraps to a third line. */
export const MAX_TITLE = 48;

/**
 * The sidebar's groups, in the order the sidebar prints them. A closed list, so
 * every project's docs read the same way: a visitor who learnt one sidebar has
 * learnt them all. A page with no `section` goes under "Guides"; the overview
 * (`index.md`) is always the first entry of "Get started".
 */
export const DOC_SECTIONS = ["Get started", "Guides", "Concepts", "Reference", "Project"];
export const DEFAULT_SECTION = "Guides";

/** Every fenced code block's language, "" for none. */
function fences(node, out = []) {
  if (node.type === "code") out.push(node.lang ?? "");
  if (node.children) for (const child of node.children) fences(child, out);
  return out;
}

/** Every link and definition url in a markdown tree; code is not walked. */
function urls(node, out = []) {
  if ((node.type === "link" || node.type === "definition") && node.url) out.push(node.url);
  if (node.children) for (const child of node.children) urls(child, out);
  return out;
}

/**
 * The `.md` pages of one docs directory, parsed.
 * @param {string} dir a directory on disk
 */
export function readDocDir(dir) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [];
  return files.map((file) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    return { file, page: file.replace(/\.md$/, ""), data, content, tree: parseMarkdown(content) };
  });
}

/**
 * Everything wrong with a set of docs pages that can be known offline.
 * @param {ReturnType<typeof readDocDir>} pages
 * @param {{ dir: string, where: string, langs: Set<string> }} opts
 *   `dir` is the docs directory in the repository (`docs/guide`), `where` prefixes
 *   every message, `langs` are the fence languages lib/highlight.ts loads.
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkDocPages(pages, { dir, where, langs }) {
  const errors = [];
  const warnings = [];
  if (!pages.some((p) => p.page === "index")) errors.push(`${where}: has no index.md — the overview is the docs root`);

  const pageIds = new Map(pages.map((p) => [p.page, new Set(headings(p.tree).map((h) => h.id))]));
  const orders = new Map();
  for (const p of pages) {
    const pfail = (msg) => errors.push(`${where}/${p.file}: ${msg}`);
    const pwarn = (msg) => warnings.push(`${where}/${p.file}: ${msg}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.page)) pfail("the file name must be lowercase kebab-case — it becomes the URL");
    if (typeof p.data.title !== "string" || !p.data.title) {
      pfail("frontmatter: title is required");
    } else if (p.data.title.length > MAX_TITLE) {
      pwarn(`frontmatter: title is ${p.data.title.length} chars; over ${MAX_TITLE} it wraps in the sidebar`);
    }
    if (typeof p.data.description !== "string" || !p.data.description) {
      pfail("frontmatter: description is required — it is the lead under the title, the card text and the meta description");
    } else if (p.data.description.length > MAX_DESCRIPTION) {
      pfail(`frontmatter: description is ${p.data.description.length} chars, max ${MAX_DESCRIPTION}`);
    }
    if (!Number.isInteger(p.data.order)) {
      pfail("frontmatter: order must be a whole number — it sets the reading order");
    } else if (orders.has(p.data.order)) {
      pfail(`frontmatter: order ${p.data.order} is also ${orders.get(p.data.order)}'s`);
    } else {
      orders.set(p.data.order, p.file);
    }
    if (p.data.section !== undefined && !DOC_SECTIONS.includes(p.data.section)) {
      pfail(`frontmatter: section must be one of ${DOC_SECTIONS.map((s) => `"${s}"`).join(", ")}, got ${JSON.stringify(p.data.section)}`);
    }
    // Cyrillic carries its language, as in a post (lib/lang.ts marks the runs):
    // unmarked, the site's build check fails after the pull.
    if (p.data.cyrillic !== undefined && p.data.cyrillic !== "uk" && p.data.cyrillic !== "ru") {
      pfail(`frontmatter: cyrillic must be "uk" or "ru", got ${JSON.stringify(p.data.cyrillic)}`);
    } else if (
      p.data.cyrillic === undefined &&
      /[\u0400-\u04FF]/.test(`${p.data.title ?? ""} ${p.data.description ?? ""} ${proseText(p.tree)}`)
    ) {
      pfail('the page has Cyrillic text, so it needs `cyrillic: "uk"` or `"ru"` in its frontmatter');
    }
    if (headings(p.tree).some((h) => h.depth === 1)) pfail("body has a '# heading' — the page renders its title as the <h1>");
    if (/\bTODO\b/.test(p.content)) pfail("still has a TODO");
    // The site prints no relative ages: its build check (R-03) fails on "N days ago"
    // in any page, since a static page cannot know what "ago" means when it is read.
    const age = proseText(p.tree).match(/\bdays? ago\b|\blatest (?:today|yesterday)\b/i);
    if (age) pfail(`"${age[0]}" reads as a relative age, which the site's build check rejects; name the window another way`);
    for (const lang of fences(p.tree)) {
      if (lang && !langs.has(lang)) pwarn(`a \`${lang}\` fence renders as plain text — lib/highlight.ts loads ${[...langs].join(", ")}`);
    }
    for (const href of urls(p.tree)) {
      const link = classifyDocLink(href, dir);
      if (link.kind === "outside") {
        pfail(`"${href}" climbs out of the repository`);
      } else if (link.kind === "page") {
        if (!pageIds.has(link.page)) pfail(`"${href}" links to a page these docs do not have`);
        else if (link.fragment && !pageIds.get(link.page).has(link.fragment)) {
          pfail(`"${href}" — ${link.page}.md has no heading #${link.fragment}`);
        }
      } else if (link.kind === "anchor" && link.fragment && !pageIds.get(p.page).has(link.fragment)) {
        pfail(`"#${link.fragment}" — this page has no heading with that id`);
      }
    }
  }
  const index = pages.find((p) => p.page === "index");
  if (index && pages.some((p) => p !== index && Number.isInteger(p.data.order) && p.data.order <= index.data.order)) {
    errors.push(`${where}: index.md must have the lowest order — the overview is read first`);
  }
  if (index && index.data.section !== undefined && index.data.section !== DOC_SECTIONS[0]) {
    errors.push(`${where}/index.md: the overview belongs in "${DOC_SECTIONS[0]}"`);
  }
  return { errors, warnings };
}

/**
 * The fence languages lib/highlight.ts loads, read out of its imports, with every
 * alias each grammar answers to: a `sh` or `py` fence is highlighted, not plain.
 * @param {string} root the website checkout
 * @returns {Promise<Set<string>>}
 */
export async function highlightLangs(root) {
  const names = [...fs.readFileSync(path.join(root, "lib", "highlight.ts"), "utf8").matchAll(/shiki\/langs\/([\w-]+)\.mjs/g)].map((m) => m[1]);
  const langs = new Set(["text", ...names]);
  for (const name of names) {
    const grammars = (await import(`shiki/langs/${name}.mjs`)).default;
    for (const g of grammars) {
      langs.add(g.name);
      for (const alias of g.aliases ?? []) langs.add(alias);
    }
  }
  return langs;
}
