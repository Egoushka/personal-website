// Shared behaviour for round-2 prototypes: knobs (theme, density, accent, motion), relative times,
// receipts for every figure, a toast. Everything here is enhancement: the page reads fine without it.
(() => {
  const root = document.documentElement, store = localStorage, KEY = "r2.knobs";
  const D = window.R2 || {};
  const knobs = Object.assign({ theme: "system", density: "comfortable", hue: root.dataset.hueDefault || "255", motion: "on" }, JSON.parse(store.getItem(KEY) || "{}"));
  const apply = () => {
    const dark = knobs.theme === "dark" || (knobs.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.density = knobs.density; root.dataset.motion = knobs.motion;
    root.style.setProperty("--hue", knobs.hue);
    document.querySelectorAll("[data-knob]").forEach(b => b.setAttribute("aria-pressed", String(knobs[b.dataset.knob] === b.dataset.v)));
  };
  const q = new URLSearchParams(location.search);
  if (q.get("theme")) knobs.theme = q.get("theme");
  apply();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply);

  const toast = msg => {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = msg; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 3200);
  };

  const ago = iso => {
    const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
    if (s < 90) return "just now";
    const m = s / 60; if (m < 60) return Math.round(m) + " min ago";
    const h = m / 60; if (h < 36) return Math.round(h) + " h ago";
    const d = h / 24; if (d < 60) return Math.round(d) + " d ago";
    return new Date(iso).toISOString().slice(0, 10);
  };
  const tick = () => document.querySelectorAll("[data-ago]").forEach(el => { el.textContent = ago(el.dataset.ago); });

  document.addEventListener("DOMContentLoaded", () => {
    // Prototype clock: the page pretends "now" is shortly after the snapshot, so relative times read
    // as they would on the live site. Real build: Date.now().
    const offset = D.now ? Date.now() - new Date(D.now) : 0;
    const realNow = Date.now; Date.now = () => realNow() - offset;
    tick(); setInterval(tick, 15000);

    const panel = document.querySelector(".knobs"), open = document.querySelector("[data-open-knobs]");
    if (panel && open) {
      open.addEventListener("click", e => { e.stopPropagation(); const on = panel.classList.toggle("open"); open.setAttribute("aria-expanded", on); if (on) panel.querySelector("button")?.focus(); });
      document.addEventListener("click", e => { if (!panel.contains(e.target)) { panel.classList.remove("open"); open.setAttribute("aria-expanded", "false"); } });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && panel.classList.contains("open")) { panel.classList.remove("open"); open.focus(); } });
      panel.addEventListener("click", e => { const b = e.target.closest("[data-knob]"); if (!b) return; knobs[b.dataset.knob] = b.dataset.v; store.setItem(KEY, JSON.stringify(knobs)); apply(); });
    }

    // Receipts: any [data-fig] opens a small card saying where the number comes from.
    const figs = D.figs || {};
    let card;
    const close = () => { if (card) { card.remove(); card = null; } };
    document.addEventListener("click", e => {
      const f = e.target.closest("[data-fig]");
      if (!f) { if (card && !card.contains(e.target)) close(); return; }
      const r = figs[f.dataset.fig]; if (!r) return;
      e.preventDefault(); close();
      card = document.createElement("div"); card.className = "receipt"; card.setAttribute("role", "dialog"); card.setAttribute("aria-label", "Source of " + r.l);
      card.innerHTML = `<div class="rc-top"><b class="num">${r.v}</b><span>${r.l}</span></div><dl><dt>Read from</dt><dd class="mono">${r.src}</dd><dt>How</dt><dd>${r.how}</dd><dt>Read</dt><dd class="mono">${(D.readAt || "").replace("T", " ").slice(0, 16)} UTC</dd></dl><a class="key" href="${r.href}">Open the source <svg class="ico" viewBox="0 0 24 24"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg></a>`;
      document.body.append(card);
      const b = f.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
      card.style.width = w + "px";
      card.style.left = Math.max(12, Math.min(innerWidth - w - 12, b.left)) + "px";
      const below = b.bottom + 8 + card.offsetHeight < innerHeight;
      card.style.top = (below ? b.bottom + 8 : Math.max(12, b.top - card.offsetHeight - 8)) + scrollY + "px";
      card.querySelector("a").focus({ preventScroll: true });
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  });
  window.R2UI = { toast, ago, tick };
})();
