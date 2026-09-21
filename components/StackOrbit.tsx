"use client";

import { useMemo, useState } from "react";
import { skills } from "@/lib/site";

/**
 * The stack as a radial tree — the prototype replacement for the force graph.
 *
 * The force layout was the wrong instrument. A simulation arranges nodes by
 * what does not collide, which is a physics answer to a design question: it
 * produces a different, slightly lopsided picture every time, and no amount of
 * tuning makes "wherever the springs stopped" look deliberate.
 *
 * This is laid out, not simulated. The centre is the whole stack, each group
 * owns an angular sector sized by how many skills are in it, and the skills sit
 * on one ring. Labels read outward and flip their anchor on the left half, which
 * is the standard radial-dendrogram treatment and the reason this looks drawn
 * rather than settled. Overlap is impossible by construction: 23 slots on a ring
 * of this radius is 80-odd pixels apiece.
 */

const W = 1000;
const H = 780;
const CX = W / 2;
const CY = H / 2;
const R_GROUP = 132;
const R_SKILL = 268;

type Placed = {
  name: string;
  now: string;
  group: string;
  angle: number;
  x: number;
  y: number;
};

export default function StackOrbit() {
  const [active, setActive] = useState<string | null>(null);

  const { groups, placed } = useMemo(() => {
    const total = skills.reduce((n, g) => n + g.items.length, 0);
    let cursor = -Math.PI / 2; // start at twelve o'clock
    const groups: { name: string; angle: number; x: number; y: number; span: number }[] = [];
    const placed: Placed[] = [];

    for (const group of skills) {
      const span = (group.items.length / total) * Math.PI * 2;
      const mid = cursor + span / 2;
      groups.push({
        name: group.group,
        angle: mid,
        x: CX + Math.cos(mid) * R_GROUP,
        y: CY + Math.sin(mid) * R_GROUP,
        span,
      });

      group.items.forEach((skill, i) => {
        // Inset by half a slot so the first and last leaf of a sector do not
        // touch the neighbouring sector's.
        const t = cursor + (span * (i + 0.5)) / group.items.length;
        placed.push({
          name: skill.short ?? skill.name,
          now: skill.now,
          group: group.group,
          angle: t,
          x: CX + Math.cos(t) * R_SKILL,
          y: CY + Math.sin(t) * R_SKILL,
        });
      });
      cursor += span;
    }
    return { groups, placed };
  }, []);

  /** A curve, not a spoke: the elbow sits between the two radii. */
  const link = (fromR: number, toR: number, a1: number, a2: number) => {
    const x1 = CX + Math.cos(a1) * fromR;
    const y1 = CY + Math.sin(a1) * fromR;
    const x2 = CX + Math.cos(a2) * toR;
    const y2 = CY + Math.sin(a2) * toR;
    const midR = (fromR + toR) / 2;
    const c1x = CX + Math.cos(a1) * midR;
    const c1y = CY + Math.sin(a1) * midR;
    const c2x = CX + Math.cos(a2) * midR;
    const c2y = CY + Math.sin(a2) * midR;
    return `M${x1} ${y1} C${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`;
  };

  const chosen = placed.find((p) => p.name === active);

  return (
    <figure className="orbit-figure">
      <svg className="orbit" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Every skill, grouped around the centre.">
        {groups.map((g) => (
          <path key={`gl-${g.name}`} className="orbit-link" d={link(28, R_GROUP, g.angle, g.angle)} />
        ))}
        {placed.map((p) => {
          const g = groups.find((x) => x.name === p.group)!;
          return (
            <path
              key={`sl-${p.name}`}
              className={`orbit-link${active === p.name ? " is-on" : ""}`}
              d={link(R_GROUP, R_SKILL, g.angle, p.angle)}
            />
          );
        })}

        <circle className="orbit-core" cx={CX} cy={CY} r={28} />
        <text className="orbit-core-label" x={CX} y={CY + 4} textAnchor="middle">23</text>

        {groups.map((g) => (
          <g key={g.name} transform={`translate(${g.x} ${g.y})`}>
            <circle className="orbit-hub" r={7} />
            <text className="orbit-hub-label" textAnchor="middle" y={-16}>{g.name}</text>
          </g>
        ))}

        {placed.map((p) => {
          const left = Math.cos(p.angle) < 0;
          return (
            <g
              key={p.name}
              transform={`translate(${p.x} ${p.y})`}
              className={`orbit-node${active === p.name ? " is-on" : ""}${active && active !== p.name ? " is-dim" : ""}`}
              tabIndex={0}
              role="button"
              aria-label={`${p.name}. ${p.now}`}
              onPointerEnter={() => setActive(p.name)}
              onFocus={() => setActive(p.name)}
              onPointerLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
            >
              <circle r={4} />
              <text x={left ? -12 : 12} y={4} textAnchor={left ? "end" : "start"}>{p.name}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>{chosen ? <><strong>{chosen.name}</strong> {chosen.now}</> : "Hover anything."}</figcaption>
    </figure>
  );
}
