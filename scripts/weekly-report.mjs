#!/usr/bin/env node
// Weekly numbers for hrabovskyi.online: humans vs raw (Umami), channels, pages, outbound
// clicks, events, GitHub traffic and NuGet downloads for what the site links to.
// Runs where `lab` exists (the devbox) because Umami's Postgres is only reachable through it.
// Definition and evidence: docs/explanation/human-visitor.md.
//   node scripts/weekly-report.mjs [--weeks 4] [--json] [--nuget-state FILE] [--no-github]
// Env: LAB (path to the lab binary, default `lab`), UMAMI_DB_CONTAINER (default umami-db).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "Egoushka";
const NUGET_OWNER = "red_tar";
const WEBSITE_ID = "fd5da82a-ef38-46c5-8c7e-46ad293df97f";

// Events that need a person: a theme toggle, a click out, a saved CV, a search. Scroll events
// alone do not count: a 800x600 headless viewport fires scroll-50 at 0 s on any short page.
// A "human" is a session that is not a headless fingerprint (800x600 screen, empty browser)
// and shows life: a pageview beyond the first, or any event at least 1 s after its first hit.
// bounce = unprovable but not blocked: one pageview, no event, not headless, not from the CN/SG/HK wave.
export function humanSessionsSql(days) {
  return `
ev as (
  select e.*, min(e.created_at) over (partition by e.session_id) t0
  from website_event e
  where e.website_id = '${WEBSITE_ID}' and e.created_at >= date_trunc('week', now()) - interval '${days} days'
),
first_pv as (
  select distinct on (session_id) session_id, url_path, coalesce(referrer_domain, '') ref
  from ev where event_type = 1 order by session_id, created_at
),
sess as (
  select ev.session_id, date_trunc('week', min(ev.created_at))::date wk,
    count(*) filter (where event_type = 1) pv,
    count(*) filter (where event_type = 2) events,
    count(*) filter (where event_type = 2 and ev.created_at - ev.t0 >= interval '1 second') late_events,
    se.country, (se.screen = '800x600' or coalesce(se.browser, '') = '') headless,
    case
      when f.ref = '' then 'direct'
      when f.ref ~ '(^|\\.)(google|bing|duckduckgo|yandex|baidu|ecosia|brave|search\\.yahoo)\\.' or f.ref like 'com.google.android%' then 'search'
      else f.ref
    end channel
  from ev join session se using (session_id) left join first_pv f using (session_id)
  group by ev.session_id, se.country, se.screen, se.browser, f.ref
),
h0 as (select *, (not headless and (pv >= 2 or late_events > 0)) human from sess),
h as (select *, (not human and not headless and events = 0 and country not in ('CN', 'SG', 'HK')) bounce from h0)`;
}

export function reportSql(weeks) {
  const days = (weeks - 1) * 7;
  return `with ${humanSessionsSql(days)},
pages as (
  select date_trunc('week', ev.created_at)::date wk, split_part(ev.url_path, '#', 1) url_path, count(distinct ev.session_id) n
  from ev join h using (session_id) where ev.event_type = 1 and h.human group by 1, 2
),
outb as (
  select date_trunc('week', ev.created_at)::date wk, d.string_value target, count(*) n
  from ev join h using (session_id) join event_data d on d.website_event_id = ev.event_id and d.data_key = 'url'
  where ev.event_name = 'outbound' and h.human group by 1, 2
),
evs as (
  select date_trunc('week', ev.created_at)::date wk, ev.event_name, count(*) n, count(*) filter (where h.human) human_n
  from ev join h using (session_id) where ev.event_type = 2 group by 1, 2
)
select 'sessions' sec, wk::text, '-' a, '-' b, count(*) n1, count(*) filter (where human) n2, count(*) filter (where human and country <> 'UA') n3, count(*) filter (where bounce) n4 from h group by wk
union all select 'channels', wk::text, channel, '-', count(*), count(*) filter (where human), 0, count(*) filter (where bounce) from h group by 1, 2, 3
union all select 'countries', wk::text, coalesce(nullif(country, ''), '-'), '-', count(*), count(*) filter (where human), 0, 0 from h group by 1, 2, 3
union all select 'pages', wk::text, url_path, '-', n, 0, 0, 0 from pages
union all select 'outbound', wk::text, replace(target, ' ', '_'), '-', n, 0, 0, 0 from outb
union all select 'events', wk::text, event_name, '-', n, human_n, 0, 0 from evs
order by 1, 2, 5 desc`;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} failed: ${(r.stderr || r.stdout).slice(0, 300)}`);
  return r.stdout;
}

/** lab prints a text table: header, rows separated by 2+ spaces, then "(n rows)". Cells here never contain spaces. */
export function parseLabRows(out) {
  const lines = out.split("\n").filter((l) => l.trim() && !/^\(\d+ rows?\)/.test(l.trim()));
  const head = lines[0].trim().split(/\s+/);
  return lines.slice(1).map((l) => Object.fromEntries(l.trim().split(/\s+/).map((v, i) => [head[i], v])));
}

function umami(weeks) {
  const out = run(process.env.LAB || "lab", ["sql", process.env.UMAMI_DB_CONTAINER || "umami-db", reportSql(weeks), "--db", "umami", "--max-rows", "5000"]);
  const rows = parseLabRows(out);
  const sec = (name) => rows.filter((r) => r.sec === name);
  return {
    sessions: sec("sessions").map((r) => ({ wk: r.wk, raw: +r.n1, humans: +r.n2, humans_abroad: +r.n3, bounces: +r.n4 })),
    channels: sec("channels").map((r) => ({ wk: r.wk, channel: r.a, raw: +r.n1, humans: +r.n2, bounces: +r.n4 })).sort((x, y) => y.humans - x.humans || y.raw - x.raw),
    countries: sec("countries").map((r) => ({ wk: r.wk, country: r.a, raw: +r.n1, humans: +r.n2 })).sort((x, y) => y.humans - x.humans || y.raw - x.raw),
    pages: sec("pages").map((r) => ({ wk: r.wk, url_path: r.a, n: +r.n1 })).sort((x, y) => y.n - x.n),
    outbound: sec("outbound").map((r) => ({ wk: r.wk, target: r.a, n: +r.n1 })).sort((x, y) => y.n - x.n),
    events: sec("events").map((r) => ({ wk: r.wk, event_name: r.a, n: +r.n1, human_n: +r.n2 })).sort((x, y) => y.human_n - x.human_n),
  };
}

/** GitHub repos and NuGet packages the site links to, read from its own source so the list cannot drift. */
export function linkedTargets() {
  const hits = { repos: new Set(), packages: new Set() };
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(tsx?|mdx?|mjs|json)$/.test(f.name)) {
        const s = fs.readFileSync(p, "utf8");
        for (const m of s.matchAll(new RegExp(`github\\.com/${OWNER}/([A-Za-z0-9_.-]+)`, "g"))) hits.repos.add(m[1].replace(/\.git$/, ""));
        for (const m of s.matchAll(/nuget\.org\/packages\/([A-Za-z0-9_.-]+)/g)) hits.packages.add(m[1]);
      }
    }
  };
  for (const d of ["app", "components", "content", "lib"]) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d));
  return { repos: [...hits.repos].sort(), packages: [...hits.packages].sort() };
}

const gh = (p) => JSON.parse(run("gh", ["api", p]));

function github(repos) {
  const rows = [];
  for (const repo of repos) {
    try {
      const info = gh(`repos/${OWNER}/${repo}`);
      if (info.private) continue;
      const row = { repo, stars: info.stargazers_count, views: null, uniques: null, clones: null, cloneUniques: null };
      try {
        const v = gh(`repos/${OWNER}/${repo}/traffic/views`);
        const c = gh(`repos/${OWNER}/${repo}/traffic/clones`);
        Object.assign(row, { views: v.count, uniques: v.uniques, clones: c.count, cloneUniques: c.uniques });
      } catch { /* traffic needs push access; stars still print */ }
      rows.push(row);
    } catch (e) { rows.push({ repo, error: String(e.message).slice(0, 80) }); }
  }
  return rows;
}

async function nuget(linked, stateFile) {
  const j = await (await fetch(`https://azuresearch-usnc.nuget.org/query?q=owner:${NUGET_OWNER}&take=100`)).json();
  const now = Object.fromEntries(j.data.map((d) => [d.id, d.totalDownloads]));
  let prev = {};
  if (stateFile && fs.existsSync(stateFile)) prev = JSON.parse(fs.readFileSync(stateFile, "utf8")).totals ?? {};
  if (stateFile) fs.writeFileSync(stateFile, JSON.stringify({ at: new Date().toISOString(), totals: now }, null, 1));
  return Object.entries(now)
    .map(([id, total]) => ({ id, total, delta: id in prev ? total - prev[id] : null, linked: linked.includes(id) }))
    .sort((a, b) => b.total - a.total);
}

const pad = (s, n) => String(s).padEnd(n);
function md(data, weeks) {
  const L = [];
  const wks = data.umami.sessions.map((s) => s.wk);
  L.push(`## Site report, ${wks[0]} to ${wks.at(-1)} (weeks start Monday, UTC)`, "");
  L.push("Human = not a headless fingerprint (800x600 screen or no browser) and either 2+ pageviews or an event 1 s or more after its first hit. Unproven = one pageview and nothing else, not headless, not from CN/SG/HK: probably real bounces, not counted as humans. See docs/explanation/human-visitor.md.", "");
  L.push("| Week | Raw sessions | Humans | Humans outside UA | Unproven single hits (not CN/SG/HK) |", "|---|---|---|---|---|");
  for (const s of data.umami.sessions) L.push(`| ${s.wk} | ${s.raw} | ${s.humans} | ${s.humans_abroad} | ${s.bounces} |`);
  const by = (arr, wk) => arr.filter((x) => x.wk === wk);
  for (const wk of wks.slice().reverse()) {
    L.push("", `### Week of ${wk}`);
    const ch = by(data.umami.channels, wk).filter((c) => c.humans > 0 || c.bounces > 0);
    L.push(`- Humans by channel (plus unproven single hits): ${ch.map((c) => `${c.channel} ${c.humans}${c.bounces ? ` (+${c.bounces})` : ""}`).join(", ") || "none"}`);
    L.push(`- Humans by country: ${by(data.umami.countries, wk).filter((c) => c.humans > 0).slice(0, 8).map((c) => `${c.country || "?"} ${c.humans}`).join(", ") || "none"}`);
    L.push(`- Top pages (humans): ${by(data.umami.pages, wk).slice(0, 6).map((p) => `${p.url_path} ${p.n}`).join(", ") || "none"}`);
    L.push(`- Outbound clicks (humans): ${by(data.umami.outbound, wk).map((o) => `${o.target} ${o.n}`).join(", ") || "none"}`);
    L.push(`- Events (humans/all): ${by(data.umami.events, wk).map((e) => `${e.event_name} ${e.human_n}/${e.n}`).join(", ") || "none"}`);
  }
  if (data.github) {
    L.push("", "### GitHub (last 14 days, public repos the site links to)", "", "| Repo | Stars | Views (uniques) | Clones (uniques) |", "|---|---|---|---|");
    for (const r of data.github) L.push(r.error ? `| ${r.repo} | ${r.error} | | |` : `| ${r.repo} | ${r.stars} | ${r.views ?? "n/a"} (${r.uniques ?? "n/a"}) | ${r.clones ?? "n/a"} (${r.cloneUniques ?? "n/a"}) |`);
  }
  L.push("", "### NuGet (red_tar, total downloads; change since the last run of this script)", "", "| Package | Total | Change | On site |", "|---|---|---|---|");
  for (const p of data.nuget) L.push(`| ${p.id} | ${p.total} | ${p.delta ?? "n/a"} | ${p.linked ? "yes" : ""} |`);
  return L.join("\n");
}

async function main() {
  const a = process.argv.slice(2);
  const val = (f, d) => (a.includes(f) ? a[a.indexOf(f) + 1] : d);
  const weeks = Number(val("--weeks", 4));
  const linked = linkedTargets();
  const data = {
    umami: umami(weeks),
    github: a.includes("--no-github") ? null : github(linked.repos),
    nuget: await nuget(linked.packages, val("--nuget-state", null)),
  };
  console.log(a.includes("--json") ? JSON.stringify(data, null, 1) : md(data, weeks));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main().catch((e) => { console.error(e.message); process.exit(1); });
