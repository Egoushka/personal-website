import { figs, READ_AT, links } from "./data.mjs";
// Lucide icons (lucide.dev, ISC), 24px grid, drawn at one stroke set by --stroke.
const P = {
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  out: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  grip: '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  resize: '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  commit: '<circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  knobs: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
};
export const ico = (n, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
export const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// A figure that links to its source without JS and opens a receipt with JS.
export const fig = (id, cls = "") => `<a class="num ${cls}" data-fig="${id}" href="${figs[id].href}">${figs[id].v}</a>`;
export const fmtDate = iso => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const NOW = "2026-11-11T02:20:00Z";

export function page({ concept, title, active, hue, body, css, js, extraHead = "", dataExtra = {} }) {
  const nav = [["index.html", "Home"], ["shop.html", "Shop"], ["partner.html", "Partner"]]
    .map(([h, l]) => `<a href="${h}"${active === l ? ' aria-current="page"' : ""}>${l}</a>`).join("") +
    `<a class="ext" href="${links.writing}">Writing ${ico("out")}</a>`;
  const R2 = { figs, readAt: READ_AT, now: NOW, email: links.email, ...dataExtra };
  return `<!doctype html>
<html lang="en" data-hue-default="${hue}" style="--hue:${hue}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title} · Yehor Hrabovskyi (round 2: ${concept})</title>
<meta name="color-scheme" content="dark light">
<link rel="stylesheet" href="../shared/tokens.css"><link rel="stylesheet" href="${css}">
<script>window.R2=${JSON.stringify(R2)}</script>
<script src="../shared/ui.js"></script>
${extraHead}</head>
<body class="c-${concept}">
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="bar-in">
<a class="brand" href="index.html"><span class="mark" aria-hidden="true">YH</span><span class="who">Yehor Hrabovskyi</span></a>
<nav class="nav" aria-label="Main">${nav}</nav>
<span class="gap"></span>
<a class="pulse" href="${links.status}" data-fig="containers" title="Read from my box"><i></i><span>box ok · read <span data-ago="${READ_AT}">${fmtDate(READ_AT)}</span></span></a>
<button class="key ghost icon" data-open-knobs aria-expanded="false" aria-label="Tune this page">${ico("knobs")}</button>
</div></header>
<div class="knobs" role="dialog" aria-label="Tune this page">
<h2>Tune this page</h2>
<div class="knob"><span>Theme</span><div class="seg"><button data-knob="theme" data-v="system">System</button><button data-knob="theme" data-v="light">Light</button><button data-knob="theme" data-v="dark">Dark</button></div></div>
<div class="knob"><span>Density</span><div class="seg"><button data-knob="density" data-v="comfortable">Comfortable</button><button data-knob="density" data-v="compact">Compact</button></div></div>
<div class="knob"><span>Accent</span><div class="hues">${[[hue, "default"], ["152", "green"], ["255", "blue"], ["295", "violet"], ["60", "amber"]].filter((v, i, a) => a.findIndex(x => x[0] === v[0]) === i).map(([h, n]) => `<button data-knob="hue" data-v="${h}" style="--h:${h}" aria-label="${n} accent"></button>`).join("")}</div></div>
<div class="knob"><span>Motion</span><div class="seg"><button data-knob="motion" data-v="on">On</button><button data-knob="motion" data-v="off">Off</button></div></div>
<p class="derive">grid 4 · target 44 · stroke 1.75 · type 15<br>sizes 12 · 13 · 15 · 17 · 20 · 28 · lines on the grid<br>radius = grid × 1.5 / 2 (controls) / 2.5 / 4 / 6<br>saved on this device only</p>
</div>
<main id="main">
${body}
</main>
<footer class="foot"><div class="foot-in">
<a href="mailto:${links.email}">${links.email}</a><a href="${links.gh}">GitHub</a><a href="${links.feed}">RSS</a><a href="${links.writing}">Writing</a><span style="display:inline-flex;align-items:center">Kyiv · UTC+2</span>
<span class="stamp" style="display:inline-flex;align-items:center">Prototype · ${concept} · figures read ${READ_AT.slice(0, 16).replace("T", " ")} UTC</span>
</div></footer>
<script src="${js}"></script>
</body></html>
`;
}

// Signature: one small, true-to-shape view of what each product does. Labelled where illustrative.
export const sig = id => ({
  chargehand: `<div class="sig"><span class="sig-l">shape of a result · illustrative</span><pre class="mono">claim     handover refuses junk branches
evidence  4fafc13 feat(handover): refuse junk…
resolves  <b class="ok">ok</b> at a167640</pre></div>`,
  x402: `<div class="sig"><span class="sig-l">one paid call · illustrative</span><pre class="mono">agent → tool    <b class="warn">402</b> Payment Required
agent pays      USDC, amount set by the tool
tool succeeds   <b class="ok">200</b> settled
tool fails      <b class="ok">no charge</b></pre></div>`,
  webmcp: `<div class="sig"><span class="sig-l">planned API · not published</span><pre class="mono"><span class="mut">// a Blazor page action becomes an agent tool</span>
[WebMcpTool("find_order")]
public Order? Find(string number) =&gt; …</pre></div>`,
  touchstone: `<div class="sig"><span class="sig-l">one real difference</span><pre class="mono">SELECT 'a ' = 'a';
SQL Server   <b class="ok">true</b>   pads trailing spaces
PostgreSQL   <b class="bad">false</b>  text compares exactly</pre></div>`,
  attest: `<div class="sig"><label class="sig-l" for="nip">try it · Polish NIP, same rule as the library</label><div class="nip"><input id="nip" class="mono" data-nip value="1234563218" inputmode="numeric" maxlength="13"><output class="mono ok">valid checksum</output></div></div>`,
  oura: `<div class="sig"><span class="sig-l">8 stages</span><ol class="stages">${["ingest", "dashboards", "webhooks", "calendar + MCP", "bedroom sensors", "chest strap", "glucose", "joins"].map((s, i) => `<li class="${[0, 1, 3].includes(i) ? "done" : i === 2 ? "skipped" : ""}" title="${i + 1}. ${s}${i === 2 ? " (skipped on purpose)" : [0, 1, 3].includes(i) ? " (runs)" : " (not built)"}"><span>${i + 1}</span></li>`).join("")}</ol><span class="mut sig-n">1, 2, 4 run · 3 skipped on purpose · 5–8 not built</span></div>`,
}[id] || "");
