"use client";

import { useStatus } from "@/lib/status";
import { liveLab, type LabMetric } from "@/lib/lab";

/**
 * The four lab figures. Static HTML carries the dated reading, or says the
 * figure is not published yet; the live block replaces each tile it covers,
 * one at a time, so a source that stops answering only greys its own tile.
 * The chip counts live tiles, so a hand reading never sits under "live".
 */
export default function LabBoard({ metrics }: { metrics: LabMetric[] }) {
  const s = useStatus();
  const shown = metrics.map((m) => ({ m, l: liveLab(m.key, s?.lab) }));
  const nLive = shown.filter((x) => x.l).length;
  const chip = nLive === 0 ? "dated readings" : nLive === shown.length ? "live" : `${nLive} of ${shown.length} live`;

  return (
    <section className="pn" aria-labelledby="lab-h">
      <div className="pn-head">
        <h2 id="lab-h">Measured on the box</h2>
        <span className={nLive ? "chip chip-good" : "chip"}>{chip}</span>
      </div>
      <div className="pn-body">
        <div className="kpis">
          {shown.map(({ m, l }) => (
            <div className="kpi" key={m.key}>
              <span>{m.label}</span>
              <span className={l || m.fallback ? "figv" : "figv text-muted-foreground"}>
                {l?.value ?? m.fallback?.value ?? "none yet"}
              </span>
              <em>
                {l ? l.note : m.fallback ? `read ${m.fallback.read}` : "not published yet"}
                {m.goal && `, ${m.goal}`}
              </em>
              <em>{m.what}</em>
            </div>
          ))}
        </div>
      </div>
      <div className="pn-foot">
        <span>status.json, lab block</span>
        <span>{nLive ? "live tiles from status.json" : "static until the box publishes"}</span>
      </div>
    </section>
  );
}
