"use client";

import { useMemo, useState } from "react";
import { experience, projects, skills } from "@/lib/site";
import { topicName } from "@/lib/topics";

/**
 * IDEA THREE — time.
 *
 * Not a picture of the stack; a picture of how it was acquired. One track per
 * paid role and one per project, laid on a real time axis, with the
 * technologies each of them actually used sitting inside the bar.
 *
 * The reason this is worth considering over the other two: **every pixel is
 * already backed.** The dates come from `experience[].when` and the
 * technologies from `experience[].topics` and `Project.tech` — the same fields
 * the CV and the topic pages read. Nothing here is a judgement about how good
 * I am at something; it is a record of when I was being paid to use it, which
 * is the only version of that claim a stranger can check.
 *
 * It also shows the gaps, which the other two cannot: the two months of
 * selling logistics, the freelance year, the summer with no employer.
 */

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** "Aug 2025" → 2025.58. "present" → now. */
function toYear(part: string, now: number): number {
  const t = part.trim();
  if (/present/i.test(t)) return now;
  const m = /([A-Z][a-z]{2})\s+(\d{4})/.exec(t);
  if (!m) return now;
  return Number(m[2]) + (MONTHS[m[1]] ?? 0) / 12;
}

export default function Strata({ nowYear }: { nowYear: number }) {
  const [active, setActive] = useState<string | null>(null);

  const { rows, from, to } = useMemo(() => {
    const rows = experience
      .map((job) => {
        const [a, b] = job.when.split("—");
        return {
          kind: "role" as const,
          label: job.company,
          detail: job.role,
          when: job.when,
          start: toYear(a, nowYear),
          end: toYear(b ?? "present", nowYear),
          tags: job.topics.map(topicName),
        };
      })
      .sort((x, y) => x.start - y.start);

    // Projects have no start date on record, only the fact that they are
    // running now. They get the year they first appear in the record — which
    // for all of them is this one — and are drawn as a separate track rather
    // than pretending to a history they cannot prove.
    const side = projects.map((p) => ({
      kind: "project" as const,
      label: p.name,
      detail: p.shape,
      when: "running now",
      start: nowYear - 0.55,
      end: nowYear,
      tags: p.tech.slice(0, 5),
    }));

    const all = [...rows, ...side];
    const from = Math.floor(Math.min(...all.map((r) => r.start)));
    const to = Math.ceil(nowYear);
    return { rows: all, from, to };
  }, [nowYear]);

  const shown = active ? rows.find((r) => r.label === active) : null;
  const span = to - from;
  const pct = (v: number) => ((v - from) / span) * 100;
  const years = Array.from({ length: span + 1 }, (_, i) => from + i);

  return (
    <div className="strata">
      <div className="strata-axis" aria-hidden="true">
        {years.map((y) => (
          <span key={y} className="strata-year" style={{ left: `${pct(y)}%` }}>{y}</span>
        ))}
      </div>

      <ol className="strata-rows">
        {rows.map((r) => (
          <li
            key={`${r.kind}-${r.label}`}
            className={`strata-row strata-row--${r.kind}${active === r.label ? " is-on" : ""}`}
            onPointerEnter={() => setActive(r.label)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="strata-label">
              <span className="strata-name">{r.label}</span>
              <span className="strata-detail">{r.detail}</span>
            </span>
            <span className="strata-track">
              {years.map((y) => (
                <span key={y} className="strata-tick" style={{ left: `${pct(y)}%` }} aria-hidden="true" />
              ))}
              {/* The bar carries no text. A two-month role is forty pixels
                  wide and anything inside it is an ellipsis; the tags belong
                  in the readout, where there is room to read them. */}
              <button
                type="button"
                className="strata-bar"
                style={{ left: `${pct(r.start)}%`, width: `${Math.max(pct(r.end) - pct(r.start), 1.2)}%` }}
                onFocus={() => setActive(r.label)}
                onBlur={() => setActive(null)}
                aria-label={`${r.label}, ${r.when}: ${r.tags.join(", ")}`}
              />
            </span>
          </li>
        ))}
      </ol>

      <div className="strata-read" aria-live="polite">
        {shown ? (
          <>
            <span className="strata-read-head">
              <strong>{shown.label}</strong>
              <span>{shown.when}</span>
            </span>
            <span className="strata-read-tags">
              {shown.tags.map((t) => <span key={t}>{t}</span>)}
            </span>
          </>
        ) : (
          <span className="strata-read-idle">
            {rows.length} tracks — hover one to see what it was built with
          </span>
        )}
      </div>

      <p className="strata-note">
        Every bar is a date from the record and every tag is a technology that
        role or project actually used — the same fields the CV reads. Nothing
        here rates anything; it says when I was being paid to use it, which is
        the version a stranger can check. The gaps are real too.
      </p>

      <div className="strata-legend">
        {skills.map((g) => (
          <span key={g.group} className="strata-chip">{g.group}</span>
        ))}
      </div>
    </div>
  );
}
