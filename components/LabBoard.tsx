"use client";

import { useStatus, type Lab } from "@/lib/status";
import type { LabMetric } from "@/lib/lab";

const day = (iso: string) => iso.slice(0, 10);

function live(m: LabMetric, lab: Lab): { value: string; note: string } | undefined {
  if (m.key === "chargehand" && lab.chargehand) {
    const c = lab.chargehand;
    return { value: `${c.merged}/${c.batches}`, note: `${(c.merged / c.batches).toFixed(2)}, as of ${day(c.asOf)}` };
  }
  if (m.key === "rebuildDrill" && lab.rebuildDrill)
    return { value: `${lab.rebuildDrill.minutes} min`, note: `last drill ${day(lab.rebuildDrill.asOf)}` };
  if (m.key === "nytka" && lab.nytka) return { value: `${lab.nytka.uptimePercent}%`, note: `last ${lab.nytka.days} days` };
  if (m.key === "agentChecks" && lab.agentChecks)
    return { value: String(lab.agentChecks.findings), note: `as of ${day(lab.agentChecks.asOf)}` };
  return undefined;
}

/**
 * The four lab figures. Static HTML carries the dated reading, or says the
 * figure is not published yet; the live block replaces each tile it covers,
 * one at a time, so a source that stops answering only greys its own tile.
 */
export default function LabBoard({ metrics }: { metrics: LabMetric[] }) {
  const s = useStatus();
  const lab = s?.lab ?? undefined;
  const shown = metrics.map((m) => ({ m, l: lab ? live(m, lab) : undefined }));
  const anyLive = shown.some((x) => x.l);

  return (
    <section className="pn" aria-labelledby="lab-h">
      <div className="pn-head">
        <h2 id="lab-h">Measured on the box</h2>
        <span className={anyLive ? "chip chip-good" : "chip"}>{anyLive ? "live" : "dated readings"}</span>
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
        <span>{anyLive ? "live from status.json" : "static until the box publishes"}</span>
      </div>
    </section>
  );
}
