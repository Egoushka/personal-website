// mission-control behaviour. Without it the page is a complete static dashboard with links to sources.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.R2, toast = (m) => window.R2UI.toast(m);

  // UTC clock, advancing from the prototype's "now".
  const clock = $("#clock");
  if (clock) { const t = () => { clock.textContent = new Date(Date.now()).toISOString().slice(11, 16); }; t(); setInterval(t, 10000); }

  // Sources mode: every figure grows an inline tag naming where it is read from.
  const tgl = $("#srcToggle");
  const setSources = on => {
    document.body.classList.toggle("sources", on);
    if (tgl) tgl.setAttribute("aria-pressed", on);
    if (on && !$(".srctag")) $$("[data-fig]").forEach(f => { if (f.closest(".pulse")) return; const r = D.figs[f.dataset.fig]; if (!r) return; const t = document.createElement("span"); t.className = "srctag"; t.textContent = r.src; f.after(t); });
  };
  tgl?.addEventListener("click", () => setSources(!document.body.classList.contains("sources")));
  addEventListener("keydown", e => { if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) setSources(!document.body.classList.contains("sources")); });

  // Refresh: read status.json again. From file:// or another origin the browser blocks it; say so plainly.
  const rf = $("#refresh");
  rf?.addEventListener("click", async () => {
    const m = $(".matrix"); rf.classList.add("refreshing"); m.classList.remove("reading"); void m.offsetWidth; m.classList.add("reading");
    let msg;
    try {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 2500);
      const r = await fetch("https://hrabovskyi.online/status.json", { signal: ctl.signal, cache: "no-store" });
      const s = await r.json();
      $$('[data-fig="containers"]').forEach(e => { if (!e.closest(".pulse")) e.textContent = s.containers; });
      $$('[data-fig="unhealthy"]').forEach(e => e.textContent = s.unhealthy);
      $("#readAgo").dataset.ago = s.generated; window.R2UI.tick();
      msg = `Read again: ${s.containers} containers, ${s.unhealthy} unhealthy, written ${s.generated.slice(11, 16)} UTC.`;
    } catch { msg = "This copy can't reach status.json (the browser blocks it here). Showing the 01:58 UTC reading, unchanged."; }
    setTimeout(() => { rf.classList.remove("refreshing"); toast(msg); }, 900);
  });

  // Matrix hover: say what a cell is, and what is not published.
  const tip = $(".tip");
  const showTip = (el, text) => { const b = el.getBoundingClientRect(); tip.textContent = text; tip.hidden = false; tip.style.left = b.left + b.width / 2 + "px"; tip.style.top = b.top + "px"; };
  if (tip) {
    $(".matrix")?.addEventListener("pointerover", e => { const i = e.target.closest("i"); if (!i) return; showTip(i, `container ${+i.style.getPropertyValue("--i") + 1} of 133 · healthy · names not published`); });
    $(".matrix")?.addEventListener("pointerleave", () => tip.hidden = true);
    $$(".bar-r").forEach(b => { const s = () => showTip(b.querySelector(".bt"), b.dataset.tip); b.addEventListener("pointerenter", s); b.addEventListener("focus", s); b.addEventListener("pointerleave", () => tip.hidden = true); b.addEventListener("blur", () => tip.hidden = true); });
  }

  // Filters: one group at a time, survivors keep their place.
  const filt = (group, items, test) => group?.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", group).forEach(x => x.setAttribute("aria-pressed", x === b));
    items().forEach(it => it.classList.toggle("hide", !test(it, b)));
  });
  filt($(".now .seg"), () => $$(".feed li"), (li, b) => b.dataset.repo === "all" || (b.dataset.repo === "other" ? li.dataset.repo !== "chargehand" : li.dataset.repo === b.dataset.repo));
  filt($("#stateFilter"), () => $$(".prow"), (r, b) => b.dataset.s === "all" || r.dataset.state === b.dataset.s);
  if (location.hash) { const d = document.getElementById(location.hash.slice(1)); if (d?.tagName === "DETAILS") d.open = true; }

  // Partner composer: the draft is plain text the visitor sends from their own mail app.
  const kind = $("#kind"), about = $("#about"), have = $("#have"), draft = $("#draft"), send = $("#send");
  if (kind) {
    let k = "Co-build";
    const verbs = { "Co-build": "co-build", "Integrate": "integrate", "Distribute": "distribute", "Use it honestly": "try and report on" };
    const render = () => {
      const subj = `${k}: ${about.value}`;
      const body = `Hi Yehor,\n\nI would like to ${verbs[k]} ${about.value}.\nWhat I have: ${have.value || "…"}\nWhat I want from it: …`;
      draft.textContent = `To: ${D.email}\nSubject: ${subj}\n\n${body}`;
      send.href = `mailto:${D.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    };
    kind.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; k = b.dataset.v; $$("button", kind).forEach(x => x.setAttribute("aria-pressed", x === b)); render(); });
    about.addEventListener("change", render); have.addEventListener("input", render);
    $$("[data-kind]").forEach(b => b.addEventListener("click", () => {
      k = b.dataset.kind; $$("button", kind).forEach(x => x.setAttribute("aria-pressed", x.dataset.v === k)); render();
      $("#compose").scrollIntoView({ behavior: "smooth", block: "center" }); b.closest(".ch").classList.add("flash"); setTimeout(() => have.focus({ preventScroll: true }), 500);
    }));
    $("#copy").addEventListener("click", async () => { try { await navigator.clipboard.writeText(draft.textContent); toast("Copied. Paste it into any mail app."); } catch { toast("Copy blocked here; select the text instead."); } });
    render();
  }
})();
