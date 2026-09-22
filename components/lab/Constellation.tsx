"use client";

import { useMemo, useState } from "react";
import { skills } from "@/lib/site";
import { useStatus } from "@/lib/status";

/**
 * IDEA ONE — a sky.
 *
 * The stack as a star chart: every skill a star, every group a constellation,
 * and lines drawn only inside a group so the shapes read as shapes. It is the
 * least literal of the three and the most atmospheric — the argument being
 * that a stack is something you navigate by, not a list you audit.
 *
 * Nothing is random. Stars sit on a golden-angle spiral inside their group's
 * wedge, which spreads them evenly without a simulation and puts them in the
 * same place on every load, including the server's.
 *
 * Brightness carries the one piece of live information: a language my Wakapi
 * measured this month burns hotter than one it did not.
 */

const W = 1600;
const H = 900;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

type Star = {
  name: string; group: string; now: string; wakatime?: string;
  x: number; y: number;
};

export default function Constellation() {
  const status = useStatus();
  const [active, setActive] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  const { stars, groups } = useMemo(() => {
    const stars: Star[] = [];
    const groups: { name: string; x: number; y: number }[] = [];

    skills.forEach((group, gi) => {
      // Each group owns a wedge of the sky and its stars spiral outward inside
      // it: even, deterministic, and it never clumps the way a scatter does.
      const base = (gi / skills.length) * Math.PI * 2 - Math.PI / 2;
      const cx = W / 2 + Math.cos(base) * 430;
      const cy = H / 2 + Math.sin(base) * 250;
      groups.push({ name: group.group, x: cx, y: cy });

      group.items.forEach((skill, si) => {
        const a = base + si * GOLDEN;
        const d = 40 + Math.sqrt(si + 1) * 54;
        stars.push({
          name: skill.short ?? skill.name,
          group: group.group,
          now: skill.now,
          wakatime: skill.wakatime,
          x: cx + Math.cos(a) * d,
          y: cy + Math.sin(a) * d * 0.62,
        });
      });
    });
    return { stars, groups };
  }, []);

  const shown = active ? stars.find((s) => s.name === active) : null;
  const lit = shown?.group;

  /** Brightness from the measurement, when there is one. */
  const heat = (s: Star) => {
    const row = s.wakatime
      ? status?.coding?.languages?.find((l) => l.name === s.wakatime)
      : undefined;
    return row ? Math.min(row.percent, 60) / 60 : 0;
  };

  return (
    <div
      className="sky"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPointer({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
      }}
    >
      {/* Two layers drifting at different rates with the pointer: the cheapest
          possible depth, and the only motion on the page. */}
      <div
        className="sky-haze"
        style={{ transform: `translate(${(pointer.x - 0.5) * -26}px, ${(pointer.y - 0.5) * -18}px)` }}
      />
      <svg
        className="sky-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Every skill as a star, grouped into constellations."
        style={{ transform: `translate(${(pointer.x - 0.5) * 14}px, ${(pointer.y - 0.5) * 9}px)` }}
      >
        {skills.map((group) => {
          const mine = stars.filter((s) => s.group === group.group);
          const d = mine.map((s, i) => `${i ? "L" : "M"}${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join(" ");
          return (
            <path
              key={`c-${group.group}`}
              className={`sky-line${lit === group.group ? " is-lit" : ""}`}
              d={d}
            />
          );
        })}

        {stars.map((s) => (
          <g
            key={s.name}
            className={`star${active === s.name ? " is-on" : ""}${lit && lit !== s.group ? " is-dim" : ""}`}
            transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`}
            tabIndex={0}
            role="button"
            aria-label={`${s.name}. ${s.now}`}
            onPointerEnter={() => setActive(s.name)}
            onFocus={() => setActive(s.name)}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
          >
            <circle className="star-glow" r={9 + heat(s) * 16} />
            <circle className="star-core" r={2.4 + heat(s) * 3.4} />
            <text x={11} y={4}>{s.name}</text>
          </g>
        ))}

        {groups.map((g) => (
          <text key={g.name} className="sky-group" x={g.x} y={g.y - 120} textAnchor="middle">
            {g.name}
          </text>
        ))}
      </svg>

      <div className="sky-read" aria-live="polite">
        {shown ? (
          <>
            <span className="sky-read-name">{shown.name}</span>
            <span className="sky-read-now">{shown.now}</span>
          </>
        ) : (
          <span className="sky-read-idle">
            {stars.length} of them, in {groups.length} constellations
          </span>
        )}
      </div>
    </div>
  );
}
