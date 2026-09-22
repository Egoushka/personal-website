"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { experience, projects, eras } from "@/lib/site";
import { topicName } from "@/lib/topics";

/**
 * The record on a time axis.
 *
 * Not the stack — how it was acquired. Every pixel is already backed: the dates
 * come from `experience[].when`, the technologies from `experience[].topics`
 * and `Project.tech`, which are the same fields the CV and the topic pages
 * read. Nothing here rates anything. It says when I was being paid to use
 * something, which is the only version of that claim a stranger can check.
 *
 * It is the one view that shows the **gaps**, and they are the point: two
 * months selling logistics, a summer with no employer, a freelance year with
 * no public artefact. A CV closes those by listing only the good parts; a
 * timeline cannot, which is why this is worth a page.
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
  return m ? Number(m[2]) + (MONTHS[m[1]] ?? 0) / 12 : now;
}

type Row = {
  kind: "role" | "project";
  label: string;
  detail: string;
  when: string;
  start: number;
  end: number;
  tags: string[];
  era?: string;
};

export default function Journey({ nowYear }: { nowYear: number }) {
  const [active, setActive] = useState<string | null>(null);
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const { rows, from, to, gaps } = useMemo(() => {
    const roles: Row[] = experience
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
          era: eras.find((e) => e.jobs.includes(job.company))?.slug,
        };
      })
      .sort((x, y) => x.start - y.start);

    // Projects have no start date on record — only that they are running now.
    // They get their own track rather than a history they cannot prove.
    const side: Row[] = projects.map((p) => ({
      kind: "project" as const,
      label: p.name,
      detail: p.shape,
      when: "running now",
      start: nowYear - 0.5,
      end: nowYear,
      tags: p.tech.slice(0, 6),
    }));

    // The stretches with no employer at all. These are computed from the same
    // dates rather than written down, so they cannot be quietly dropped.
    const gaps: { start: number; end: number }[] = [];
    let reach = roles[0]?.end ?? nowYear;
    for (const r of roles.slice(1)) {
      if (r.start > reach + 0.04) gaps.push({ start: reach, end: r.start });
      reach = Math.max(reach, r.end);
    }

    const all = [...roles, ...side];
    return {
      rows: all,
      from: Math.floor(Math.min(...all.map((r) => r.start))),
      to: Math.ceil(nowYear),
      gaps,
    };
  }, [nowYear]);

  // Draw the bars in once, on first sight, then never again. Under
  // `prefers-reduced-motion` they are simply there.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const span = to - from;
  const pct = (v: number) => ((v - from) / span) * 100;
  const years = Array.from({ length: span + 1 }, (_, i) => from + i);
  const shown = active ? rows.find((r) => r.label === active) : null;
  const paid = rows.filter((r) => r.kind === "role");
  const total = paid.reduce((n, r) => n + (r.end - r.start), 0);

  return (
    <div className={`jr${drawn ? " is-drawn" : ""}`} ref={ref}>
      <div className="jr-scale" aria-hidden="true">
        {years.map((y) => (
          <span key={y} className="jr-year" style={{ left: `${pct(y)}%` }}>{y}</span>
        ))}
      </div>

      <div className="jr-field">
        {/* One grid, drawn once, behind everything. */}
        <div className="jr-grid" aria-hidden="true">
          {years.map((y) => (
            <span key={y} className="jr-line" style={{ left: `${pct(y)}%` }} />
          ))}
          {gaps.map((g) => (
            <span
              key={g.start}
              className="jr-gap"
              style={{ left: `${pct(g.start)}%`, width: `${pct(g.end) - pct(g.start)}%` }}
            />
          ))}
          <span className="jr-now" style={{ left: `${pct(nowYear)}%` }} />
        </div>

        <ol className="jr-rows">
          {rows.map((r, i) => (
            <li
              key={`${r.kind}-${r.label}`}
              className={`jr-row jr-row--${r.kind}${active === r.label ? " is-on" : ""}`}
              onPointerEnter={() => setActive(r.label)}
              onPointerLeave={() => setActive(null)}
            >
              <span className="jr-label">
                <span className="jr-name">{r.label}</span>
                <span className="jr-detail">{r.detail}</span>
              </span>
              <span className="jr-track">
                {r.era ? (
                  <Link
                    href={`/cv/#${r.era}`}
                    className="jr-bar"
                    style={{
                      left: `${pct(r.start)}%`,
                      width: `${Math.max(pct(r.end) - pct(r.start), 1.2)}%`,
                      transitionDelay: `${i * 45}ms`,
                    }}
                    onFocus={() => setActive(r.label)}
                    onBlur={() => setActive(null)}
                    aria-label={`${r.label}, ${r.when}. Read the chapter.`}
                  />
                ) : (
                  <span
                    className="jr-bar"
                    style={{
                      left: `${pct(r.start)}%`,
                      width: `${Math.max(pct(r.end) - pct(r.start), 1.2)}%`,
                      transitionDelay: `${i * 45}ms`,
                    }}
                  />
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="jr-read" aria-live="polite">
        {shown ? (
          <>
            <span className="jr-read-head">
              <strong>{shown.label}</strong>
              <span>{shown.when}</span>
              {shown.era && <Link href={`/cv/#${shown.era}`}>read the chapter</Link>}
            </span>
            <span className="jr-read-tags">
              {shown.tags.map((t) => <span key={t}>{t}</span>)}
            </span>
          </>
        ) : (
          <span className="jr-read-idle">
            {paid.length} paid roles, {total.toFixed(1)} years of them, and the gaps in between
          </span>
        )}
      </div>

      <p className="jr-note">
        <Icon name="job" /> Every bar is a date from the record and every tag a
        technology that role actually used — the same fields the CV reads. The
        shaded stretches are months with no employer: two of them are a
        freelance year and a deliberate detour into sales, and they are on the
        page for the same reason the fifty-one days are.
      </p>
    </div>
  );
}
