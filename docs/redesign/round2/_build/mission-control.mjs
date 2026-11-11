import { page, ico, fig, esc, fmtDate } from "./shared.mjs";
import { status, products, commits, posts, selfCheck, partner, figs, links, READ_AT } from "./data.mjs";

const C = "mission-control", HUE = 165;
const shell = (o) => page({ concept: C, hue: HUE, css: "mc.css", js: "mc.js", ...o });
const ph = (title, right = "", id = "") => `<div class="ph"${id ? ` id="${id}"` : ""}><h2>${title}</h2>${right}</div>`;
const prodHref = p => p.host.includes(".") && !p.host.includes(" ") ? "https://" + p.host : "shop.html#" + p.id;
const usage = p => p.usage.fig ? `<b class="num">${figs[p.usage.fig].v}</b> <span class="mut">${esc(p.usage.text.replace(figs[p.usage.fig].v, "").trim())}</span>` : `<span class="mut">${esc(p.usage.text)}</span>`;

const matrix = () => `<div class="matrix" role="img" aria-label="${status.containers} containers, ${status.unhealthy} unhealthy">${Array.from({ length: status.containers }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>`;

const prodRows = (list, full = false) => list.map(p => `
<details class="prow" data-state="${p.state}" id="${p.id}"${full && p.id === "checker" ? " open" : ""}>
<summary><span class="pn-name"><b>${esc(p.name)}</b><span class="mono mut host">${esc(p.host)}</span></span><span class="chip ${p.state}">${p.state}</span>
<span class="pu">${usage(p)}</span>${full ? `<span class="pf">${p.free.map(esc).join(", ")}</span><span class="pp">${p.paid.length ? esc(p.paid.join(", ")) + ` <span class="mut">· ${p.price}</span>` : `<span class="mut">${p.price}</span>`}</span>` : ""}<span class="tw" aria-hidden="true">${ico("plus")}</span></summary>
<div class="pbody"><p>${esc(p.long)}</p>
<dl class="fp"><div><dt>Free</dt><dd>${p.free.map(esc).join(" · ")}</dd></div><div><dt>Paid</dt><dd>${p.paid.length ? esc(p.paid.join(" · ")) + ` <span class="mut">· ${p.price}</span>` : `<span class="mut">${p.price}</span>`}</dd></div></dl>
${p.repo ? (() => { const c = commits.find(c => c.repo === p.repo); return c ? `<a class="lastc" href="${c.href}">${ico("commit")}<span class="mono">${c.sha}</span><span>${esc(c.msg)}</span><span class="mut" data-ago="${c.at}">${fmtDate(c.at)}</span></a>` : ""; })() : `<p class="mut small">No public repository yet.</p>`}
<a class="key" href="${prodHref(p)}">${p.state === "coming" ? "Where it will live" : "Open"} ${ico("out")}</a>${p.state === "coming" ? `<span class="mut small">Not deployed: the link does not answer yet.</span>` : ""}
</div></details>`).join("");

const feed = () => `<ol class="feed">${commits.map(c => `<li data-repo="${c.repo}"><a href="${c.href}"><span class="ft" data-ago="${c.at}">${fmtDate(c.at)}</span><span class="fr mono">${c.repo}</span><span class="fm">${esc(c.msg)}</span><span class="fs mono">${c.sha}</span></a></li>`).join("")}</ol>`;

const langs = () => { const top = status.languages.slice(0, 5), rest = status.languages.slice(5); const other = rest.reduce((a, l) => a + l[1], 0);
  const rows = [...top, ["Other " + rest.length, Math.round(other * 10) / 10, rest.reduce((a, l) => a + l[2], 0)]]; const max = rows[0][1];
  return `<div class="bars" role="list">${rows.map(([n, h, p]) => `<div class="bar-r" role="listitem" tabindex="0" data-tip="${n}: ${h} h, ${p}%"><span class="bl">${n}</span><span class="bt"><i style="--w:${(h / max * 100).toFixed(1)}%"></i></span><span class="bv num">${p}%</span></div>`).join("")}</div>
<details class="tbl"><summary>As a table</summary><table><thead><tr><th>Language</th><th>Hours</th><th>Share</th></tr></thead><tbody>${status.languages.map(([n, h, p]) => `<tr><td>${n}</td><td class="num">${h}</td><td class="num">${p}%</td></tr>`).join("")}</tbody></table></details>`; };

const checkRows = () => `<ul class="sc">${selfCheck.map(([n, path, code, ok, note]) => `<li class="${ok ? "ok" : "no"}"><span class="sci">${ico(ok ? "check" : "x")}</span><b>${n}</b><span class="mono mut">${path}</span><span class="mono code">${code}</span><span class="note">${note}</span></li>`).join("")}</ul>`;

const counts = products.reduce((a, p) => (a[p.state] = (a[p.state] || 0) + 1, a), {});
const home = shell({ title: "Home", active: "Home", body: `
<section class="hero wrap">
<div class="hero-l">
<p class="eyebrow"><i class="dot"></i>read from my own box, not typed</p>
<h1>I build small tools that make AI agents checkable. Here is what they are doing right now.</h1>
<p class="lede">Seven products, one live box, every number with a source. Essentials are free. Only the truly advanced parts cost money, and none has a price yet.</p>
<div class="acts"><a class="key primary" href="shop.html">See the products ${ico("arrow")}</a><a class="key" href="partner.html">Build one with me</a>
<button class="key ghost" id="srcToggle" aria-pressed="false">${ico("eye")} Show every source <kbd>S</kbd></button></div>
</div>
<div class="hero-r pn">
<div class="ph"><h2>Right now</h2><span class="mut small">UTC <span class="num" id="clock">02:20</span></span></div>
<div class="kpis">
<div class="kpi"><span>products</span>${`<a class="num" href="shop.html">7</a>`}<em>1 shipped, 2 building, 4 coming</em></div>
<div class="kpi"><span>paying users</span>${fig("paying")}<em>none takes money yet</em></div>
<div class="kpi"><span>pull requests, chargehand</span>${fig("chPrs")}<em>to v${figs.chVer.v}</em></div>
<div class="kpi"><span>Attest downloads</span>${fig("attestDl")}<em>NuGet, v${status.attest.version}</em></div>
</div></div>
</section>

<section class="grid wrap" aria-label="Dashboard">
<article class="pn box" style="--c:5">
${ph(`${ico("server")} The box`, `<button class="key icon ghost" id="refresh" aria-label="Read status.json again">${ico("refresh")}</button>`)}
<div class="boxfigs"><div>${fig("containers", "big")}<span>containers</span></div><div class="good">${fig("unhealthy", "big")}<span>unhealthy</span></div><div>${fig("uptime", "big")}<span>uptime · restarted today</span></div></div>
${matrix()}
<div class="legend"><span><i class="lg ok"></i>healthy ${status.containers - status.unhealthy}</span><span><i class="lg bad"></i>unhealthy ${status.unhealthy}</span><span class="mut">one square per container</span></div>
<pre class="raw mono"><span class="mut">// status.json, the lines this panel reads</span>
{ "generated": "${READ_AT}",
  "uptimeDays": ${status.uptimeDays},
  "containers": ${status.containers},
  "unhealthy": ${status.unhealthy} }</pre>
<p class="pfoot"><span class="mono">status.json</span><span>read <span data-ago="${READ_AT}" id="readAgo">${fmtDate(READ_AT)}</span></span></p>
</article>

<article class="pn prods" style="--c:7">
${ph(`Products <span class="mut">· 7</span>`, `<a class="key ghost" href="shop.html">Shop ${ico("arrow")}</a>`)}
<div class="plist">${prodRows(products)}</div>
<p class="pfoot"><span>${counts.rebuilding} rebuilding · ${counts.building} building · ${counts.coming} coming</span><span>free part listed before the paid part</span></p>
</article>

<article class="pn now" style="--c:5">
${ph(`${ico("commit")} Being built now`, `<div class="seg mini" role="group" aria-label="Filter by repository"><button aria-pressed="true" data-repo="all">All</button><button aria-pressed="false" data-repo="chargehand">chargehand</button><button aria-pressed="false" data-repo="other">Others</button></div>`)}
${feed()}
<p class="pfoot"><span>GitHub, public repositories</span><a href="${links.gh}">all activity ${ico("out")}</a></p>
</article>

<article class="pn self" style="--c:7">
${ph(`This site, checked the way the checker will check yours`, `<span class="chip real">recorded by hand</span>`)}
<div class="score"><b class="num">3<span class="mut">/7</span></b><p>Agent doors open on hrabovskyi.online. The site is honest about what it lacks: no llms.txt, no MCP, no WebMCP. The checker is the tool that would have told me.</p><a class="key" href="shop.html#checker">Agent-ready checker ${ico("arrow")}</a></div>
${checkRows()}
<p class="pfoot"><span>fetch + status codes, 2026-11-11 02:10 UTC</span><span>checker: ${fig("checks")} runs, not deployed</span></p>
</article>

<article class="pn code" style="--c:4">
${ph(`Coding time`, `<span class="mut small">${fig("hours")} · ${fig("editor")} in Claude</span>`)}
${langs()}
<p class="pfoot"><span><span class="mono">status.json</span> → coding</span><span>period not stated</span></p>
</article>

<article class="pn write" style="--c:4">
${ph(`Writing`, `<span class="mut small">${fig("posts")} posts · ${fig("words")} words</span>`)}
<ol class="posts">${posts.slice(0, 3).map(p => `<li><a href="${p.href}"><span class="meta mut">${fmtDate(p.date)} · ${p.read}</span><b>${esc(p.title)}</b></a></li>`).join("")}</ol>
<p class="pfoot"><a href="${links.writing}">all 12 posts ${ico("out")}</a><a href="${links.feed}">RSS</a></p>
</article>

<article class="pn part" style="--c:4">
${ph(`Open to partners`, `<span class="chip available">4 open</span>`)}
<ul class="chan">${partner.want.map(([k, d]) => `<li><b>${k}</b><span class="mut">${esc(d.split(/\. (?=[A-Z])/)[0])}.</span></li>`).join("")}</ul>
<a class="key primary" href="partner.html">How partnering works ${ico("arrow")}</a>
</article>
</section>
<div class="tip" role="tooltip" hidden></div>
` });

const shop = shell({ title: "Shop", active: "Shop", body: `
<section class="hero wrap slim">
<div class="hero-l">
<p class="eyebrow"><i class="dot"></i>products live on their own addresses, never on this site</p>
<h1>Shop</h1>
<p class="lede">Tools for running agents calmly. The essentials of each one are free. What is paid is stated before you click, and no price is set yet, so none is shown.</p>
</div>
<div class="hero-r pn">
<div class="kpis three">
<div class="kpi"><span>products</span><b class="num">7</b><em>${counts.rebuilding} rebuilding · ${counts.building} building · ${counts.coming} coming</em></div>
<div class="kpi"><span>paying users</span>${fig("paying")}<em>across all of them</em></div>
<div class="kpi"><span>prices set</span><b class="num">0</b><em>"price not set" until one is</em></div>
</div></div>
</section>
<section class="wrap">
<div class="pn board">
<div class="ph"><h2>Product board</h2><div class="seg mini" role="group" aria-label="Filter by state" id="stateFilter">
<button aria-pressed="true" data-s="all">All <span class="num">7</span></button>${["rebuilding", "building", "coming"].map(s => `<button aria-pressed="false" data-s="${s}">${s} <span class="num">${counts[s]}</span></button>`).join("")}</div></div>
<div class="thead" aria-hidden="true"><span>Product</span><span>State</span><span>Usage</span><span>Free</span><span>Paid</span><span></span></div>
<div class="plist full">${prodRows(products, true)}</div>
<p class="pfoot"><span>usage comes from each product's own counter once it exists</span><span>"coming" = not deployed</span></p>
</div>
</section>
` });

const partnerPage = shell({ title: "Partner", active: "Partner", body: `
<section class="hero wrap slim">
<div class="hero-l">
<p class="eyebrow"><i class="dot"></i>build with me, not buy from me</p>
<h1>Partner</h1>
<p class="lede">I am looking for people to build products with: co-building, integrations, distribution. Terms are one written page, agreed before anyone writes code.</p>
</div>
<div class="hero-r pn">
<div class="kpis three">
<div class="kpi"><span>open channels</span><b class="num">4</b><em>listed below</em></div>
<div class="kpi"><span>revenue shared so far</span><b class="num">0</b><em>no product has earned yet</em></div>
<div class="kpi"><span>reply from</span><b class="num">UTC+2</b><em>Kyiv, in English or Ukrainian</em></div>
</div></div>
</section>
<section class="grid wrap">
<article class="pn" style="--c:7">
${ph("Open channels", `<span class="chip available">open</span>`)}
<div class="chans">${partner.want.map(([k, d], i) => `<div class="ch"><span class="mut tnum">0${i + 1}</span><div><b>${k}</b><p class="mut">${esc(d)}</p></div><button class="key" data-kind="${k}">Ask about this</button></div>`).join("")}</div>
</article>
<article class="pn" style="--c:5">
${ph("What I bring", `<span class="mut small">each with a source</span>`)}
<ul class="bring">${partner.bring.map(([k, d, f]) => `<li>${f ? fig(f, "big") : `<span class="big num">x402</span>`}<div><b>${k}</b><p class="mut">${esc(d)}</p></div></li>`).join("")}</ul>
</article>
<article class="pn" style="--c:12">
${ph("How it works", `<span class="mut small">four steps, nothing signed before step 2</span>`)}
<ol class="steps">${partner.steps.map(([k, d], i) => `<li><span class="num">${i + 1}</span><b>${k}</b><p class="mut">${esc(d)}</p></li>`).join("")}</ol>
</article>
<article class="pn compose" style="--c:12" id="compose">
${ph(`${ico("mail")} Write to me`, `<span class="mut small">opens your mail app; nothing is sent from this page</span>`)}
<div class="cgrid">
<form class="cform" action="mailto:${links.email}" method="get" enctype="text/plain">
<label class="knob"><span>Shape</span><div class="seg" id="kind">${partner.want.map(([k], i) => `<button type="button" aria-pressed="${i === 0}" data-v="${k}">${k}</button>`).join("")}</div></label>
<label class="knob"><span>About</span><select name="about" id="about">${products.map(p => `<option>${esc(p.name)}</option>`).join("")}<option>Something else</option></select></label>
<label class="knob"><span>What you have</span><input id="have" name="have" placeholder="a team, an API, an audience…" autocomplete="off"></label>
<div class="acts"><a class="key primary" id="send" href="mailto:${links.email}">${ico("mail")} Open in mail</a><button type="button" class="key" id="copy">${ico("copy")} Copy text</button></div>
</form>
<pre class="draft mono" id="draft" aria-live="polite">To: ${links.email}
Subject: Co-build: Agent-ready checker

Hi Yehor,

I would like to co-build Agent-ready checker.
What I have: …
What I want from it: …</pre>
</div>
</article>
</section>
` });

export default { [`${C}/index.html`]: home, [`${C}/shop.html`]: shop, [`${C}/partner.html`]: partnerPage };
