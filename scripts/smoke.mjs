#!/usr/bin/env node
// Browser smoke test of the built site, served the way production serves it
// (`npm run smoke`, after `npm run build` and `npm run serve:prod`).
//
// The bugs this exists for only happened in production: a search loader the real
// CSP refused, a header that wrapped after hydration, scripts React never re-ran
// after a client-side navigation. `python3 -m http.server` sends none of the
// headers that caused them, so this runs against Caddy with deploy/Caddyfile
// (BASE_URL, default http://localhost:8080). Without Docker it serves out/ itself
// with the CSP parsed from that Caddyfile — the CSP, but no redirects or 404 rules.
//
// Assertions are §11.4 of the 2026-09 audit brief with the thresholds of its §16
// (`git show 30ead5c:docs/audit-2026-09/BRIEF.md`). Every failure prints as
// `R-xx <route>: <problem>`; the measurements print as tables, the same method as the
// audit's before-and-after figures.
//
// Env: BASE_URL; SMOKE_WIDTHS (CLS widths, default "375"); STATUS_FIXTURE (default
// tests/fixtures/status.json, served as /status.json with `generated` set to now).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "out");
const CSP = fs.readFileSync(path.join(ROOT, "deploy", "Caddyfile"), "utf8").match(/Content-Security-Policy\s+"([^"]+)"/)?.[1];
const FIXTURE = JSON.parse(
  fs.readFileSync(process.env.STATUS_FIXTURE ?? path.join(ROOT, "tests", "fixtures", "status.json"), "utf8"),
);
const WIDTHS = (process.env.SMOKE_WIDTHS ?? "375").split(",").map(Number);
const HEIGHT = { 360: 800, 375: 812, 390: 844, 414: 896 }; // the phones behind each width

const POST = "/writing/silent-deploys/";
const SMOKE_SET = ["/", "/writing/", POST, "/projects/", "/projects/attest/", "/about/", "/cv/", "/404.html"];
// CLS below 0.01 on the pages people land on, below 0.1 everywhere else (BRIEF §16).
const STRICT_CLS = new Set(["/", "/writing/", POST, "/about/"]);
// Local servers have no Umami, no status cron and no Remark42; their 404s are expected.
const EXPECTED_404 = /^\/(?:s\/script\.js|status\.json|c\/.*)$/;

/**
 * First-load JS per route at the baseline (c1e2038), in gzip bytes: every
 * /_next/static script the route's HTML loads. "Grows" means by more than 1 KB,
 * which is chunk-hash and gzip noise, not a module leaking into the bundle.
 */
const JS_BUDGET = {
  "/": 152579,
  "/writing/": 152371,
  "/projects/": 152028,
  "/skills/": 177579,
  "/journey/": 179013,
  "/about/": 152072,
  "/cv/": 152305,
  "/links/": 151704,
  "/projects/attest/": 152064,
  "/projects/chronicle/": 152064,
  "/projects/synapse/": 152064,
  "/projects/baseline/": 152064,
  "/projects/oura-platform/": 152064,
  "/projects/oura-mcp-app/": 152064,
  "/projects/homelab-gitops/": 152064,
  "/projects/trader/": 152064,
  "/projects/oberih/": 152064,
  "/topics/dotnet/": 151704,
  "/topics/architecture/": 151704,
  "/topics/postgres/": 151704,
  "/topics/python/": 151704,
  "/topics/retrieval/": 151704,
  "/topics/self-hosting/": 151704,
  "/topics/infrastructure/": 151704,
  "/topics/angular/": 151704,
  "/topics/aspnet/": 151704,
  "/topics/typescript/": 151704,
  "/topics/ci-cd/": 151704,
  "/topics/debugging/": 151704,
  "/topics/docker/": 151704,
  "/topics/flutter/": 151704,
  "/topics/observability/": 151704,
  "/topics/sops/": 151704,
  "/writing/synapse/": 153435,
  "/writing/oura-platform/": 153435,
  "/writing/chronicle/": 153435,
  "/writing/attest/": 153435,
  "/writing/silent-deploys/": 153435,
  "/writing/homelab/": 153435,
};
const JS_SLACK = 1024;

const failures = [];
const fail = (req, route, problem) => {
  failures.push(`${req} ${route}: ${problem}`);
  console.log(`  FAIL ${req} ${route}: ${problem}`);
};

// ── the server ───────────────────────────────────────────────────────────────
async function answers(base) {
  try {
    return (await fetch(`${base}/`, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
}

/** out/ over HTTP with Caddy's try_files order and the Caddyfile's CSP on every response. */
function serveOut() {
  const TYPES = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
    ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".wasm": "application/wasm",
  };
  const server = http.createServer((req, res) => {
    const p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    const file = p.startsWith(OUT) && [p, path.join(p, "index.html"), `${p}.html`].find((f) => fs.statSync(f, { throwIfNoEntry: false })?.isFile());
    const type = !file ? TYPES[".html"] : path.basename(file) === "opengraph-image" ? "image/png" : TYPES[path.extname(file)];
    res.writeHead(file ? 200 : 404, { "Content-Type": type ?? "application/octet-stream", "Content-Security-Policy": CSP });
    res.end(fs.readFileSync(file || path.join(OUT, "404.html")));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

let BASE = (process.env.BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
let local;
if (!(await answers(BASE))) {
  if (process.env.BASE_URL) {
    console.error(`ERROR ${BASE} does not answer. Build, then start it with \`npm run serve:prod\`.`);
    process.exit(1);
  }
  local = await serveOut();
  console.log(`${BASE} does not answer: serving out/ directly, with the Caddyfile CSP but no Caddy routing.`);
  BASE = `http://127.0.0.1:${local.address().port}`;
}

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const ROUTES = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
console.log(`smoke: ${BASE}, ${ROUTES.length} sitemap routes`);

// ── the browser ──────────────────────────────────────────────────────────────
const browser = await chromium.launch();

/** Runs in every page before any of its scripts. */
function instrument() {
  window.__csp = [];
  document.addEventListener("securitypolicyviolation", (e) =>
    window.__csp.push(`${e.effectiveDirective} blocked ${e.blockedURI || e.sample || "?"}`),
  );
  // CLS as web-vitals defines it: the worst session window of shifts, a window
  // closing after 1 s without one or 5 s in total.
  window.__cls = { value: 0, nodes: [] };
  const name = (n) =>
    n?.nodeType === 1
      ? n.tagName.toLowerCase() + (n.id ? `#${n.id}` : "") + [...n.classList].slice(0, 2).map((c) => `.${c}`).join("")
      : "?";
  let sum = 0, first = 0, last = 0, nodes = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.hadRecentInput) continue;
      const these = (e.sources ?? []).map((s) => name(s.node));
      if (sum && e.startTime - last < 1000 && e.startTime - first < 5000) {
        sum += e.value;
        nodes.push(...these);
      } else {
        sum = e.value;
        first = e.startTime;
        nodes = these;
      }
      last = e.startTime;
      if (sum > window.__cls.value) window.__cls = { value: sum, nodes: [...new Set(nodes)].slice(0, 4) };
    }
  }).observe({ type: "layout-shift", buffered: true });
}

async function context({ width = 1440, scheme = "light", status = true, ...opts } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: HEIGHT[width] ?? 900 }, colorScheme: scheme, ...opts });
  await ctx.addInitScript(instrument);
  if (status) {
    await ctx.route("**/status.json", (r) =>
      r.fulfill({ contentType: "application/json", body: JSON.stringify({ ...FIXTURE, generated: new Date().toISOString() }) }),
    );
  }
  return ctx;
}

/** Loaded, hydrated, fonts in, status fetched, and a moment for anything that reacts to it. */
async function settle(page, ms = 800) {
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

const table = (rows) => console.log(rows.map((r) => r.map((c) => String(c).padEnd(28)).join("")).join("\n"));

// ── 1. first-load JS (budgets) ───────────────────────────────────────────────
console.log("\n1. first-load JS, gzip bytes (the route's own /_next/static scripts)");
{
  const sizes = new Map();
  const gz = async (src) => {
    if (!sizes.has(src)) {
      const body = Buffer.from(await (await fetch(`${BASE}${src}`, { headers: { "accept-encoding": "identity" } })).arrayBuffer());
      sizes.set(src, zlib.gzipSync(body).length);
    }
    return sizes.get(src);
  };
  const rows = [["route", "gzip bytes", "budget"]];
  for (const route of ROUTES) {
    const html = await (await fetch(`${BASE}${route}`)).text();
    const srcs = new Set(
      [...html.matchAll(/<script\b[^>]*>/gi)]
        .map((m) => m[0])
        .filter((t) => !/\bnomodule\b/i.test(t))
        .map((t) => t.match(/\bsrc="(\/_next\/static\/[^"]+\.js)"/)?.[1])
        .filter(Boolean),
    );
    let bytes = 0;
    for (const src of srcs) bytes += await gz(src);
    const budget = JS_BUDGET[route];
    rows.push([route, bytes, budget ?? "-"]);
    if (budget !== undefined && bytes > budget + JS_SLACK) {
      fail("R-24", route, `first-load JS is ${bytes} B gz, budget ${budget} B (baseline) + ${JS_SLACK}`);
    }
  }
  table(rows);
}

// ── 2. every route loads clean ───────────────────────────────────────────────
console.log("\n2. page errors and console errors, every sitemap route, scrolled to the end");
{
  // No status fixture here: the 404 is part of what every page must survive.
  const ctx = await context({ status: false });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.split("\n")[0]}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const from = m.location().url ? new URL(m.location().url, BASE).pathname : "";
      if (/Failed to load resource/.test(m.text()) && EXPECTED_404.test(from)) return;
      errors.push(`console: ${m.text().split("\n")[0].slice(0, 160)}${from ? ` (${from})` : ""}`);
    });
    await page.goto(`${BASE}${route}`);
    await settle(page, 200);
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += innerHeight) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await settle(page, 300);
    for (const v of await page.evaluate(() => window.__csp)) errors.push(`CSP: ${v}`);
    for (const e of [...new Set(errors)]) fail("R-26", route, e);
    await page.close();
  }
  await ctx.close();
}

// ── 3. header search under the real CSP (R-01) ───────────────────────────────
console.log("\n3. header search: Ctrl/Cmd+K, \"Attest\"");
{
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await settle(page);
  const dialog = page.locator("dialog[open]");
  await page.keyboard.press("ControlOrMeta+k");
  if (!(await dialog.waitFor({ timeout: 3000 }).then(() => true, () => false))) {
    fail("R-01", "/", "Ctrl/Cmd+K did not open the search dialog");
  } else {
    await dialog.locator("input").fill("Attest");
    const hits = dialog.locator('[role="option"]');
    const found = await hits.first().waitFor({ timeout: 10_000 }).then(() => true, () => false);
    console.log(`  hits: ${await hits.count()}`);
    if (!found) fail("R-01", "/", `no hits for "Attest"; the dialog says: ${(await dialog.innerText()).replace(/\s+/g, " ").slice(0, 160)}`);
  }
  for (const v of await page.evaluate(() => window.__csp)) fail("R-01", "/", `securitypolicyviolation: ${v}`);
  await ctx.close();
}

// ── 4. what the index ranks (R-16) ───────────────────────────────────────────
console.log("\n4. Pagefind ranking");
{
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  const ranked = await page.evaluate(async (queries) => {
    const pagefind = await import("/pagefind/pagefind.js");
    await pagefind.init();
    const out = {};
    for (const q of queries) {
      const { results } = await pagefind.search(q);
      out[q] = await Promise.all(results.map((r) => r.data().then((d) => d.url)));
    }
    return out;
  }, ["oura", "sops", "nothing"]);
  for (const [q, urls] of Object.entries(ranked)) console.log(`  "${q}": ${urls.length} results, top 3 ${urls.slice(0, 3).join(" ")}`);
  const within = (urls, n, wanted) => urls.slice(0, n).some((u) => wanted.includes(u));
  if (!within(ranked.oura, 2, ["/writing/oura-platform/", "/projects/oura-platform/"])) {
    fail("R-16", "/pagefind/", `"oura" top 2 is ${ranked.oura.slice(0, 2).join(", ")}`);
  }
  if (!within(ranked.sops, 3, ["/projects/homelab-gitops/", "/writing/homelab/"])) {
    fail("R-16", "/pagefind/", `"sops" top 3 is ${ranked.sops.slice(0, 3).join(", ")}`);
  }
  const missing = ranked.nothing.filter((u) => /404|not-found/.test(u));
  if (missing.length) fail("R-16", "/pagefind/", `"nothing" returns ${missing.join(", ")}`);
  await ctx.close();
}

// ── 5. post enhancements after a client-side navigation (R-06) ───────────────
console.log(`\n5. /writing/ → ${POST} by client-side navigation: Copy and the contents list`);
{
  const ctx = await context({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/writing/`);
  await settle(page);
  await page.evaluate(() => (window.__soft = true));
  await page.locator(`a[href="${POST}"]`).first().click();
  await page.waitForURL(`**${POST}`);
  await settle(page);
  if (!(await page.evaluate(() => window.__soft === true))) {
    fail("R-06", POST, "the click was a full page load, so this did not test a client-side navigation");
  }
  const figure = page.locator("figure.code").first();
  await figure.getByRole("button", { name: /copy/i }).click();
  const said = () => document.querySelector('figure.code [role="status"]')?.textContent.trim() ?? null;
  const copied = await page
    .waitForFunction(() => document.querySelector('figure.code [role="status"]')?.textContent.trim() === "Copied", null, { timeout: 3000 })
    .then(() => true, () => false);
  if (!copied) fail("R-06", POST, `Copy did not announce "Copied" (status: ${(await page.evaluate(said)) ?? "no role=status in the block"})`);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.6));
  await page.waitForTimeout(600);
  if ((await page.locator('.toc a[aria-current="location"]').count()) === 0) {
    fail("R-06", POST, "no contents link has aria-current after scrolling");
  }
  await ctx.close();
}

// ── 6. JavaScript off: no dead controls, Journey drawn (R-05, R-18, R-22, R-36) ─
console.log("\n6. JavaScript disabled");
{
  const ctx = await context({ javaScriptEnabled: false, status: false });
  const page = await ctx.newPage();
  const visible = async (sel) => {
    for (const el of await page.locator(sel).all()) if (await el.isVisible()) return true;
    return false;
  };
  await page.goto(`${BASE}/`);
  if (await visible(".search-trigger")) fail("R-18", "/", "the search trigger is visible with JavaScript off");
  if (await visible(".theme-toggle")) fail("R-05", "/", "the theme toggle is visible with JavaScript off");
  for (const route of ["/writing/", "/projects/"]) {
    await page.goto(`${BASE}${route}`);
    if (await visible(".filter-chip")) fail("R-36", route, "filter chips are visible with JavaScript off");
    if (await visible(".sort-btn")) fail("R-36", route, "sort buttons are visible with JavaScript off");
  }
  await page.goto(`${BASE}/journey/`);
  const bars = await page.locator(".jr-bar").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width >= 1 && r.height >= 1 && cs.visibility !== "hidden" && +cs.opacity > 0;
    }),
  );
  if (!bars.length) fail("R-22", "/journey/", "no .jr-bar elements");
  else if (bars.some((v) => !v)) fail("R-22", "/journey/", `${bars.filter((v) => !v).length} of ${bars.length} bars are invisible with JavaScript off`);
  await ctx.close();
}

// ── 7. the CV prints on one page (R-22) ──────────────────────────────────────
console.log("\n7. /cv/ as A4");
{
  const ctx = await context();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/cv/`);
  await settle(page);
  const pdf = (await page.pdf({ format: "A4", printBackground: true })).toString("latin1");
  const pages = (pdf.match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length;
  console.log(`  pages: ${pages}`);
  if (pages !== 1) fail("R-22", "/cv/", `prints to ${pages} A4 pages, expected 1`);
  await ctx.close();
}

// ── 8. layout shift on load (R-05, R-04) ─────────────────────────────────────
console.log(`\n8. CLS on load, status fixture served, at ${WIDTHS.join(", ")} px`);
{
  const rows = [["route", ...WIDTHS.map((w) => `${w}px`)]];
  for (const route of [...ROUTES, "/404.html"]) {
    const row = [route];
    for (const width of WIDTHS) {
      const ctx = await context({ width });
      const page = await ctx.newPage();
      await page.goto(`${BASE}${route}`);
      await settle(page, 1000);
      const { value, nodes } = await page.evaluate(() => window.__cls);
      row.push(value.toFixed(4));
      const limit = STRICT_CLS.has(route) ? 0.01 : 0.1;
      if (value >= limit) fail("R-05", route, `CLS ${value.toFixed(4)} at ${width} px (limit ${limit}); shifted: ${nodes.join(" ") || "?"}`);
      await ctx.close();
    }
    rows.push(row);
  }
  table(rows);
}

// ── 9. axe (R-38; code-token contrast is R-17) ───────────────────────────────
console.log("\n9. axe, wcag2a/2aa/21aa/22aa, serious and critical");
{
  const rows = [["route", "375 light", "375 dark", "1440 light", "1440 dark"]];
  for (const route of SMOKE_SET) {
    const row = [route];
    for (const width of [375, 1440]) {
      for (const scheme of ["light", "dark"]) {
        const ctx = await context({ width, scheme });
        const page = await ctx.newPage();
        await page.goto(`${BASE}${route}`);
        await settle(page);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        row.push(bad.reduce((n, v) => n + v.nodes.length, 0));
        for (const v of bad) {
          const where = v.nodes.map((n) => n.target.join(" ")).slice(0, 2).join(", ");
          const inCode = /^(color-contrast|scrollable-region-focusable)$/.test(v.id) && v.nodes.every((n) => /\bpre\b|shiki|code/.test(n.target.join(" ")));
          fail(inCode ? "R-17" : "R-38", route, `axe ${v.id} (${v.impact}) ×${v.nodes.length} at ${width} ${scheme}: ${where}`);
        }
        await ctx.close();
      }
    }
    rows.push(row);
  }
  table(rows);
}

// ── 10. measured, not asserted: home scrolled to the end ─────────────────────
console.log("\n10. home, scrolled to the end at 1440 px: bytes on the wire");
{
  const ctx = await context({ status: false });
  const page = await ctx.newPage();
  const bytes = {};
  page.on("requestfinished", async (r) => {
    const s = await r.sizes();
    const kind = r.url().includes(".txt") ? "rsc" : r.resourceType();
    bytes[kind] = (bytes[kind] ?? 0) + s.responseBodySize + s.responseHeadersSize;
  });
  await page.goto(`${BASE}/`);
  await settle(page, 200);
  for (let i = 0; i < 60 && (await page.evaluate(() => innerHeight + scrollY < document.body.scrollHeight - 2)); i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(150);
  }
  await settle(page, 1500);
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  console.log(`  total ${total} B — ${Object.entries(bytes).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  await ctx.close();
}

await browser.close();
local?.close();

console.log(failures.length ? `\n${failures.length} failure(s):\n${failures.join("\n")}` : "\nsmoke: all assertions hold.");
process.exit(failures.length ? 1 : 0);
