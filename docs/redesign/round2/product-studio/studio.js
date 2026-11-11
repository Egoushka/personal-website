// product-studio demos. Each one is labelled on the page as real behaviour, recorded, planned or simulated.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const toast = m => window.R2UI.toast(m);
  const wait = ms => new Promise(r => setTimeout(r, document.documentElement.dataset.motion === "off" ? 0 : ms));
  const I = { check: '<svg class="ico" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>', x: '<svg class="ico" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>', spin: '<svg class="ico" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>' };

  // Card edge light follows the pointer.
  $$(".card").forEach(c => c.addEventListener("pointermove", e => { const b = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - b.left + "px"); c.style.setProperty("--my", e.clientY - b.top + "px"); }));

  // Console: tabs, presets, and a streamed check.
  $$(".console").forEach(con => {
    const tabs = $$("[role=tab]", con);
    const select = t => { tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls"), con).hidden = !on; }); };
    tabs.forEach((t, i) => { t.addEventListener("click", () => select(t)); t.addEventListener("keydown", e => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); } }); });
    $$(".copy", con).forEach(b => b.addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#" + b.dataset.copy, con).textContent); toast("Copied. It is a plan: the action and the API are not published yet."); } catch { toast("Copy blocked here; select the text instead."); } }));
    const form = $(".cform", con), input = $("input", form), rows = $(".rows", con), meter = $$(".meter i", con);
    let run = 0;
    const scan = async (value) => {
      const r = window.R2Check.run(value), id = ++run;
      if (!r) { toast("That does not look like an address. Try example.com."); input.focus(); return; }
      $("#score", con).textContent = "–"; $("#rhost", con).textContent = r.host;
      $("#rkind", con).innerHTML = r.kind === "recorded" ? '<span class="chip real">recorded by hand, 2026-11-11</span>' : '<span class="chip sim">simulated · not a real scan</span>';
      $("#rnote", con).textContent = r.kind === "recorded"
        ? "This is my own site, checked by hand with the same requests the checker will make. It fails 4 of 7; the checker exists so the next site does not have to find out this way."
        : "Simulated: the checker is not deployed yet, so this result is generated from the address, not fetched. The real one will request each path and report what answered.";
      meter.forEach(m => m.className = "");
      rows.innerHTML = r.rows.map(([n, path]) => `<li class="pending"><span class="ri">${I.spin}</span><span class="rn">${n}</span><span class="rp mono">${path}</span><span class="rc mono">…</span><span class="rt">requesting</span></li>`).join("");
      let open = 0;
      for (let i = 0; i < r.rows.length; i++) {
        await wait(260 + (i % 3) * 90); if (id !== run) return;
        const [n, path, code, ok, note] = r.rows[i]; if (ok) open++;
        const li = rows.children[i]; li.className = (ok ? "ok" : "no") + " in";
        li.innerHTML = `<span class="ri">${ok ? I.check : I.x}</span><span class="rn">${n}</span><span class="rp mono">${path}</span><span class="rc mono">${code}</span><span class="rt">${note}</span>`;
        meter[i].className = ok ? "ok" : "no"; $("#score", con).textContent = open;
      }
    };
    form.addEventListener("submit", e => { e.preventDefault(); scan(input.value); });
    $$("[data-url]", con).forEach(b => b.addEventListener("click", () => { input.value = b.dataset.url; scan(b.dataset.url); }));
  });

  // chargehand: resolve each citation; the one without evidence moves to open questions.
  $$(".ch-demo").forEach(d => $(".run", d).addEventListener("click", async () => {
    const items = $$(".claims li", d); items.forEach(li => li.className = "");
    for (const li of items) { li.className = "checking"; await wait(650); li.className = li.dataset.ok === "1" ? "ok" : "moved"; }
  }));

  // x402: one call, step by step; a failing tool is never charged.
  $$(".x-demo").forEach(d => $(".run", d).addEventListener("click", async () => {
    const steps = $$(".flow li", d), fail = $("#xfail", d).checked, res = $("#xres", d);
    res.textContent = fail ? "500 · no charge" : "200 · settled"; res.className = "mono " + (fail ? "w" : "g");
    steps.forEach(s => s.className = "");
    for (const s of steps) { s.className = "on"; await wait(520); s.className = "done"; }
  }));

  // touchstone: three known behaviour differences between SQL Server and PostgreSQL.
  const Q = [
    ["SELECT CASE WHEN 'a ' = 'a' THEN 1 ELSE 0 END;", "1", "pads trailing spaces before comparing", "0", "text compares exactly"],
    ["SELECT CASE WHEN 'A' = 'a' THEN 1 ELSE 0 END;", "1", "default collation ignores case", "0", "default collation is case-sensitive"],
    ["SELECT x FROM (VALUES (1),(NULL)) t(x) ORDER BY x;", "NULL, 1", "NULLs sort first ascending", "1, NULL", "NULLs sort last ascending"],
  ];
  $$(".t-demo").forEach(d => $(".seg", d).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return; const q = Q[+b.dataset.q];
    $$("button", b.parentElement).forEach(x => x.setAttribute("aria-pressed", x === b));
    $(".tq", d).textContent = q[0]; $("#tss", d).textContent = q[1]; $("#tssn", d).textContent = q[2]; $("#tpg", d).textContent = q[3]; $("#tpgn", d).textContent = q[4];
    [$("#tss", d), $("#tpg", d)].forEach(el => el.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 260 }));
  }));

  // WebMCP: what you write vs what the agent sees.
  $$(".w-demo").forEach(d => $(".seg", d).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", b.parentElement).forEach(x => x.setAttribute("aria-pressed", x === b));
    $$(".wv", d).forEach(p => p.hidden = p.dataset.v !== b.dataset.v);
  }));

  // Shop: highlight the product in view.
  const toc = $$(".toc a");
  if (toc.length) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) toc.forEach(a => a.classList.toggle("cur", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
    $$(".prod").forEach(s => io.observe(s));
  }

  // Partner: the one-page terms fill in from the visitor's choices.
  const shapes = $$(".shape");
  if (shapes.length) {
    let k = "Co-build";
    const prod = $("#tProd"), have = $("#tHave"), D = window.R2;
    const what = { "Co-build": p => `${p}, together, in a shared repository.`, "Integrate": p => `${p} wired into your API so agents can call it, and pay where that fits.`, "Distribute": p => `${p}, offered to the people you already reach.`, "Use it honestly": p => `You use the free tier of ${p} and tell me what is wrong. No payment either way.` };
    const render = flash => {
      const p = prod.value;
      $("#tTitle").textContent = `${k}: ${p}`;
      $("#tWhat").textContent = what[k](p);
      $("#tWho").textContent = `I build the .NET and agent side. You bring ${have.value.trim() || "what you name below"}.`;
      const body = `Hi Yehor,\n\n${k}: ${p}\nWhat: ${$("#tWhat").textContent}\nWhat I bring: ${have.value || "…"}\n\nLet's write the one page.`;
      $("#tSend").href = `mailto:${D.email}?subject=${encodeURIComponent(k + ": " + p)}&body=${encodeURIComponent(body)}`;
      if (flash) $$(".terms dd").slice(0, 2).forEach(dd => { dd.classList.remove("flash"); void dd.offsetWidth; dd.classList.add("flash"); });
    };
    shapes.forEach(s => s.addEventListener("click", () => { k = s.dataset.k; shapes.forEach(x => x.setAttribute("aria-pressed", x === s)); render(true); }));
    prod.addEventListener("change", () => render(true)); have.addEventListener("input", () => render(false));
    render(false);
  }
})();
