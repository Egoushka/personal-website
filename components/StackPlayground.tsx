"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { skills, type Skill } from "@/lib/site";
import { topicEdges } from "@/lib/topics";
import { useStatus } from "@/lib/status";

/**
 * The stack, as something you can pull apart.
 *
 * ── What the first version got wrong, and why ───────────────────────────────
 *
 * **It animated itself into place on every load.** A graph that visibly swims
 * around while you are trying to read it is an animation nobody asked for. The
 * layout is solved now *before the first paint* — `settle()` runs the physics
 * silently — and motion happens only when the reader touches something.
 *
 * **It separated circles, not labels.** A 5px dot with a 105px label attached
 * is a 105px object, and the label hangs to the *right* of the dot, so the box
 * is not even centred on the coordinates. Both are modelled now (`ox`, `hw`),
 * and the widths are **measured from the DOM** rather than guessed —
 * `label.length * 6.5` was short by 10–25%, which stays invisible until two
 * long labels are "separated" by a solver working from boxes smaller than the
 * text inside them.
 *
 * **Separation was a force, so the springs argued with it.** Two labels could
 * sit on top of each other in a stable equilibrium where the spring pulled
 * exactly as hard as the separation pushed. It is a positional projection now,
 * applied after integration: it does not negotiate.
 *
 * **`prefers-reduced-motion` disabled the layout, not just the motion.** That
 * setting asks for less movement; it does not ask for a worse arrangement. The
 * world is still solved — in one silent pass — so those readers get the same
 * graph and simply never watch it travel. This matters more than it sounds:
 * the same still layout is what the server renders and what anyone without
 * JavaScript sees, so it has to be good on its own.
 *
 * The physics is thirty lines rather than fifty kilobytes of d3, and the seed
 * positions are trigonometry on the index — never `Math.random` — so the
 * server HTML and the first client frame agree.
 */

const VIEW = { w: 1100, h: 760 } as const;
const PAD = 30;
/** Below this total energy nothing is moving usefully. */
const SLEEP = 0.04;
/** Only a seed: the real widths are measured from the DOM on mount. */
const CHAR = 6.5;

type Node = {
  id: string;
  label: string;
  kind: "hub" | "skill";
  group: string;
  now?: string;
  topic?: string;
  wakatime?: string;
  r: number;
  /** Offset from the dot to the middle of the label box. */
  ox: number;
  /** Half the width, and half the height, of that box. */
  hw: number;
  hh: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  seedX: number;
  seedY: number;
};

function build(): { nodes: Node[]; edges: [string, string, string][] } {
  const nodes: Node[] = [];
  const edges: [string, string, string][] = [];
  const cx = VIEW.w / 2;
  const cy = VIEW.h / 2;

  skills.forEach((group, gi) => {
    const a = (gi / skills.length) * Math.PI * 2 - Math.PI / 2;
    const hx = cx + Math.cos(a) * 250;
    const hy = cy + Math.sin(a) * 175;
    const hubW = group.group.length * 7.4;
    const hub: Node = {
      id: `hub:${group.group}`, label: group.group, kind: "hub", group: group.group,
      r: 10, ox: (7 + hubW) / 2, hw: 10 + (7 + hubW) / 2, hh: 11,
      x: hx, y: hy, vx: 0, vy: 0, seedX: hx, seedY: hy,
    };
    nodes.push(hub);

    group.items.forEach((skill: Skill, si) => {
      // A full ring around the hub, not a fan: a fan throws every label the
      // same way and they queue up on top of each other.
      const t = a + (si / group.items.length) * Math.PI * 2;
      const sx = hx + Math.cos(t) * 100;
      const sy = hy + Math.sin(t) * 100;
      const label = skill.short ?? skill.name;
      nodes.push({
        id: skill.name, label, kind: "skill", group: group.group,
        now: skill.now, topic: skill.topic, wakatime: skill.wakatime,
        r: 5, ox: (7 + label.length * CHAR) / 2, hw: 5 + (7 + label.length * CHAR) / 2, hh: 10,
        x: sx, y: sy, vx: 0, vy: 0, seedX: sx, seedY: sy,
      });
      edges.push([hub.id, skill.name, `${skill.name} is part of how I do ${group.group.toLowerCase()}`]);
    });
  });

  const byTopic = new Map(nodes.filter((n) => n.topic).map((n) => [n.topic!, n.id]));
  for (const e of topicEdges) {
    const from = byTopic.get(e.from);
    const to = byTopic.get(e.to);
    if (from && to) edges.push([from, to, e.why]);
  }
  return { nodes, edges };
}

export default function StackPlayground() {
  const { nodes: seeded, edges } = useMemo(build, []);
  const status = useStatus();

  const live = useRef<Node[]>(seeded.map((n) => ({ ...n })));
  const gRefs = useRef<Record<string, SVGGElement | null>>({});
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ id: string; x: number; y: number } | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef(0);
  const running = useRef(false);

  const [selected, setSelected] = useState<string | null>(null);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const closedRef = useRef(closed);
  closedRef.current = closed;

  const byId = useMemo(() => new Map(seeded.map((n) => [n.id, n])), [seeded]);
  const neighbours = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const [a, b] of edges) {
      (m.get(a) ?? m.set(a, new Set()).get(a)!).add(b);
      (m.get(b) ?? m.set(b, new Set()).get(b)!).add(a);
    }
    return m;
  }, [edges]);

  const hidden = useCallback(
    (n: Node) => n.kind === "skill" && closedRef.current.has(n.group),
    [],
  );

  const toView = useCallback((cx: number, cy: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: ((cx - r.left) / r.width) * VIEW.w, y: ((cy - r.top) / r.height) * VIEW.h };
  }, []);

  const paint = useCallback(() => {
    for (const n of live.current) {
      const g = gRefs.current[n.id];
      if (!g) continue;
      g.setAttribute("transform", `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`);
      g.style.opacity = hidden(n) ? "0" : "1";
      g.style.pointerEvents = hidden(n) ? "none" : "auto";
    }
    edges.forEach(([a, b], i) => {
      const el = lineRefs.current[i];
      if (!el) return;
      const na = live.current.find((n) => n.id === a);
      const nb = live.current.find((n) => n.id === b);
      if (!na || !nb) return;
      el.setAttribute("x1", na.x.toFixed(1));
      el.setAttribute("y1", na.y.toFixed(1));
      el.setAttribute("x2", nb.x.toFixed(1));
      el.setAttribute("y2", nb.y.toFixed(1));
      el.style.opacity = hidden(na) || hidden(nb) ? "0" : "";
    });
  }, [edges, hidden]);

  /** One step of the world. Returns what a caller needs to decide to stop. */
  const step = useCallback(() => {
    const all = live.current;
    const list = all.filter((n) => !hidden(n));

    // A soft, general repulsion so the clusters do not fuse into one blob.
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy || 1;
        if (d2 < 90000) {
          const f = 1200 / d2;
          const d = Math.sqrt(d2);
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }
    }

    for (const [aId, bId] of edges) {
      const a = all.find((n) => n.id === aId);
      const b = all.find((n) => n.id === bId);
      if (!a || !b || hidden(a) || hidden(b)) continue;
      const rest = a.kind === "hub" || b.kind === "hub" ? 118 : 200;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const k = (d - rest) * 0.014;
      a.vx += (dx / d) * k; a.vy += (dy / d) * k;
      b.vx -= (dx / d) * k; b.vy -= (dy / d) * k;
    }

    let energy = 0;
    for (const n of list) {
      n.vx += (VIEW.w / 2 - n.x) * 0.0022;
      n.vy += (VIEW.h / 2 - n.y) * 0.0022;

      // The cursor shoulders nodes aside. This is why the page feels alive
      // without anything animating on its own.
      const p = pointer.current;
      if (p && drag.current?.id !== n.id) {
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 13000 && d2 > 1) {
          const f = 900 / d2;
          const d = Math.sqrt(d2);
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
      }

      n.vx *= 0.84;
      n.vy *= 0.84;
      if (drag.current?.id !== n.id) {
        n.x += n.vx;
        n.y += n.vy;
      }

      // Walls, measured on the label box so a long name cannot run off.
      const left = n.x + n.ox - n.hw;
      const right = n.x + n.ox + n.hw;
      if (left < PAD) { n.x += PAD - left; n.vx = Math.abs(n.vx) * 0.5; }
      if (right > VIEW.w - PAD) { n.x -= right - (VIEW.w - PAD); n.vx = -Math.abs(n.vx) * 0.5; }
      if (n.y < PAD) { n.y = PAD; n.vy = Math.abs(n.vy) * 0.5; }
      if (n.y > VIEW.h - PAD) { n.y = VIEW.h - PAD; n.vy = -Math.abs(n.vy) * 0.5; }

      energy += n.vx * n.vx + n.vy * n.vy;
    }

    // Label separation, as a projection rather than a force. Eight passes is
    // enough for a chain of long labels, and the velocity along the corrected
    // axis is killed so the springs cannot restore the overlap next frame.
    let overlaps = 0;
    for (let pass = 0; pass < 8; pass++) {
      overlaps = 0;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          const dx = (b.x + b.ox) - (a.x + a.ox);
          const dy = b.y - a.y;
          const gapX = a.hw + b.hw + 12 - Math.abs(dx);
          const gapY = a.hh + b.hh + 6 - Math.abs(dy);
          if (gapX <= 0 || gapY <= 0) continue;
          overlaps++;
          const aPinned = drag.current?.id === a.id;
          const bPinned = drag.current?.id === b.id;
          if (aPinned && bPinned) continue;
          // Vertical is nearly always the cheaper way out: a line of type is
          // wide and short, so a few pixels up or down clears what would take
          // a hundred sideways.
          if (gapY * 3 < gapX) {
            const shift = gapY * (dy < 0 ? -0.5 : 0.5);
            if (!aPinned) a.y -= bPinned ? shift * 2 : shift;
            if (!bPinned) b.y += aPinned ? shift * 2 : shift;
            a.vy *= 0.2; b.vy *= 0.2;
          } else {
            const shift = gapX * (dx < 0 ? -0.5 : 0.5);
            if (!aPinned) a.x -= bPinned ? shift * 2 : shift;
            if (!bPinned) b.x += aPinned ? shift * 2 : shift;
            a.vx *= 0.2; b.vx *= 0.2;
          }
        }
      }
      if (!overlaps) break;
    }

    return { energy, overlaps };
  }, [edges, hidden]);

  /** Put the layout in its final place without showing the journey. */
  const settle = useCallback((iterations: number) => {
    for (let i = 0; i < iterations; i++) {
      const { energy, overlaps } = step();
      if (energy < SLEEP && overlaps === 0) break;
    }
    paint();
  }, [step, paint]);

  /** Motion, and only on interaction. */
  const wake = useCallback(() => {
    if (running.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settle(40);
      return;
    }
    running.current = true;
    let frames = 0;

    const tick = () => {
      const { energy, overlaps } = step();
      paint();
      frames++;
      // The backstop: a layout that cannot fully untangle itself must still
      // come to rest rather than argue with itself forever.
      if ((energy < SLEEP && overlaps === 0 && !drag.current && !pointer.current) || frames > 900) {
        running.current = false;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [step, paint, settle]);

  /*
    Measure the labels from the DOM, then solve the layout — both before the
    reader has finished reading the heading. `getComputedTextLength()` returns
    user units, which is what the simulation works in, so no scaling is needed.
  */
  useEffect(() => {
    for (const n of live.current) {
      const text = gRefs.current[n.id]?.querySelector("text") as SVGTextContentElement | null;
      if (!text) continue;
      const w = text.getComputedTextLength();
      if (!w) continue;
      n.ox = (7 + w) / 2;
      n.hw = n.r + (7 + w) / 2;
      const box = text.getBBox?.();
      if (box?.height) n.hh = box.height / 2 + 1;
    }
    settle(400);
    return () => cancelAnimationFrame(raf.current);
  }, [settle]);

  // Sizes follow the measurement when there is one: on a month of nothing but
  // C#, C# is visibly the biggest node on the page.
  useEffect(() => {
    const langs = status?.coding?.languages;
    if (!langs) return;
    for (const n of live.current) {
      const row = n.wakatime ? langs.find((l) => l.name === n.wakatime) : undefined;
      if (!row) continue;
      const grown = 5 + Math.min(row.percent, 60) * 0.18;
      n.hw += grown - n.r;
      n.r = grown;
      const g = gRefs.current[n.id];
      g?.querySelector("circle")?.setAttribute("r", String(grown));
      g?.querySelector("text")?.setAttribute("x", String(grown + 7));
    }
    settle(120);
  }, [status, settle]);

  const onMove = (e: React.PointerEvent) => {
    const p = toView(e.clientX, e.clientY);
    pointer.current = p;
    const d = drag.current;
    if (d) {
      const n = live.current.find((x) => x.id === d.id);
      if (n) {
        n.vx = p.x - d.x;
        n.vy = p.y - d.y;
        n.x = p.x;
        n.y = p.y;
        d.x = p.x;
        d.y = p.y;
      }
    }
    wake();
  };

  const stopDrag = () => { drag.current = null; wake(); };
  const leave = () => { pointer.current = null; drag.current = null; wake(); };

  const onDown = (id: string) => (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toView(e.clientX, e.clientY);
    drag.current = { id, x: p.x, y: p.y };
    setSelected(id);
    wake();
  };

  /** A hub folds its skills away, and lets them back out where they were. */
  const toggle = (node: Node | undefined) => {
    if (!node || node.kind !== "hub") return;
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(node.group)) {
        next.delete(node.group);
        for (const n of live.current) {
          if (n.kind === "skill" && n.group === node.group) {
            n.x = node.x + (n.seedX - node.seedX);
            n.y = node.y + (n.seedY - node.seedY);
            n.vx = 0; n.vy = 0;
          }
        }
      } else {
        next.add(node.group);
      }
      return next;
    });
    requestAnimationFrame(() => settle(120));
  };

  const onKey = (id: string) => (e: React.KeyboardEvent) => {
    const node = live.current.find((x) => x.id === id);
    if (!node) return;
    const dist = e.shiftKey ? 30 : 10;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-dist, 0], ArrowRight: [dist, 0], ArrowUp: [0, -dist], ArrowDown: [0, dist],
    };
    if (moves[e.key]) {
      e.preventDefault();
      node.x += moves[e.key][0];
      node.y += moves[e.key][1];
      setSelected(id);
      paint();
      wake();
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(node);
    }
    if (e.key === "Escape") {
      for (const m of live.current) { m.x = m.seedX; m.y = m.seedY; m.vx = 0; m.vy = 0; }
      setClosed(new Set());
      setSelected(null);
      settle(400);
    }
  };

  const lit = selected ? neighbours.get(selected) ?? new Set<string>() : null;
  const chosen = selected ? byId.get(selected) : null;
  const measured = chosen?.wakatime
    ? status?.coding?.languages?.find((l) => l.name === chosen.wakatime)
    : undefined;

  return (
    <>
      <figure className="play-figure">
        <svg
          ref={svgRef}
          className="play"
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          role="img"
          aria-label="Every skill as a node, joined to its group and to the technologies it actually touches. Drag a node to move it; click a group to fold it away."
          onPointerMove={onMove}
          onPointerUp={stopDrag}
          onPointerLeave={leave}
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
              ref={(el) => { gRefs.current[n.id] = el; }}
              className={[
                "play-node",
                n.kind === "hub" ? "play-node--hub" : "",
                closed.has(n.group) && n.kind === "hub" ? "is-closed" : "",
                selected === n.id ? "is-on" : "",
                lit?.has(n.id) ? "is-lit" : "",
                selected && selected !== n.id && !lit?.has(n.id) ? "is-dim" : "",
              ].filter(Boolean).join(" ")}
              transform={`translate(${n.x} ${n.y})`}
              role="button"
              tabIndex={0}
              aria-label={
                n.kind === "hub"
                  ? `${n.label}, a group of skills. Press Enter to fold it away.`
                  : `${n.label}. ${n.now ?? ""}`
              }
              onPointerDown={onDown(n.id)}
              onClick={() => toggle(live.current.find((x) => x.id === n.id))}
              onFocus={() => setSelected(n.id)}
              onKeyDown={onKey(n.id)}
            >
              <circle r={n.r} />
              <text x={n.r + 7} y="4">{n.label}</text>
            </g>
          ))}
        </svg>

        <figcaption>
          {chosen ? (
            <>
              <strong>{chosen.label}</strong>
              {chosen.kind === "hub" ? (
                <> — {closed.has(chosen.group) ? "folded away. Click it again to let it out." : "click to fold this group away."}</>
              ) : (
                <>
                  {" "}{chosen.now}
                  {measured && <> <span className="measured">{measured.percent}% of my last 30 days</span></>}
                  {chosen.topic && <> <Link href={`/topics/${chosen.topic}/`}>everything about it</Link></>}
                </>
              )}
            </>
          ) : (
            "Drag a node and the rest follows. The cursor pushes things aside; a group folds away when you click it. Arrow keys move whatever is focused, Enter folds, Escape puts it all back."
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
