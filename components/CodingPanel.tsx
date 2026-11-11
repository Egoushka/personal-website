"use client";

import { useStatus } from "@/lib/status";
import { CODING_FALLBACK, READ_DATE } from "@/lib/shop";
import { Code } from "@/components/ui/icons";

type Row = { name: string; hours: number; percent: number };

const h = (x: number) => `${Math.round(x * 10) / 10}`;

/** Coding time from the box's own file; the dated reading until it answers. */
export default function CodingPanel() {
  const s = useStatus();
  const c = s?.coding ?? undefined;
  const hours = c ? c.hours : CODING_FALLBACK.hours;
  const editor = c ? c.editor : CODING_FALLBACK.editor;
  const editorPercent = c ? c.editorPercent : CODING_FALLBACK.editorPercent;
  const langs: Row[] = c?.languages?.length
    ? c.languages.map((l) => ({ name: l.name, hours: l.hours, percent: l.percent }))
    : CODING_FALLBACK.languages;
  const top = langs.slice(0, 5);
  const rest = langs.slice(5);
  const rows: Row[] = [...top];
  const shownHours = top.reduce((a, l) => a + l.hours, 0);
  const otherHours = rest.length ? rest.reduce((a, l) => a + l.hours, 0) : Math.max(0, hours - shownHours);
  const otherPct = rest.length ? rest.reduce((a, l) => a + l.percent, 0) : Math.max(0, 100 - top.reduce((a, l) => a + l.percent, 0));
  if (otherHours >= 0.1) rows.push({ name: "Other", hours: otherHours, percent: otherPct });
  const max = Math.max(...rows.map((r) => r.hours), 1);

  return (
    <section className="pn" aria-labelledby="coding-h">
      <div className="pn-head">
        <h2 id="coding-h">
          <Code aria-hidden="true" /> Coding time
        </h2>
        <span className="chip">{c ? "live" : `read ${READ_DATE}`}</span>
      </div>
      <div className="pn-body">
        <p className="num text-sm">
          <span className="figv text-2xl font-bold">{Math.round(hours)} h</span>
          {" "}
          <span className="text-muted-foreground">
            {editorPercent}% in {editor}
          </span>
        </p>
        <div className="bars mt-4 min-h-[12.5rem]">
          {rows.map((r) => (
            <div className="bar-r" key={r.name}>
              <span>{r.name}</span>
              <span className="bar-t">
                <i style={{ "--w": `${(r.hours / max) * 100}%` } as React.CSSProperties} />
              </span>
              <span className="bar-v num">{r.percent}%</span>
            </div>
          ))}
        </div>
        <details className="tbl">
          <summary>As a table</summary>
          <table>
            <thead>
              <tr>
                <th>Language</th>
                <th>Hours</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td className="num">{h(r.hours)}</td>
                  <td className="num">{r.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
      <div className="pn-foot">
        <span>status.json, coding</span>
        <span>period not stated</span>
      </div>
    </section>
  );
}
