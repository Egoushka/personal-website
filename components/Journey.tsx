"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * The record on a time axis. The page computes every figure; this only draws
 * them and answers hover and focus, so nothing from lib/site.ts ships here.
 *
 * The bars are drawn in the server's HTML and need no JavaScript to be seen.
 * The draw-in is armed only after mount, and only when the chart is still
 * below the fold — a chart already on screen is not erased to be redrawn.
 */

export type JourneyRow = {
  label: string;
  detail: string;
  when: string;
  /** Percentages of the axis. */
  left: number;
  width: number;
  tags: string[];
  /** The CV chapter the role belongs to. */
  era?: string;
};

export type JourneyAxis = {
  years: { year: number; left: number }[];
  gaps: { left: number; width: number }[];
  now: number;
};

const pct = (v: number) => `${v}%`;
const at = (vars: Record<string, string | number>) => vars as React.CSSProperties;

export default function Journey({
  rows,
  axis,
  idle,
  children,
}: {
  rows: JourneyRow[];
  axis: JourneyAxis;
  /** The readout before anything is pointed at. */
  idle: string;
  /** The note under the chart, rendered on the server. */
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let first = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (first) {
          first = false;
          // Already in view: leave the bars as the server drew them.
          if (e.isIntersecting) return io.disconnect();
          setArmed(true);
          return;
        }
        if (e.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shown = active ? rows.find((r) => r.label === active) : null;

  return (
    <div className={`jr${armed ? " is-armed" : ""}${drawn ? " is-drawn" : ""}`} ref={ref}>
      <div className="jr-scale" aria-hidden="true">
        {axis.years.map((y) => (
          <span key={y.year} className="jr-year" style={at({ "--l": pct(y.left) })}>{y.year}</span>
        ))}
      </div>

      <div className="jr-field">
        {/* One grid, drawn once, behind everything. */}
        <div className="jr-grid" aria-hidden="true">
          {axis.years.map((y) => (
            <span key={y.year} className="jr-line" style={at({ "--l": pct(y.left) })} />
          ))}
          {axis.gaps.map((g) => (
            <span key={g.left} className="jr-gap" style={at({ "--l": pct(g.left), "--w": pct(g.width) })} />
          ))}
          <span className="jr-now" style={at({ "--l": pct(axis.now) })} />
        </div>

        <ol className="jr-rows">
          {rows.map((r, i) => {
            const geometry = at({ "--l": pct(r.left), "--w": pct(r.width), "--i": i });
            return (
              <li
                key={r.label}
                className={`jr-row${active === r.label ? " is-on" : ""}`}
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
                      prefetch={false}
                      href={`/cv/#${r.era}`}
                      className="jr-bar"
                      style={geometry}
                      onFocus={() => setActive(r.label)}
                      onBlur={() => setActive(null)}
                      aria-label={`${r.label}, ${r.when}. ${r.tags.join(", ")}. Read the chapter.`}
                    />
                  ) : (
                    <span className="jr-bar" style={geometry} />
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="jr-read">
        {shown ? (
          <>
            <span className="jr-read-head">
              <strong>{shown.label}</strong>
              <span>{shown.when}</span>
              {shown.era && <Link prefetch={false} href={`/cv/#${shown.era}`}>read the chapter</Link>}
            </span>
            <span className="jr-read-tags">
              {shown.tags.map((t) => <span key={t}>{t}</span>)}
            </span>
          </>
        ) : (
          <span className="jr-read-idle">{idle}</span>
        )}
      </div>

      {children}
    </div>
  );
}
