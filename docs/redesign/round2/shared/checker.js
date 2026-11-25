// The checker's result model, shared by the prototypes. hrabovskyi.online returns the result recorded
// by hand on 2026-11-11; any other address returns a SIMULATED result, seeded by the host name so it
// is stable, and every surface that shows it must say so.
window.R2Check = (() => {
  const recorded = (window.R2 && window.R2.selfCheck) || [];
  const odds = { "llms.txt": .3, "MCP discovery": .12, "WebMCP tools": .06, "x402": .05, "robots.txt": .92, "sitemap": .8, "feed": .45 };
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const host = u => { try { return new URL(/^https?:/.test(u) ? u : "https://" + u.trim()).hostname.replace(/^www\./, ""); } catch { return null; } };
  const run = input => {
    const h = host(input); if (!h || !h.includes(".")) return null;
    if (h === "hrabovskyi.online") return { kind: "recorded", host: h, rows: recorded, score: recorded.filter(r => r[3]).length };
    let seed = hash(h);
    const rnd = () => (seed = Math.imul(seed ^ (seed >>> 15), 2246822519) >>> 0, (seed % 1000) / 1000);
    const rows = recorded.map(([n, path]) => { const ok = rnd() < odds[n]; return [n, path, ok ? (path.startsWith("/") ? "200" : "found") : (path.startsWith("/") ? "404" : "none"), ok, ok ? "Simulated: found." : "Simulated: missing."]; });
    return { kind: "simulated", host: h, rows, score: rows.filter(r => r[3]).length };
  };
  return { run, host };
})();
// Polish NIP: weights 6 5 7 2 3 4 5 6 7, sum mod 11 must equal the tenth digit (10 is never valid).
document.addEventListener("input", e => {
  const i = e.target.closest?.("[data-nip]"); if (!i) return;
  const d = i.value.replace(/\D/g, ""), out = i.parentElement.querySelector("output");
  let ok = false, msg;
  if (d.length !== 10) msg = `${d.length} of 10 digits`;
  else { const s = [6, 5, 7, 2, 3, 4, 5, 6, 7].reduce((a, w, k) => a + w * +d[k], 0) % 11; ok = s !== 10 && s === +d[9]; msg = ok ? "valid checksum" : `checksum says ${s === 10 ? "never valid" : "last digit " + s}`; }
  out.textContent = msg; out.className = "mono " + (ok ? "ok" : "bad");
});
