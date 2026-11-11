import { page, ico, fig, esc, fmtDate } from "./shared.mjs";
import { status, products, commits, posts, selfCheck, partner, figs, links, READ_AT } from "./data.mjs";

const C = "product-studio", HUE = 235;
const shell = (o) => page({ concept: C, hue: HUE, css: "studio.css", js: "studio.js", dataExtra: { selfCheck }, extraHead: `<script src="../shared/checker.js" defer></script>`, ...o });
const P = Object.fromEntries(products.map(p => [p.id, p]));
const chip = p => `<span class="chip ${p.state}">${p.state}</span>`;
const lbl = (t, kind = "sim") => `<span class="chip ${kind}">${t}</span>`;

const resultRows = rows => rows.map(([n, path, code, ok, note]) => `<li class="${ok ? "ok" : "no"}"><span class="ri">${ico(ok ? "check" : "x")}</span><span class="rn">${n}</span><span class="rp mono">${path}</span><span class="rc mono">${code}</span><span class="rt">${note}</span></li>`).join("");

// The checker console. Pre-rendered with the real recorded result so it reads complete without JS.
const consoleBlock = () => `
<div class="console" id="checker">
<div class="ctabs" role="tablist" aria-label="Ways to run the checker">
<button role="tab" aria-selected="true" aria-controls="t-web" id="tb-web">Web</button><button role="tab" aria-selected="false" aria-controls="t-ci" id="tb-ci" tabindex="-1">GitHub Action</button><button role="tab" aria-selected="false" aria-controls="t-api" id="tb-api" tabindex="-1">API · pay per call</button>
<span class="cstate">${chip(P.checker)}<span class="mono mut small">check.hrabovskyi.online</span></span>
</div>
<div class="cpanel" role="tabpanel" id="t-web" aria-labelledby="tb-web">
<form class="cform" action="https://check.hrabovskyi.online/" method="get">
<label class="sr" for="url">Address to check</label>
<span class="cin">${ico("search")}<input id="url" name="url" value="hrabovskyi.online" autocomplete="off" spellcheck="false" inputmode="url"></span>
<button class="key primary" type="submit">Check ${ico("arrow")}</button>
</form>
<div class="presets"><span class="mut small">Try</span><button class="key ghost" data-url="hrabovskyi.online">hrabovskyi.online <span class="mut">recorded</span></button><button class="key ghost" data-url="example.com">example.com</button><button class="key ghost" data-url="github.com">github.com</button></div>
<div class="result" aria-live="polite">
<div class="rhead"><div class="score"><b class="num" id="score">3</b><span class="mut">/7 agent doors open</span></div><span id="rhost" class="mono">hrabovskyi.online</span><span id="rkind">${lbl("recorded by hand, 2026-11-11", "real")}</span></div>
<div class="meter" aria-hidden="true">${selfCheck.map(r => `<i class="${r[3] ? "ok" : "no"}"></i>`).join("")}</div>
<ol class="rows">${resultRows(selfCheck)}</ol>
<p class="rnote mut small" id="rnote">This is my own site, checked by hand with the same requests the checker will make. It fails 4 of 7; the checker exists so the next site does not have to find out this way.</p>
</div></div>
<div class="cpanel" role="tabpanel" id="t-ci" aria-labelledby="tb-ci" hidden>
<div class="code"><div class="code-h"><span class="mono small">.github/workflows/agent-ready.yml</span>${lbl("planned", "sim")}<button class="key ghost copy" data-copy="ci">${ico("copy")} Copy</button></div>
<pre class="mono" id="ci"><span class="k">name</span>: agent-ready
<span class="k">on</span>: [deployment_status]
<span class="k">jobs</span>:
  <span class="k">check</span>:
    <span class="k">runs-on</span>: ubuntu-latest
    <span class="k">steps</span>:
      - <span class="k">uses</span>: egoushka/agent-ready-action@v1   <span class="c"># free, no key</span>
        <span class="k">with</span>:
          <span class="k">url</span>: \${{ github.event.deployment_status.environment_url }}
          <span class="k">fail-on</span>: llms-txt, mcp-discovery</pre></div>
<p class="mut small">Runs after every deploy and fails the job when a door you care about closes. Free. The action name is a plan, not a published package.</p>
</div>
<div class="cpanel" role="tabpanel" id="t-api" aria-labelledby="tb-api" hidden>
<div class="code"><div class="code-h"><span class="mono small">an agent calling the API</span>${lbl("planned", "sim")}<button class="key ghost copy" data-copy="api">${ico("copy")} Copy</button></div>
<pre class="mono" id="api"><span class="c">$ curl -i https://check.hrabovskyi.online/api/check?url=example.com</span>
HTTP/1.1 <span class="w">402 Payment Required</span>
<span class="k">X-PAYMENT-REQUIRED</span>: { "scheme": "exact", "asset": "USDC", "amount": <span class="c">"price not set"</span> }

<span class="c">$ curl -i -H "X-PAYMENT: &lt;signed payload&gt;" https://check.hrabovskyi.online/api/check?url=example.com</span>
HTTP/1.1 <span class="g">200 OK</span>
{ "url": "example.com", "open": 2, "of": 7, "checks": [ … ] }</pre></div>
<p class="mut small">For agents and pipelines that check many sites. Paid per call over x402, charged only when the check succeeds. The web check and the action stay free.</p>
</div>
</div>`;

// Product cards with a working demo each.
const demo = {
  chargehand: `<div class="demo ch-demo" data-demo="chargehand">
<div class="demo-h"><span class="mono small">result.json · 3 claims</span>${lbl("illustrative")}<button class="key ghost run">${ico("play")} Verify</button></div>
<ol class="claims">
<li data-ok="1"><span class="cs"></span><span>Handover refuses junk branches</span><span class="mono mut">4fafc13</span></li>
<li data-ok="1"><span class="cs"></span><span>Sessions are preflighted against an allowlist</span><span class="mono mut">036b34f</span></li>
<li data-ok="0"><span class="cs"></span><span>Retries are capped at three</span><span class="mono mut">no file</span></li>
</ol>
<p class="small mut ch-out">Every citation is resolved at commit <span class="mono">a167640</span> before you see it. A claim whose evidence does not resolve moves to open questions.</p></div>`,
  x402: `<div class="demo x-demo" data-demo="x402">
<div class="demo-h"><span class="mono small">one tool call</span>${lbl("simulation")}<label class="fail"><input type="checkbox" id="xfail"> tool fails</label><button class="key ghost run">${ico("play")} Call</button></div>
<ol class="flow"><li><span class="mono">agent → tool</span><b class="mono">call</b></li><li><span class="mono">tool → agent</span><b class="mono w">402</b></li><li><span class="mono">agent → tool</span><b class="mono">pays</b></li><li><span class="mono">tool → agent</span><b class="mono g" id="xres">200 · settled</b></li></ol></div>`,
  touchstone: `<div class="demo t-demo" data-demo="touchstone">
<div class="demo-h"><div class="seg mini" role="group" aria-label="Example query"><button aria-pressed="true" data-q="0">spaces</button><button aria-pressed="false" data-q="1">case</button><button aria-pressed="false" data-q="2">NULL order</button></div>${lbl("real behaviour", "real")}</div>
<pre class="mono tq">SELECT CASE WHEN 'a ' = 'a' THEN 1 ELSE 0 END;</pre>
<div class="tgrid"><div><span class="mono small mut">SQL Server</span><b class="mono g" id="tss">1</b><span class="small mut" id="tssn">pads trailing spaces before comparing</span></div><div><span class="mono small mut">PostgreSQL</span><b class="mono r" id="tpg">0</b><span class="small mut" id="tpgn">text compares exactly</span></div></div></div>`,
  attest: `<div class="demo" data-demo="attest"><div class="demo-h"><label class="mono small" for="nip">Polish NIP · type one</label>${lbl("runs here, same rule", "real")}</div>
<div class="nip big"><input id="nip" class="mono" data-nip value="1234563218" inputmode="numeric" maxlength="13"><output class="mono ok">valid checksum</output></div>
<p class="small mut">Weights 6 5 7 2 3 4 5 6 7, sum mod 11 against the last digit. Attest has one of these, with tests, for each of 87 countries.</p></div>`,
  webmcp: `<div class="demo w-demo" data-demo="webmcp"><div class="demo-h"><div class="seg mini" role="group" aria-label="View"><button aria-pressed="true" data-v="cs">You write</button><button aria-pressed="false" data-v="json">The agent sees</button></div>${lbl("planned API")}</div>
<pre class="mono wv" data-v="cs" tabindex="0"><span class="c">// Pages/Orders.razor.cs</span>
[<span class="k">WebMcpTool</span>("find_order", Description = "Find an order by number")]
<span class="k">public</span> Order? Find(<span class="k">string</span> number) =&gt; _orders.Find(number);</pre>
<pre class="mono wv" data-v="json" tabindex="0" hidden>{ "name": "find_order",
  "description": "Find an order by number",
  "inputSchema": { "type": "object",
    "properties": { "number": { "type": "string" } },
    "required": ["number"] } }</pre></div>`,
  oura: `<div class="demo" data-demo="oura"><div class="demo-h"><span class="mono small">8 stages, as built</span>${lbl("from the README", "real")}</div>
<ol class="stages">${["ingest", "dashboards", "webhooks", "calendar + MCP", "room sensors", "chest strap", "glucose", "joins"].map((s, i) => `<li class="${[0, 1, 3].includes(i) ? "done" : i === 2 ? "skipped" : ""}" title="${s}"><span>${i + 1}</span></li>`).join("")}</ol>
<p class="small mut">1, 2 and 4 run on my box: ingestion, three Grafana dashboards the Oura app cannot draw, calendar import and an MCP server. 3 is skipped on purpose. 5 to 8 need hardware I do not have yet.</p></div>`,
};

const card = (p, cls = "") => `<article class="card ${cls}" id="${p.id}">
<div class="card-h"><div><h3>${esc(p.name)}</h3><span class="mono mut small">${esc(p.host)}</span></div>${chip(p)}</div>
<p class="card-l">${esc(p.line)}</p>
${demo[p.id]}
<div class="card-f"><span><b>Free</b> ${p.free.map(esc).join(" · ")}</span><span><b>Paid</b> ${p.paid.length ? esc(p.paid.join(" · ")) + ` <span class="mut">(${p.price})</span>` : `<span class="mut">${p.price}</span>`}</span><span class="use">${p.usage.fig ? fig(p.usage.fig) + " " + esc(p.usage.text.replace(figs[p.usage.fig].v, "").trim()) : esc(p.usage.text)}</span></div>
</article>`;

const proof = `<section class="proof wrap" aria-labelledby="proof-h">
<div class="sec-h"><h2 id="proof-h">Numbers, each with its source</h2><p class="mut">Click any of them to see where it is read and how it is counted.</p></div>
<div class="pgrid">
<div>${fig("containers")}<span>containers on my box, ${fig("unhealthy")} unhealthy</span></div>
<div>${fig("chPrs")}<span>pull requests into chargehand, now v${figs.chVer.v}</span></div>
<div>${fig("attestDl")}<span>Attest downloads on NuGet</span></div>
<div>${fig("paying")}<span>paying users, across everything</span></div>
</div>
<div class="latest"><span class="mono small mut">Latest commit</span><a href="${commits[0].href}"><span class="mono">${commits[0].sha}</span> ${esc(commits[0].msg)} <span class="mut" data-ago="${commits[0].at}">${fmtDate(commits[0].at)}</span></a></div>
</section>`;

const home = shell({ title: "Home", active: "Home", body: `
<section class="hero wrap">
<p class="eyebrow"><span class="chip coming">coming</span><span>Agent-ready checker · the first of seven tools</span></p>
<h1>Is your site ready for AI agents? <span class="dim">Type its address.</span></h1>
<p class="lede">A free check for WebMCP, MCP, x402 and llms.txt, in the browser or on every deploy. I build small tools like this for people who run agents. Essentials free; only the truly advanced parts paid.</p>
${consoleBlock()}
</section>

<section class="wrap tools" aria-labelledby="tools-h">
<div class="sec-h"><h2 id="tools-h">Six more, each one you can try right here</h2><p class="mut">Every demo below says whether it is real behaviour or an illustration. None of these is hosted on this site; each will live at its own address.</p></div>
<div class="bento">
${card(P.chargehand, "w4")}${card(P.attest, "w2")}
${card(P.x402, "w3")}${card(P.touchstone, "w3")}
${card(P.webmcp, "w3")}${card(P.oura, "w3")}
</div>
</section>
${proof}
<section class="wrap band">
<div><h2>Build the next one with me.</h2><p class="mut">Co-build, integrate, distribute. One written page of terms before code.</p></div>
<div class="acts"><a class="key primary" href="partner.html">How partnering works ${ico("arrow")}</a><a class="key" href="${links.writing}">Read the writing ${ico("out")}</a></div>
</section>
` });

const order = ["checker", "chargehand", "x402", "webmcp", "touchstone", "attest", "oura"];
const shop = shell({ title: "Shop", active: "Shop", body: `
<section class="hero wrap slim">
<p class="eyebrow"><span>Shop</span></p>
<h1>Seven tools. <span class="dim">The essentials of each are free.</span></h1>
<p class="lede">What is paid is named before you click, and no price is set yet, so none is shown. Nothing is sold on this site: each tool lives at its own address.</p>
</section>
<div class="wrap shopw">
<nav class="toc" aria-label="Products"><ol>${order.map(id => `<li><a href="#s-${id}"><span>${esc(P[id].name)}</span><span class="chip ${P[id].state}">${P[id].state}</span></a></li>`).join("")}</ol>
<p class="small mut">Paying users so far: ${fig("paying")}</p></nav>
<div class="sections">
${order.map((id, i) => { const p = P[id]; return `<section class="prod" id="s-${id}" aria-labelledby="h-${id}">
<div class="prod-t"><span class="mono mut small">0${i + 1} / 07</span>${chip(p)}</div>
<h2 id="h-${id}">${esc(p.name)}</h2>
<p class="prod-l">${esc(p.line)}</p>
<p class="mut">${esc(p.long)}</p>
${id === "checker" ? `<div class="mini-console">${consoleBlock().replace('id="checker"', 'id="checker-shop"')}</div>` : demo[id]}
<div class="plans"><div class="plan"><span class="mono small">Free</span><ul>${p.free.map(f => `<li>${ico("check")}${esc(f)}</li>`).join("")}</ul><b class="price">free</b></div>
<div class="plan adv"><span class="mono small">Advanced</span><ul>${p.paid.length ? p.paid.map(f => `<li>${ico("plus")}${esc(f)}</li>`).join("") : `<li class="mut">Nothing paid planned.</li>`}</ul><b class="price ${p.paid.length ? "unset" : ""}">${p.paid.length ? "price not set" : "—"}</b></div>
<div class="plan use"><span class="mono small">Usage, counted</span><p>${p.usage.fig ? fig(p.usage.fig) + " " + esc(p.usage.text.replace(figs[p.usage.fig].v, "").trim()) : esc(p.usage.text)}</p><a class="key ghost" href="${p.host.includes(" ") ? "#" : "https://" + p.host}">${esc(p.host)} ${ico("out")}</a></div></div>
</section>`; }).join("")}
</div></div>
` }).replaceAll('id="url"', 'id="url"').replace(/(<div class="mini-console">[\s\S]*?)id="url"/, '$1id="url2"').replace(/(<div class="mini-console">[\s\S]*?)for="url"/, '$1for="url2"');

const partnerPage = shell({ title: "Partner", active: "Partner", body: `
<section class="hero wrap slim">
<p class="eyebrow"><span>Partner</span></p>
<h1>Build the next tool with me. <span class="dim">Terms on one page, before code.</span></h1>
<p class="lede">I am looking for people to build products with, not clients to sell to. No product has earned a cent yet, so no split is listed here; it is agreed per product.</p>
</section>
<section class="wrap shapes" aria-label="Ways to partner">
${partner.want.map(([k, d], i) => `<button class="shape" aria-pressed="${i === 0}" data-k="${k}"><span class="mono mut small">0${i + 1}</span><b>${k}</b><span class="mut">${esc(d)}</span></button>`).join("")}
</section>
<section class="wrap termsw">
<div class="terms" aria-live="polite">
<div class="terms-h"><span class="mono small">one-page terms · draft</span>${lbl("filled from your choices", "real")}</div>
<h2 id="tTitle">Co-build: Agent-ready checker</h2>
<dl>
<dt>What</dt><dd id="tWhat">Agent-ready checker, together, in a shared repository.</dd>
<dt>Who builds what</dt><dd id="tWho">I build the .NET and agent side. You bring what you named below.</dd>
<dt>Costs</dt><dd>Each side carries its own time. Shared costs are listed by name before they are spent.</dd>
<dt>Split</dt><dd>Agreed in writing for this product before code. Nothing earned so far: 0 to split.</dd>
<dt>Ends</dt><dd>Either side can end it with notice; what was built stays usable by both as agreed.</dd>
</dl>
<div class="tctl"><label class="sr" for="tProd">Product</label><select id="tProd">${products.map(p => `<option>${esc(p.name)}</option>`).join("")}<option>Something new</option></select>
<label class="sr" for="tHave">What you bring</label><input id="tHave" placeholder="What you bring: a team, an API, an audience…"></div>
<div class="acts"><a class="key primary" id="tSend" href="mailto:${links.email}">${ico("mail")} Send this page to me</a><span class="mut small">Opens your mail app. Nothing is sent from here.</span></div>
</div>
<aside class="bringw"><h2>What I bring</h2><ul class="bring">${partner.bring.map(([k, d, f]) => `<li>${f ? fig(f) : `<span class="num">x402</span>`}<div><b>${k}</b><p class="mut small">${esc(d)}</p></div></li>`).join("")}</ul>
<h2>How it goes</h2><ol class="steps">${partner.steps.map(([k, d], i) => `<li><span class="num">${i + 1}</span><div><b>${k}</b><p class="mut small">${esc(d)}</p></div></li>`).join("")}</ol></aside>
</section>
` });

export default { [`${C}/index.html`]: home, [`${C}/shop.html`]: shop, [`${C}/partner.html`]: partnerPage };
