"use client";

import { skills } from "@/lib/site";
import { useStatus } from "@/lib/status";

/**
 * IDEA TWO — an instrument.
 *
 * No diagram at all. The stack as the readout of a machine: monospace, fixed
 * columns, bars where there is something real to measure, and a header strip
 * of live figures off the box.
 *
 * The argument is that this is the most honest form for *this* person. A graph
 * of skills is a picture anyone can draw about themselves; a panel that says
 * 56% C# in the last thirty days, read from a Wakapi on a machine with 37 days
 * of uptime, is a claim that can be wrong tomorrow. It looks like the thing it
 * describes.
 *
 * Bars only appear for languages the editor actually measured. Everything else
 * gets a dash — an unmeasured skill is not a zero, and it is not a five out of
 * ten either. There are no proficiency ratings on this page and there never
 * will be: nobody can check them.
 */
export default function Monitor() {
  const status = useStatus();
  const langs = status?.coding?.languages ?? [];
  const measured = (key?: string) => (key ? langs.find((l) => l.name === key) : undefined);

  return (
    <div className="mon">
      <header className="mon-bar">
        <span className="mon-prompt">~/stack</span>
        {status ? (
          <>
            <span>{status.containers} containers</span>
            <span>up {status.uptimeDays}d</span>
            {status.coding && <span>{status.coding.hours}h / 30d</span>}
            {status.coding?.editor && (
              <span>{status.coding.editor.toLowerCase()} {status.coding.editorPercent}%</span>
            )}
            <span className={status.unhealthy ? "mon-bad" : "mon-ok"}>
              {status.unhealthy ? `${status.unhealthy} unhealthy` : "all healthy"}
            </span>
          </>
        ) : (
          <span className="mon-dim">box not reporting</span>
        )}
      </header>

      <div className="mon-grid">
        {skills.map((group) => (
          <section className="mon-panel" key={group.group}>
            <h2>
              <span className="mon-panel-name">{group.group}</span>
              <span className="mon-panel-count">{group.items.length}</span>
            </h2>
            <ul>
              {group.items.map((skill) => {
                const row = measured(skill.wakatime);
                return (
                  <li key={skill.name}>
                    <span className="mon-name">{skill.name}</span>
                    <span className="mon-meter" aria-hidden="true">
                      {row ? (
                        <span className="mon-fill" style={{ width: `${Math.min(row.percent, 100)}%` }} />
                      ) : (
                        <span className="mon-none" />
                      )}
                    </span>
                    <span className="mon-num">
                      {row ? `${row.percent}%` : "—"}
                    </span>
                    <span className="mon-now">{skill.now}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mon-foot">
        <span className="mon-dim">
          bars are share of measured editor time, last 30 days, from a Wakapi I
          host. a dash means it was not measured — not that it is worth less.
        </span>
      </footer>
    </div>
  );
}
