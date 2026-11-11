import { page, ico, fig, esc, fmtDate, sig } from "./shared.mjs";
import { status, products, commits, posts, selfCheck, partner, figs, links, READ_AT } from "./data.mjs";

const C = "blocks", HUE = 290;
const shell = (o) => page({ concept: C, hue: HUE, css: "blocks.css", js: "blocks.js", dataExtra: { selfCheck }, extraHead: `<script src="../shared/checker.js" defer></script>`, ...o });

// A block: id, default width (of 12 columns) and height (in 76px rows), a label and its content.
const blk = (id, w, h, label, body, cls = "", name = label) => `<section class="blk ${cls}" data-id="${id}" data-w="${w}" data-h="${h}" style="--w:${w};--h:${h}" aria-label="${esc(name)}">
<header class="bh"><button class="grip" aria-label="Move ${esc(name)}" tabindex="-1">${ico("grip")}</button><span class="bl">${label}</span>
<span class="bact"><button class="bsz" aria-label="Change size of ${esc(name)}" title="Size">${ico("resize")}</button><button class="bhide" aria-label="Hide ${esc(name)}" title="Hide">${ico("minus")}</button></span></header>
<div class="bb">${body}</div><span class="rz" aria-hidden="true"></span></section>`;

const prodBlock = (p, w = 4, h = 4) => blk(p.id, w, h, "product", `
<div class="pb">
<div class="pt"><h2>${esc(p.name)}</h2><span class="chip ${p.state}">${p.state}</span></div>
<p class="pl">${esc(p.line)}</p>
<p class="plong mut">${esc(p.long)}</p>
${sig(p.id)}
<dl class="fp"><div><dt>Free</dt><dd>${p.free.map(esc).join(" · ")}</dd></div><div><dt>Paid</dt><dd>${p.paid.length ? esc(p.paid.join(" · ")) + ` <span class="mut">· ${p.price}</span>` : `<span class="mut">${p.price}</span>`}</dd></div></dl>
<div class="pfoot"><span class="use">${p.usage.fig ? fig(p.usage.fig) + " " + esc(p.usage.text.replace(figs[p.usage.fig].v, "").trim()) : esc(p.usage.text)}</span><a class="key ghost" href="${p.host.includes(" ") ? "shop.html" : "https://" + p.host}" aria-label="${esc(p.name)}: ${esc(p.host)}">${ico("out")}</a></div>
</div>`, "prod", p.name);

const checkerBlock = (w, h) => blk("checker", w, h, "try it", `
<div class="pb">
<div class="pt"><h2>Agent-ready checker</h2><span class="chip coming">coming</span></div>
<p class="pl">Is a site ready for AI agents? WebMCP, MCP, x402, llms.txt.</p>
<form class="mini-check" action="https://check.hrabovskyi.online" method="get"><label class="sr" for="mc-url">Address to check</label><input id="mc-url" name="url" value="hrabovskyi.online" autocomplete="off" spellcheck="false"><button class="key primary" type="submit">Check</button></form>
<div class="mini-res" aria-live="polite"><p class="mut small">Try this site first: it fails 4 of 7, honestly.</p></div>
<dl class="fp"><div><dt>Free</dt><dd>Web check · GitHub Action</dd></div><div><dt>Paid</dt><dd>API per call over x402 <span class="mut">· price not set</span></dd></div></dl>
</div>`, "prod checker", "Agent-ready checker");

const boxBlock = (w, h) => blk("box", w, h, "my box, live", `
<div class="boxb"><div class="bx">${fig("containers", "big")}<span>containers</span></div><div class="bx good">${fig("unhealthy", "big")}<span>unhealthy</span></div><div class="bx">${fig("uptime", "big")}<span>uptime</span></div></div>
<div class="mtx" role="img" aria-label="133 containers, all healthy">${Array.from({ length: status.containers }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
<p class="small mut mono">status.json · read <span data-ago="${READ_AT}">${fmtDate(READ_AT)}</span></p>`, "box");

const nowBlock = (w, h) => blk("now", w, h, "being built now", `<ol class="feed">${commits.map(c => `<li><a href="${c.href}"><span class="mono mut small"><span data-ago="${c.at}">${fmtDate(c.at)}</span> · ${c.repo}</span><span class="fm">${esc(c.msg)}</span></a></li>`).join("")}</ol>`);
const postsBlock = (w, h) => blk("posts", w, h, "writing", `<p class="small mut mono">${fig("posts")} posts · ${fig("words")} words</p><ol class="posts">${posts.map(p => `<li><a href="${p.href}"><span class="mono mut small">${fmtDate(p.date)}</span><b>${esc(p.title)}</b></a></li>`).join("")}</ol>`);
const codeBlock = (w, h) => { const top = status.languages.slice(0, 5); const max = top[0][1]; return blk("coding", w, h, "coding time", `<p class="kv">${fig("hours", "big")}<span class="mut small">${fig("editor")} of it in Claude · period not stated</span></p><div class="bars">${top.map(([n, hrs, p]) => `<div class="br" title="${n}: ${hrs} h"><span>${n}</span><span class="bt"><i style="width:${(hrs / max * 100).toFixed(1)}%"></i></span><span class="num mut">${p}%</span></div>`).join("")}</div>`); };
const partnerBlock = (w, h) => blk("partner", w, h, "partner", `<h2>Build one of these with me</h2><p class="mut">Co-build, integrate, distribute. One written page of terms before code.</p><a class="key" href="partner.html">How it works ${ico("arrow")}</a>`);
const ruleBlock = (w, h) => blk("rule", w, h, "how money works", `<ul class="rule"><li>${ico("check")}<span>Essentials of every tool are free.</span></li><li>${ico("check")}<span>Only truly advanced things are paid, priced before you click.</span></li><li>${ico("check")}<span>No prices are set yet. Paying users: ${fig("paying")}.</span></li></ul>`);

const intro = (w, h, h1, lede, acts) => blk("intro", w, h, "hello", `<div class="intro"><h1>${h1}</h1><p class="lede">${lede}</p><div class="acts">${acts}</div></div>`, "introb");

const dock = `<div class="dockwrap"><p class="hint mono" id="hint" hidden>Drag a handle · pull a corner · keys: arrows move, + − width, [ ] height, Delete hides</p><div class="dock" hidden>
<button class="key" id="edit" aria-pressed="false">${ico("grid")} <span>Arrange</span> <kbd>E</kbd></button>
<button class="key" id="add" aria-expanded="false">${ico("plus")} <span>Blocks</span> <span class="cnt num" id="hiddenCount">0</span></button>
<button class="key" id="share">${ico("link")} <span>Share layout</span></button>
<button class="key ghost" id="reset">${ico("reset")} <span>Reset</span></button>
<span class="saved mono" id="saved">Default layout</span>
<div class="tray" id="tray" hidden><p class="mut small">Hidden blocks. Add one back:</p><ul></ul><p class="mut small empty">Nothing hidden. Use ${ico("minus")} on a block to tuck it away.</p></div>
</div>
</div>`;

const canvas = (blocks) => `<div class="canvas" id="canvas">${blocks.join("")}</div>${dock}`;

const home = shell({ title: "Home", active: "Home", body: canvas([
  intro(8, 5, "Small tools for people who run AI agents. Arrange them however you think.", "Seven products, from a checker that asks whether a site is ready for agents to a kit that lets them pay per call. The essentials are free. This page is yours to rearrange; it remembers.", `<a class="key primary" href="shop.html">All products ${ico("arrow")}</a><a class="key" href="partner.html">Partner</a>`),
  boxBlock(4, 5),
  checkerBlock(4, 6),
  prodBlock(products[2], 4, 6),
  nowBlock(4, 6),
  prodBlock(products[3], 4, 6),
  prodBlock(products[1], 4, 5),
  postsBlock(4, 4),
  prodBlock(products[5], 4, 5),
  prodBlock(products[4], 4, 6),
  prodBlock(products[6], 4, 5),
  codeBlock(4, 4),
  ruleBlock(4, 3),
  partnerBlock(4, 3),
]) });

const shop = shell({ title: "Shop", active: "Shop", body: canvas([
  intro(8, 3, "Shop", "Each tool lives at its own address and keeps its essentials free. Nothing below asks you to buy anything; prices are not set, so none are shown.", `<span class="chip">7 products</span><span class="chip rebuilding">1 rebuilding</span><span class="chip building">2 building</span><span class="chip coming">4 coming</span>`),
  ruleBlock(4, 3),
  checkerBlock(6, 6),
  prodBlock(products[2], 6, 6),
  prodBlock(products[1], 4, 6),
  prodBlock(products[3], 4, 6),
  prodBlock(products[4], 4, 6),
  prodBlock(products[5], 6, 5),
  prodBlock(products[6], 6, 5),
]) });

const partnerPage = shell({ title: "Partner", active: "Partner", body: canvas([
  intro(8, 3, "Partner", "I am looking for people to build products with, not clients to sell to. Terms are one written page, agreed before anyone writes code.", `<a class="key primary" href="mailto:${links.email}?subject=Partnering">${ico("mail")} ${links.email}</a>`),
  blk("facts", 4, 3, "so far", `<dl class="facts"><div><dt>open channels</dt><dd class="num big">4</dd></div><div><dt>revenue shared</dt><dd class="num big">0</dd></div><div><dt>reply from</dt><dd class="num big">UTC+2</dd></div></dl>`),
  ...partner.want.map(([k, d], i) => blk("want" + i, 3, 3, "open · 0" + (i + 1), `<h2>${k}</h2><p class="mut">${esc(d)}</p><a class="key" href="mailto:${links.email}?subject=${encodeURIComponent(k)}">Ask about this</a>`, "want")),
  blk("bring", 6, 5, "what I bring", `<ul class="bring">${partner.bring.map(([k, d, f]) => `<li>${f ? fig(f, "big") : `<span class="big num">x402</span>`}<div><b>${k}</b><p class="mut">${esc(d)}</p></div></li>`).join("")}</ul>`),
  blk("steps", 6, 5, "how it works", `<ol class="steps">${partner.steps.map(([k, d], i) => `<li><span class="num">${i + 1}</span><div><b>${k}</b><p class="mut">${esc(d)}</p></div></li>`).join("")}</ol>`),
  blk("evidence", 12, 2, "evidence", `<ol class="ev">${posts.slice(1, 4).map(p => `<li><a href="${p.href}"><span class="mono mut small">${fmtDate(p.date)}</span><b>${esc(p.title)}</b></a></li>`).join("")}</ol>`),
]) });

export default { [`${C}/index.html`]: home, [`${C}/shop.html`]: shop, [`${C}/partner.html`]: partnerPage };
