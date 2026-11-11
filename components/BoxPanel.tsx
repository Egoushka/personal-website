"use client";

import { useStatus } from "@/lib/status";
import { BOX_FALLBACK, READ_DATE } from "@/lib/shop";
import { Server } from "@/components/ui/icons";

/**
 * The box, as a row of figures and one square per container. Static HTML is the
 * dated reading; the live file replaces it when it answers. The grid always has
 * room for the larger of the two counts so the swap moves nothing.
 */
export default function BoxPanel() {
  const s = useStatus();
  const live = s ?? undefined;
  const b = live ?? BOX_FALLBACK;
  const slots = Math.max(b.containers, BOX_FALLBACK.containers);
  const healthy = b.containers - b.unhealthy;
  const stamp = live ? "live from status.json" : `read ${READ_DATE}`;
  const raw = JSON.stringify(
    { generated: b.generated, uptimeDays: b.uptimeDays, containers: b.containers, unhealthy: b.unhealthy },
    null,
    1,
  ).replace(/\n\s*/g, " ");

  return (
    <section className="pn" aria-labelledby="box-h">
      <div className="pn-head">
        <h2 id="box-h">
          <Server aria-hidden="true" /> The box
        </h2>
        <span className={live ? "chip chip-good" : "chip"}>{live ? "live" : `read ${READ_DATE}`}</span>
      </div>
      <div className="pn-body">
        <div className="boxfigs">
          <div>
            <span className="figv">{b.containers}</span>
            <span>containers</span>
          </div>
          <div className={b.unhealthy === 0 ? "ok" : undefined}>
            <span className="figv">{b.unhealthy}</span>
            <span>unhealthy</span>
          </div>
          <div>
            <span className="figv">{b.uptimeDays} d</span>
            <span>{b.uptimeDays === 0 ? "uptime, restarted today" : "uptime"}</span>
          </div>
        </div>
        <div className="matrix" role="img" aria-label={`${b.containers} containers, ${b.unhealthy} unhealthy`}>
          {Array.from({ length: slots }, (_, i) =>
            i >= b.containers ? (
              <i key={i} className="invisible" />
            ) : i < healthy ? (
              <i key={i} />
            ) : (
              <i key={i} className="bad" />
            ),
          )}
        </div>
        <ul className="legend">
          <li>healthy {healthy}</li>
          <li>unhealthy {b.unhealthy}</li>
          <li>one square per container</li>
        </ul>
        <pre className="raw">
          <code>
            {"// status.json, the lines this panel reads\n"}
            {raw}
          </code>
        </pre>
      </div>
      <div className="pn-foot">
        <span>status.json</span>
        <span>{stamp}</span>
      </div>
    </section>
  );
}
