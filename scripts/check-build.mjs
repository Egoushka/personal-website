#!/usr/bin/env node
// Assertions over the built site in ./out (`npm run check`, after `npm run build`).
// `next build` proves every route renders; it cannot see what the pages say, what
// the chunks carry or what the feeds link to, which is where the bugs this guards
// against lived. No dependencies: regexes over files that one build wrote.
//
// Every failure prints as `R-xx <path>: <problem>`, named after the requirement in
// docs/audit-2026-09/BRIEF.md that it protects.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "out");
const PRODUCTION_URL = "https://hrabovskyi.online";
// Read the way lib/site.ts reads it, so a prelive build is checked against its own origin.
const ORIGIN = process.env.SITE_URL ?? PRODUCTION_URL;

const failures = [];
const fail = (req, file, problem) =>
  failures.push(`${req} ${path.relative(ROOT, file) || file}: ${problem}`);

if (!fs.existsSync(path.join(OUT, "index.html"))) {
  console.error("ERROR out/index.html is missing — run `npm run build` first.");
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const read = (f) => fs.readFileSync(f, "utf8");
const at = (...p) => path.join(OUT, ...p);

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === "#"
      ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1))
      : (ENTITIES[e.toLowerCase()] ?? m),
  );

/** Attributes of one tag, values entity-decoded. */
const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)(?:\s*=\s*"([^"]*)")?/g)].slice(1).map((m) => [m[1].toLowerCase(), decode(m[2] ?? "")]),
  );

const meta = (html, key) =>
  [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((m) => attrs(m[0]))
    .find((a) => a.name === key || a.property === key)?.content;

/**
 * React serialises `{n} days ago` as `4<!-- --> <!-- -->days<!-- --> ago`, so a text
 * assertion over raw HTML misses most of what it is looking for. Strip them first.
 */
const text = (html) => html.replace(/<!-- -->/g, "");

/** out/writing/foo/index.html → /writing/foo/ ; out/404.html → /404.html */
const urlPath = (file) => {
  const rel = path.relative(OUT, file).split(path.sep).join("/");
  return rel === "index.html" ? "/" : rel.endsWith("/index.html") ? `/${rel.slice(0, -10)}` : `/${rel}`;
};

const files = walk(OUT);
const pages = files
  .filter((f) => f.endsWith(".html"))
  .map((file) => {
    const html = read(file);
    const robots = meta(html, "robots") ?? "";
    return { file, html, url: urlPath(file), indexable: !/noindex/i.test(robots) };
  });

// ── Page structure (R-07) and metadata (R-11) ────────────────────────────────
for (const { file, html, url, indexable } of pages) {
  const mains = html.match(/<main\b[^>]*>/gi) ?? [];
  if (mains.length !== 1 || attrs(mains[0]).id !== "main") {
    fail("R-07", file, `expected exactly one <main id="main">, found ${mains.length ? mains.join(" ") : "none"}`);
  }
  const h1s = (html.match(/<h1\b/gi) ?? []).length;
  if (h1s !== 1) fail("R-07", file, `expected exactly one <h1>, found ${h1s}`);

  const start = html.search(/<main\b/i);
  const inside = start < 0 ? "" : html.slice(start, html.indexOf("</main>", start));
  if (/<header\b[^>]*class="[^"]*\bsite-header\b/i.test(inside)) {
    fail("R-07", file, "the site header is inside <main>");
  }
  if (/<footer\b/i.test(inside)) fail("R-07", file, "a <footer> is inside <main>");

  const titles = (html.slice(0, html.indexOf("</head>")).match(/<title\b/gi) ?? []).length;
  if (titles !== 1) fail("R-38", file, `expected exactly one <title> in <head>, found ${titles}`);

  if (!indexable) continue;
  const self = `${ORIGIN}${url}`;
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => attrs(m[0]))
    .find((a) => a.rel === "canonical")?.href;
  if (canonical !== self) fail("R-11", file, `canonical is ${canonical ?? "missing"}, expected ${self}`);
  if (!meta(html, "og:image")) fail("R-11", file, "no og:image");
  if (!meta(html, "twitter:image")) fail("R-11", file, "no twitter:image");
}

// 404 variants: their own title, not the site default (R-38).
for (const rel of ["404.html", "404/index.html", "_not-found/index.html"]) {
  const page = pages.find((p) => p.file === at(rel));
  const title = page && decode(page.html.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
  if (page && !/not found/i.test(title)) fail("R-38", page.file, `title is "${title}", expected the not-found title`);
}

// ── Sitemap = the set of indexable pages (R-39) ──────────────────────────────
const sitemapFile = at("sitemap.xml");
if (!fs.existsSync(sitemapFile)) {
  fail("R-39", sitemapFile, "missing");
} else {
  const listed = new Set();
  for (const [, loc] of read(sitemapFile).matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = decode(loc).trim();
    if (!url.startsWith(`${ORIGIN}/`)) fail("R-39", sitemapFile, `${url} is not on ${ORIGIN}`);
    else listed.add(url.slice(ORIGIN.length));
  }
  const indexable = new Set(pages.filter((p) => p.indexable && p.file.endsWith("index.html")).map((p) => p.url));
  for (const url of listed) {
    if (!indexable.has(url)) fail("R-39", sitemapFile, `lists ${url}, which is not an indexable page in out/`);
  }
  for (const url of indexable) {
    if (!listed.has(url)) fail("R-39", sitemapFile, `omits ${url}, which is an indexable page`);
  }
}

// ── Feeds: parse, absolute item links, absolute links inside bodies (R-40) ───
const ABSOLUTE = /^https?:\/\//;
// A root-relative href/src inside a feed body: raw, CDATA-wrapped or entity-escaped.
const RELATIVE_IN_BODY = /\b(?:href|src)\s*=\s*(?:"|'|&quot;|&#34;|&#x22;)\/(?!\/)/i;

const feedJson = at("feed.json");
if (!fs.existsSync(feedJson)) fail("R-40", feedJson, "missing");
else {
  try {
    const feed = JSON.parse(read(feedJson));
    if (!Array.isArray(feed.items) || feed.items.length === 0) fail("R-40", feedJson, "no items");
    for (const item of feed.items ?? []) {
      if (!ABSOLUTE.test(item.url ?? "")) fail("R-40", feedJson, `item link "${item.url}" is not absolute`);
      if (RELATIVE_IN_BODY.test(item.content_html ?? "")) {
        fail("R-40", feedJson, `item ${item.url} has a root-relative link in its body`);
      }
    }
  } catch (e) {
    fail("R-40", feedJson, `does not parse: ${e.message}`);
  }
}

for (const [name, itemTag, linkRe] of [
  ["feed.xml", "item", /<link>([^<]*)<\/link>/g],
  ["atom.xml", "entry", /<link\b[^>]*\bhref="([^"]*)"/g],
]) {
  const file = at(name);
  if (!fs.existsSync(file)) {
    fail("R-40", file, "missing");
    continue;
  }
  const items = [...read(file).matchAll(new RegExp(`<${itemTag}>([\\s\\S]*?)</${itemTag}>`, "g"))];
  if (items.length === 0) fail("R-40", file, `no <${itemTag}> elements`);
  for (const [, body] of items) {
    const links = [...body.matchAll(linkRe)].map((m) => decode(m[1]).trim());
    if (links.length === 0) fail("R-40", file, `an <${itemTag}> has no link`);
    for (const link of links) {
      if (!ABSOLUTE.test(link)) fail("R-40", file, `item link "${link}" is not absolute`);
    }
    if (RELATIVE_IN_BODY.test(body)) fail("R-40", file, `item ${links[0]} has a root-relative link in its body`);
  }
}

// ── What the client chunks carry (R-01, R-24) ────────────────────────────────
/**
 * Needles for "this module reached the browser": the longest run of plain ASCII in
 * each long string literal of lib/site.ts and in each icon path of lib/icons.ts. A
 * minifier re-quotes strings and may escape non-ASCII, but leaves such a run as is.
 */
function needles(source, min) {
  return [...source.matchAll(/"((?:[^"\\\n]|\\.){40,})"/g)]
    .map((m) => m[1].split(/[^\x20-\x7e]|["'`\\<>&]/).sort((a, b) => b.length - a.length)[0])
    .filter((s) => s.length >= min);
}
const siteTs = read(path.join(ROOT, "lib", "site.ts"));
const leaks = [
  ...needles(siteTs, 32).map((s) => ["lib/site.ts", s]),
  ...needles(read(path.join(ROOT, "lib", "icons.ts")), 32).map((s) => ["lib/icons.ts", s.slice(0, 48)]),
];

const chunks = files.filter((f) => f.endsWith(".js") && f.startsWith(at("_next", "static")));
for (const chunk of chunks) {
  const js = read(chunk);
  if (/Function\(\s*["'`]return import/.test(js)) {
    fail("R-01", chunk, "contains Function('return import — the eval loader the CSP blocks");
  }
  const found = leaks.filter(([, s]) => js.includes(s));
  for (const from of new Set(found.map(([f]) => f))) {
    const mine = found.filter(([f]) => f === from);
    fail("R-24", chunk, `carries ${mine.length} string(s) from ${from}, e.g. "${mine[0][1].slice(0, 40)}"`);
  }
}

// /projects/ hands its client filter only what it renders (B7), so no project's
// full description travels in that page's payload.
{
  const block = siteTs.slice(siteTs.indexOf("export const projects"), siteTs.indexOf("export type Skill"));
  const descriptions = [...block.matchAll(/\bdescription:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].slice(0, 40));
  const file = at("projects", "index.html");
  const html = fs.existsSync(file) ? read(file) : "";
  const shipped = descriptions.filter((d) => html.includes(d));
  if (shipped.length) fail("B7", file, `carries ${shipped.length} project description(s), e.g. "${shipped[0]}"`);
}

// ── Text in the HTML (R-03, R-04, R-17) ──────────────────────────────────────
const RELATIVE_AGE = /\bdays? ago\b|\blatest (?:today|yesterday)\b/i;
for (const { file, html } of pages) {
  const age = text(html).match(RELATIVE_AGE);
  if (age) fail("R-03", file, `prints a build-time relative age ("${age[0]}")`);
  const leaked = (html.match(/node="\[object Object\]"/g) ?? []).length;
  if (leaked) fail("R-17", file, `node="[object Object]" on ${leaked} element(s)`);
}

if (/not reporting/i.test(text(read(at("index.html"))))) {
  fail("R-04", at("index.html"), 'the static HTML says the box is "not reporting"');
}

// ── Removed routes (R-02, R-08, R-19, R-20) ──────────────────────────────────
for (const [req, dir] of [["R-02", "admin"], ["R-08", "links"], ["R-19", "search"], ["R-20", "lab"]]) {
  if (fs.existsSync(at(dir))) fail(req, at(dir), "still built");
}

// ── robots.txt (R-15) ────────────────────────────────────────────────────────
if (ORIGIN === PRODUCTION_URL) {
  const robots = at("robots.txt");
  if (!fs.existsSync(robots)) fail("R-15", robots, "missing");
  else if (/^\s*Disallow:\s*\/\s*$/im.test(read(robots))) fail("R-15", robots, "production build disallows everything");
}

// ── Posts and projects (R-08, R-09, R-17, R-27) ──────────────────────────────
const email = siteTs.match(/\bemail:\s*"([^"]+)"/)?.[1];
const detail = pages.filter((p) => /^\/(?:writing|projects)\/[^/]+\/$/.test(p.url));
for (const { file, html } of detail) {
  const mailto = [...html.matchAll(/<a\b[^>]*href="mailto:([^"?]*)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].some(
    ([, to, inner]) => decode(to) === email && decode(inner.replace(/<[^>]+>/g, "")).includes(email),
  );
  if (!mailto) fail("R-08", file, `no byline with ${email} as the visible text of a mailto: link`);
}

for (const { file, html, url } of pages.filter((p) => /^\/writing\/[^/]+\/$/.test(p.url))) {
  for (const pre of html.match(/<pre\b[^>]*>/gi) ?? []) {
    if (attrs(pre).tabindex !== "0") fail("R-17", file, `a <pre> is not keyboard-scrollable (no tabindex="0")`);
  }
  const ids = new Set([...html.matchAll(/\bid="([^"]*)"/g)].map((m) => decode(m[1])));
  const toc = html.match(/<ol\b[^>]*class="[^"]*\btoc\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/i)?.[1] ?? "";
  for (const [, href] of toc.matchAll(/href="#([^"]*)"/g)) {
    let id = decode(href);
    try {
      id = decodeURIComponent(id);
    } catch {}
    if (!ids.has(id)) fail("R-27", file, `contents link #${id} has no matching id on ${url}`);
  }
}

// Every project with a write-up links to it, and the post links back.
{
  const pairs = [...siteTs.matchAll(/\bwriteup:\s*"([^"]+)"/g)].map((m) => [
    [...siteTs.slice(0, m.index).matchAll(/\bslug:\s*"([^"]+)"/g)].pop()?.[1],
    m[1],
  ]);
  if (pairs.length === 0) fail("R-09", path.join(ROOT, "lib", "site.ts"), "no project declares a writeup");
  for (const [project, post] of pairs) {
    const projectPage = at("projects", project, "index.html");
    const postPage = at("writing", post, "index.html");
    if (!fs.existsSync(projectPage) || !read(projectPage).includes(`href="/writing/${post}/"`)) {
      fail("R-09", projectPage, `does not link its write-up /writing/${post}/`);
    }
    if (!fs.existsSync(postPage) || !read(postPage).includes(`href="/projects/${project}/"`)) {
      fail("R-09", postPage, `does not link its project /projects/${project}/`);
    }
  }
}

// ── Structured data (R-39) ───────────────────────────────────────────────────
for (const { file, html } of pages) {
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    if (json.includes("<")) fail("R-39", file, "a JSON-LD block contains a raw <");
    try {
      JSON.parse(json);
    } catch (e) {
      fail("R-39", file, `a JSON-LD block does not parse: ${e.message}`);
    }
  }
}

for (const f of failures) console.log(f);
const byReq = failures.reduce((acc, f) => ((acc[f.split(" ")[0]] = (acc[f.split(" ")[0]] ?? 0) + 1), acc), {});
console.log(
  failures.length
    ? `\n${failures.length} failure(s) over ${pages.length} pages and ${chunks.length} scripts: ${Object.entries(byReq)
        .map(([r, n]) => `${r} ×${n}`)
        .join(", ")}`
    : `check-build: ${pages.length} pages and ${chunks.length} scripts, all assertions hold.`,
);
process.exit(failures.length ? 1 : 0);
