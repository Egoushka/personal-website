"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { skills, type Skill } from "@/lib/site";
import { topicEdges, topicName } from "@/lib/topics";

/**
 * The stack, as something you can pull apart.
 *
 * The old figure was a fixed layout with a CSS float on top — honest, and about
 * the size of a postage stamp. This is the same claim at the size it deserves:
 * every skill is a node, every group is a hub, and the edges between
 * technologies are the ones from lib/topics.ts, each of which had to assert
 * something checkable before it was allowed in ("EF Core is how the domain
 * reaches the database", not "both of these are backend words").
 *
 * ── Why the physics is written out by hand ──────────────────────────────────
 * d3-force is fifty kilobytes and this is four lines of vector maths: springs
 * along the edges, repulsion between every pair, a little gravity toward the
 * middle, and damping. Twenty-four nodes is under three hundred pairs a frame,
 * which is nothing. The site ships no runtime libraries and this was not the
 * thing to break that for.
 *
 * ── What keeps it honest ────────────────────────────────────────────────────
 * - **Seed positions are deterministic** (trigonometry on the index, never
 *   `Math.random`), so the server-rendered SVG and the first client frame are
 *   identical and hydration has nothing to disagree about.
 * - **That seed layout IS the no-JavaScript version.** It renders as a readable
 *   diagram before any of this runs, and the list underneath is the real
 *   content either way.
 * - **`prefers-reduced-motion` turns the simulation off entirely.** No drift,
 *   no throw, no bounce; dragging still moves a node, it just goes where you
 *   put it.
 * - Positions are written straight to the DOM through refs. Re-rendering
 *   twenty-four React subtrees sixty times a second to move some circles is
 *   how a toy becomes a fan.
 */

const VIEW = { w: 1000, h: 620 } as const;
const PAD = 46;

type Node = {
  id: string;
  label: string;
  kind: "hub" | "skill";
  group: string;
  now?: string;
  topic?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seed position, so Escape can put everything back. */
  hx: number;
  hy: number;
};

/** Hubs on an ellipse, their skills on a smaller ring around them. No randomness. */
function seed(): { nodes: Node[]; edges: [string, string, string][] } {
  const nodes: Node[] = [];
  const edges: [string, string, string][] = [];
  const cx = VIEW.w / 2;
  const cy = VIEW.h / 2;

  skills.forEach((group, gi) => {
    const a = (gi / skills.length) * Math.PI * 2 - Math.PI / 2;
    const hx = cx + Math.cos(a) * 300;
    const hy = cy + Math.sin(a) * 200;
    nodes.push({
      id: `hub:${group.group}`, label: group.group, kind: "hub", group: group.group,
      x: hx, y: hy, vx: 0, vy: 0, hx, hy,
    });

    group.items.forEach((skill: Skill, si) => {
      const spread = (si - (group.items.length - 1) / 2) * 0.55;
      const sx = hx + Math.cos(a + spread) * 128;
      const sy = hy + Math.sin(a + spread) * 128;
      nodes.push({
        id: skill.name, label: skill.name, kind: "skill", group: group.group,
        now: skill.now, topic: skill.topic,
        x: sx, y: sy, vx: 0, vy: 0, hx: sx, hy: sy,
      });
      edges.push([`hub:${group.group}`, skill.name, `${skill.name} is part of how I do ${group.group.toLowerCase()}`]);
    });
  });

  // The claims. A topic edge only becomes a line if both ends are skills I present.
  const byTopic = new Map(nodes.filter((n) => n.topic).map((n) => [n.topic!, n.id]));
  for (const e of topicEdges) {
    const from = byTopic.get(e.from);
    const to = byTopic.get(e.to);
    if (from && to) edges.push([from, to, e.why]);
  }
  return { nodes, edges };
}

export default function StackPlayground() {
  const { nodes: seeded, edges } = useMemo(seed, []);
  const nodes = useRef<Node[]>(seeded.map((n) => ({ ...n })));
  const groupRefs = useRef<Record<string, SVGGElement | null>>({});
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const dragging = useRef<{ id: string; px: number; py: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const byId = useMemo(() => new Map(seeded.map((n) => [n.id, n])), [seeded]);
  const neighbours = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const [a, b] of edges) {
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a)!.add(b);
      m.get(b)!.add(a);
    }
    return m;
  }, [edges]);

  /** Screen pixels to viewBox units, so a drag tracks the pointer at any size. */
  const toView = useCallback((clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: ((clientX - r.left) / r.width) * VIEW.w, y: ((clientY - r.top) / r.height) * VIEW.h };
  }, []);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function paint() {
      for (const n of nodes.current) {
        const g = groupRefs.current[n.id];
        if (g) g.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
      }
      edges.forEach(([a, b], i) => {
        const line = lineRefs.current[i];
        const na = nodes.current.find((n) => n.id === a);
        const nb = nodes.current.find((n) => n.id === b);
        if (!line || !na || !nb) return;
        line.setAttribute("x1", na.x.toFixed(1));
        line.setAttribute("y1", na.y.toFixed(1));
        line.setAttribute("x2", nb.x.toFixed(1));
        line.setAttribute("y2", nb.y.toFixed(1));
      });
    }

    function step() {
      const list = nodes.current;

      // Repulsion: every pair pushes apart, harder the closer they are.
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) { dx = 0.5; dy = 0.5; d2 = 1; }
          const force = 2600 / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * force;
          const fy = (dy / d) * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }

      // Springs along the edges, and a little gravity so nothing drifts away.
      for (const [aId, bId] of edges) {
        const a = list.find((n) => n.id === aId);
        const b = list.find((n) => n.id === bId);
        if (!a || !b) continue;
        const rest = a.kind === "hub" || b.kind === "hub" ? 120 : 190;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const k = (d - rest) * 0.012;
        const fx = (dx / d) * k;
        const fy = (dy / d) * k;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }

      for (const n of list) {
        n.vx += (VIEW.w / 2 - n.x) * 0.0016;
        n.vy += (VIEW.h / 2 - n.y) * 0.0016;
        n.vx *= 0.86;
        n.vy *= 0.86;

        if (dragging.current?.id === n.id) continue;
        n.x += n.vx;
        n.y += n.vy;

        // Walls, with a little bounce.
        if (n.x < PAD) { n.x = PAD; n.vx = Math.abs(n.vx) * 0.6; }
        if (n.x > VIEW.w - PAD) { n.x = VIEW.w - PAD; n.vx = -Math.abs(n.vx) * 0.6; }
        if (n.y < PAD) { n.y = PAD; n.vy = Math.abs(n.vy) * 0.6; }
        if (n.y > VIEW.h - PAD) { n.y = VIEW.h - PAD; n.vy = -Math.abs(n.vy) * 0.6; }
      }

      paint();
      frame = requestAnimationFrame(step);
    }

    if (calm.matches) {
      paint();
      return;
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [edges]);

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toView(e.clientX, e.clientY);
    dragging.current = { id, px: p.x, py: p.y };
    setSelected(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragging.current;
    if (!drag) return;
    const p = toView(e.clientX, e.clientY);
    const n = nodes.current.find((x) => x.id === drag.id);
    if (!n) return;
    // Throwing it: the velocity it leaves with is the velocity you gave it.
    n.vx = p.x - drag.px;
    n.vy = p.y - drag.py;
    n.x = p.x;
    n.y = p.y;
    drag.px = p.x;
    drag.py = p.y;
    const g = groupRefs.current[n.id];
    if (g) g.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
  };

  const onPointerUp = () => { dragging.current = null; };

  /** Arrow keys move the focused node, so this is not a mouse-only toy. */
  const onKeyDown = (id: string) => (e: React.KeyboardEvent) => {
    const n = nodes.current.find((x) => x.id === id);
    if (!n) return;
    const step = e.shiftKey ? 24 : 8;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      n.x += moves[e.key][0];
      n.y += moves[e.key][1];
      setSelected(id);
    }
    if (e.key === "Escape") {
      for (const m of nodes.current) { m.x = m.hx; m.y = m.hy; m.vx = 0; m.vy = 0; }
      setSelected(null);
    }
  };

  const lit = selected ? neighbours.get(selected) ?? new Set<string>() : null;
  const chosen = selected ? byId.get(selected) : null;

  return (
    <>
      <figure className="play-figure">
        <svg
          ref={svgRef}
          className="play"
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          role="img"
          aria-label="Every skill as a node, joined to the group it belongs to and to the technologies it actually touches. Drag a node to move it."
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {edges.map(([a, b, why], i) => (
            <line
              key={`${a}-${b}-${i}`}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={`play-edge${selected && (a === selected || b === selected) ? " is-lit" : ""}`}
              x1={byId.get(a)?.x} y1={byId.get(a)?.y}
              x2={byId.get(b)?.x} y2={byId.get(b)?.y}
            >
              <title>{why}</title>
            </line>
          ))}

          {seeded.map((n) => (
            <g
              key={n.id}
              ref={(el) => { groupRefs.current[n.id] = el; }}
              className={[
                "play-node",
                n.kind === "hub" ? "play-node--hub" : "",
                selected === n.id ? "is-on" : "",
                lit && lit.has(n.id) ? "is-lit" : "",
                selected && selected !== n.id && !lit?.has(n.id) ? "is-dim" : "",
              ].filter(Boolean).join(" ")}
              transform={`translate(${n.x} ${n.y})`}
              role="button"
              tabIndex={0}
              aria-label={n.kind === "hub" ? `${n.label}, a group` : `${n.label}. ${n.now ?? ""}`}
              onPointerDown={onPointerDown(n.id)}
              onFocus={() => setSelected(n.id)}
              onKeyDown={onKeyDown(n.id)}
            >
              <circle r={n.kind === "hub" ? 9 : 5} />
              <text x={n.kind === "hub" ? 16 : 11} y="4">{n.label}</text>
            </g>
          ))}
        </svg>

        <figcaption>
          {chosen ? (
            <>
              <strong>{chosen.label}</strong> {chosen.now}
              {chosen.topic && (
                <> <Link href={`/topics/${chosen.topic}/`}>everything about it</Link></>
              )}
            </>
          ) : (
            "Drag a node and the rest follows it. Arrow keys move whatever is focused; Escape puts it all back."
          )}
        </figcaption>
      </figure>

      {/*
        The text equivalent, and the real content. Everything above is a way of
        looking at this list; the list is what survives with no JavaScript, no
        pointer, and a screen reader.
      */}
      <div className="play-list">
        {skills.map((group) => (
          <section className="row" key={group.group}>
            <span className="rail rail--label">{group.group}</span>
            <dl className="uses-list">
              {group.items.map((skill) => (
                <div className="uses-item" key={skill.name}>
                  <dt>{skill.name}</dt>
                  <dd>{skill.now}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
