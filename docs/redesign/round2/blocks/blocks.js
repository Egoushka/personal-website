// blocks: arrange, resize, hide, share and reset. Layout is saved per page in localStorage.
// Without this file the page is the default arrangement as a plain CSS grid.
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const canvas = $("#canvas"); if (!canvas) return;
  const toast = m => window.R2UI.toast(m);
  const PAGE = location.pathname.split("/").pop().replace(".html", "") || "index";
  const KEY = "r2.blocks." + PAGE, WIDTHS = [3, 4, 6, 8, 12], HMIN = 2, HMAX = 9;
  const blocks = () => $$(".blk", canvas);
  const byId = id => $(`.blk[data-id="${id}"]`, canvas);
  const reduced = () => document.documentElement.dataset.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => matchMedia("(max-width: 760px)").matches;
  const defaults = blocks().map(b => ({ id: b.dataset.id, w: +b.dataset.w, h: +b.dataset.h, hidden: false }));
  const hiddenStore = document.createElement("div"); hiddenStore.hidden = true; document.body.append(hiddenStore);
  blocks().forEach((b, i) => b.style.setProperty("--n", i));

  // FLIP: measure, change, then animate every block from where it was to where it is.
  const flip = (change) => {
    const before = new Map(blocks().map(b => [b, b.getBoundingClientRect()]));
    change();
    if (reduced()) return;
    blocks().forEach(b => {
      const a = before.get(b), z = b.getBoundingClientRect(); if (!a) return;
      const dx = a.left - z.left, dy = a.top - z.top, sx = a.width / z.width, sy = a.height / z.height;
      if (Math.abs(dx) + Math.abs(dy) < 1 && Math.abs(sx - 1) + Math.abs(sy - 1) < .01) return;
      b.animate([{ transform: `translate(${dx}px, ${dy}px)`, transformOrigin: "top left" }, { transform: "none", transformOrigin: "top left" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  };

  const setSize = (b, w, h) => { b.dataset.w = w; b.dataset.h = h; b.style.setProperty("--w", w); b.style.setProperty("--h", h); };
  const state = () => [...blocks().map(b => ({ id: b.dataset.id, w: +b.dataset.w, h: +b.dataset.h, hidden: false })), ...$$(".blk", hiddenStore).map(b => ({ id: b.dataset.id, w: +b.dataset.w, h: +b.dataset.h, hidden: true }))];
  const same = s => JSON.stringify(s) === JSON.stringify(defaults);
  const saved = $("#saved");
  const save = (quiet) => {
    const s = state();
    if (same(s)) { localStorage.removeItem(KEY); saved.textContent = "Default layout"; }
    else { localStorage.setItem(KEY, JSON.stringify(s)); saved.textContent = "Saved on this device"; }
    if (!quiet) { saved.classList.add("flash"); setTimeout(() => saved.classList.remove("flash"), 900); }
    renderTray();
  };
  const apply = (s) => {
    const all = new Map([...blocks(), ...$$(".blk", hiddenStore)].map(b => [b.dataset.id, b]));
    s.forEach(({ id, w, h, hidden }) => { const b = all.get(id); if (!b) return; setSize(b, w, h); (hidden ? hiddenStore : canvas).append(b); all.delete(id); });
    all.forEach(b => canvas.append(b)); // blocks added since the layout was saved
  };

  // Load: a shared link wins, then this device's layout, then the default.
  const fromHash = () => { const m = location.hash.match(/layout=([\w,:.-]+)/); if (!m) return null;
    try { return m[1].split(",").map(t => { const [id, w, h, x] = t.split(":"); return { id, w: +w, h: +h, hidden: x === "x" }; }); } catch { return null; } };
  const shared = fromHash(), local = JSON.parse(localStorage.getItem(KEY) || "null");
  if (shared) { apply(shared); setTimeout(() => toast("You are looking at someone's shared arrangement. Reset brings back the default."), 600); }
  else if (local) apply(local);

  // Tray of hidden blocks
  const tray = $("#tray"), addBtn = $("#add");
  const renderTray = () => {
    const hid = $$(".blk", hiddenStore);
    $("#hiddenCount").textContent = hid.length;
    tray.classList.toggle("none", !hid.length);
    $("ul", tray).innerHTML = hid.map(b => `<li><button class="key" data-show="${b.dataset.id}">${b.getAttribute("aria-label")}<svg class="ico" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button></li>`).join("");
    saved.textContent = same(state()) ? "Default layout" : saved.textContent;
  };
  addBtn.addEventListener("click", e => { e.stopPropagation(); tray.hidden = !tray.hidden; addBtn.setAttribute("aria-expanded", !tray.hidden); });
  document.addEventListener("click", e => { if (!tray.hidden && !tray.contains(e.target) && e.target !== addBtn) { tray.hidden = true; addBtn.setAttribute("aria-expanded", "false"); } });
  tray.addEventListener("click", e => { const b = e.target.closest("[data-show]"); if (!b) return; const blk = $(`.blk[data-id="${b.dataset.show}"]`, hiddenStore);
    flip(() => canvas.prepend(blk)); blk.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 300 }); save(); });

  const hide = b => { flip(() => hiddenStore.append(b)); save(); toast(`${b.getAttribute("aria-label")} tucked away. Bring it back from Blocks.`); };
  const cycle = b => { const i = WIDTHS.indexOf(+b.dataset.w); const w = WIDTHS[(i + 1) % WIDTHS.length]; flip(() => setSize(b, w, +b.dataset.h)); save(); };

  // Arrange mode
  const edit = $("#edit"), hint = $("#hint");
  const setEdit = on => { document.body.classList.toggle("editing", on); edit.setAttribute("aria-pressed", on); hint.hidden = !on;
    blocks().forEach(b => { if (on) { b.tabIndex = 0; } else b.removeAttribute("tabindex"); });
    $$(".grip").forEach(g => g.tabIndex = on ? 0 : -1); };
  edit.addEventListener("click", () => setEdit(!document.body.classList.contains("editing")));
  addEventListener("keydown", e => {
    const t = document.activeElement;
    if (e.key.toLowerCase() === "e" && !/INPUT|TEXTAREA/.test(t.tagName) && !e.metaKey && !e.ctrlKey) { setEdit(!document.body.classList.contains("editing")); return; }
    if (!document.body.classList.contains("editing")) return;
    const b = t.closest?.(".blk"); if (!b || t !== b) return;
    const list = blocks(), i = list.indexOf(b);
    if (["ArrowLeft", "ArrowUp"].includes(e.key) && i > 0) { e.preventDefault(); flip(() => list[i - 1].before(b)); b.focus(); save(); }
    if (["ArrowRight", "ArrowDown"].includes(e.key) && i < list.length - 1) { e.preventDefault(); flip(() => list[i + 1].after(b)); b.focus(); save(); }
    if (e.key === "+" || e.key === "=") { const w = WIDTHS[Math.min(WIDTHS.length - 1, WIDTHS.indexOf(+b.dataset.w) + 1)]; flip(() => setSize(b, w, +b.dataset.h)); save(); }
    if (e.key === "-") { const w = WIDTHS[Math.max(0, WIDTHS.indexOf(+b.dataset.w) - 1)]; flip(() => setSize(b, w, +b.dataset.h)); save(); }
    if (e.key === "]") { flip(() => setSize(b, +b.dataset.w, Math.min(HMAX, +b.dataset.h + 1))); save(); }
    if (e.key === "[") { flip(() => setSize(b, +b.dataset.w, Math.max(HMIN, +b.dataset.h - 1))); save(); }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); const next = list[i + 1] || list[i - 1]; hide(b); next?.focus(); }
  });
  canvas.addEventListener("click", e => {
    const s = e.target.closest(".bsz"), h = e.target.closest(".bhide");
    if (s) cycle(s.closest(".blk")); if (h) hide(h.closest(".blk"));
  });

  // Drag by the handle: the block stays in the grid as a dashed slot, a lifted copy follows the pointer,
  // and the slot moves to wherever the pointer is.
  canvas.addEventListener("pointerdown", e => {
    const g = e.target.closest(".grip"); if (!g || !document.body.classList.contains("editing")) return;
    e.preventDefault();
    const b = g.closest(".blk"), r = b.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    const clone = b.cloneNode(true); clone.classList.add("drag-clone"); clone.removeAttribute("id");
    Object.assign(clone.style, { width: r.width + "px", height: r.height + "px", left: r.left + "px", top: r.top + "px" });
    document.body.append(clone); b.classList.add("ghosted");
    let last = 0;
    const move = ev => {
      clone.style.left = ev.clientX - ox + "px"; clone.style.top = ev.clientY - oy + "px";
      if (ev.clientY < 80) scrollBy(0, -12); if (ev.clientY > innerHeight - 80) scrollBy(0, 12);
      const now = performance.now(); if (now - last < 90) return; last = now;
      const over = document.elementsFromPoint(ev.clientX, ev.clientY).find(el => el.classList?.contains("blk") && el !== b && !el.classList.contains("drag-clone"));
      if (!over) return;
      const o = over.getBoundingClientRect(), list = blocks();
      const after = mobile() ? ev.clientY > o.top + o.height / 2 : (ev.clientX > o.left + o.width / 2);
      if (after && over.nextElementSibling === b) return; if (!after && over.previousElementSibling === b) return;
      flip(() => after ? over.after(b) : over.before(b));
    };
    const up = () => {
      removeEventListener("pointermove", move); removeEventListener("pointerup", up);
      const z = b.getBoundingClientRect();
      const anim = reduced() ? null : clone.animate([{ left: clone.style.left, top: clone.style.top, rotate: "1.2deg" }, { left: z.left + "px", top: z.top + "px", rotate: "0deg" }], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
      const done = () => { clone.remove(); b.classList.remove("ghosted"); save(); };
      anim ? (anim.onfinish = done) : done();
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
  });

  // Resize from the corner: snaps to 3, 4, 6, 8 or 12 columns and whole rows.
  canvas.addEventListener("pointerdown", e => {
    const rz = e.target.closest(".rz"); if (!rz || !document.body.classList.contains("editing")) return;
    e.preventDefault();
    const b = rz.closest(".blk"), r = b.getBoundingClientRect(), cs = getComputedStyle(canvas);
    const cols = cs.gridTemplateColumns.split(" ").length, gap = parseFloat(cs.columnGap), colW = (canvas.clientWidth - gap * (cols - 1)) / cols, rowH = parseFloat(cs.gridAutoRows);
    const badge = document.createElement("span"); badge.className = "sizebadge mono"; b.append(badge); b.classList.add("sizing");
    const move = ev => {
      const wantW = (ev.clientX - r.left + gap) / (colW + gap), wantH = (ev.clientY - r.top + gap) / (rowH + gap);
      const w = WIDTHS.filter(x => x <= cols).reduce((a, x) => Math.abs(x - wantW) < Math.abs(a - wantW) ? x : a, 3);
      const h = Math.max(HMIN, Math.min(HMAX, Math.round(wantH)));
      badge.textContent = `${w} × ${h}`;
      if (w !== +b.dataset.w || h !== +b.dataset.h) flip(() => setSize(b, w, h));
    };
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); badge.remove(); b.classList.remove("sizing"); save(); };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
  });

  $("#reset").addEventListener("click", () => {
    flip(() => apply(defaults)); localStorage.removeItem(KEY); history.replaceState(null, "", location.pathname); save(true); toast("Back to the default layout.");
  });
  $("#share").addEventListener("click", async () => {
    const code = state().map(s => `${s.id}:${s.w}:${s.h}${s.hidden ? ":x" : ""}`).join(",");
    const url = location.origin + location.pathname + "#layout=" + code;
    history.replaceState(null, "", "#layout=" + code);
    try { await navigator.clipboard.writeText(url); toast("Link copied. Whoever opens it sees your arrangement; nothing is stored on a server."); }
    catch { toast("The address bar now holds your layout. Copy it from there."); }
  });

  $(".dock").hidden = false;
  setTimeout(() => document.body.classList.add("settled"), 1400);
  save(true);

  // The checker block: a real recorded result for this site, a labelled simulation for anything else.
  const form = $(".mini-check");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    const res = $(".mini-res"), r = window.R2Check.run($("input", form).value);
    if (!r) { res.innerHTML = `<p class="small" style="color:var(--bad)">That does not look like an address. Try example.com.</p>`; return; }
    res.innerHTML = `<div class="mres-top"><b>${r.score}/7</b><span class="small">${r.host}</span>${r.kind === "recorded" ? `<span class="chip real">recorded 2026-11-11</span>` : `<span class="chip sim">simulated</span>`}</div><div class="dots">${r.rows.map(([n, , , ok], i) => `<span class="${ok ? "ok" : "no"}" style="animation-delay:${i * 90}ms"><svg class="ico" viewBox="0 0 24 24">${ok ? '<path d="M20 6 9 17l-5-5"/>' : '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'}</svg>${n}</span>`).join("")}</div>${r.kind === "simulated" ? `<p class="small mut" style="margin-top:6px">Not a real scan: the checker is not deployed yet.</p>` : ""}`;
  });
})();
