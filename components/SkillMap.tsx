"use client";

import { useMemo, useState } from "react";
import {
  GRAPH_VIEWBOX,
  neighboursOf,
  skillEdges,
  skillNodes,
  type SkillNode,
} from "@/lib/skills";
import type { StackItem } from "@/lib/site";

/**
 * The stack as a graph, plus a filter that drives the graph and the list below it.
 *
 * Why not a force simulation: it needs a physics dependency, settles differently
 * on every load, throws labels wherever it likes, and animates a layout thrash on
 * first paint. Positions in lib/skills.ts are authored, so this renders
 * identically every time and related things sit near each other on purpose. The
 * "floating" is a CSS transform on top of a fixed layout — motion without
 * pretending the arrangement is emergent.
 *
 * Selection: hover or focus a node to light up what it actually connects to.
 * Every edge carries a `why`, so the connection is a claim rather than decoration.
 */

type Props = { groups: { group: string; items: StackItem[] }[] };

export default function SkillMap({ groups }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const shown = pinned ?? active;
  const q = query.trim().toLowerCase();

  /**
   * The graph and the list are not the same set — Vaultwarden is in the list but
   * not the graph, Linux is in the graph but not the list. So a query can match
   * list items and no nodes. Returning null in that case leaves the graph
   * neutral: a fully greyed-out figure reads as broken rather than as "no match",
   * and the list underneath is already giving the real answer.
   */
  const matches = useMemo(() => {
    if (!q) return null;
    const hit = skillNodes.filter((n) => n.label.toLowerCase().includes(q));
    return hit.length ? new Set(hit.map((n) => n.id)) : null;
  }, [q]);

  const near = useMemo(
    () => (shown ? new Set([shown, ...neighboursOf(shown)]) : null),
    [shown],
  );

  const byId = useMemo(
    () => Object.fromEntries(skillNodes.map((n) => [n.id, n])) as Record<string, SkillNode>,
    [],
  );

  const dim = (id: string) =>
    (near && !near.has(id)) || (matches && !matches.has(id));

  const filteredGroups = groups
    .map((g) => ({
      group: g.group,
      items: q
        ? g.items.filter(
            (i) =>
              i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q),
          )
        : g.items,
    }))
    .filter((g) => g.items.length > 0);

  const totalShown = filteredGroups.reduce((n, g) => n + g.items.length, 0);
  const activeNode = shown ? byId[shown] : null;

  return (
    <>
      <div className="row skill-controls">
        <label className="rail rail--label" htmlFor="stack-filter">Filter</label>
        <div>
          <input
            id="stack-filter"
            type="search"
            className="control skill-filter"
            placeholder="postgres, caddy, typescript…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="skill-count" aria-live="polite">
            {q ? `${totalShown} of ${groups.reduce((n, g) => n + g.items.length, 0)}` : ""}
          </span>
        </div>
      </div>

      <div className="row">
        <div className="rail">
          <span className="rail--label">Fig. 01</span>
          <span>how it connects</span>
          {activeNode && (
            <span className="skill-note">
              <span className="skill-note-name">{activeNode.label}</span>
              {activeNode.note}
            </span>
          )}
        </div>

        <figure className="bleed-code skill-figure">
          <svg
            viewBox={`0 0 ${GRAPH_VIEWBOX.w} ${GRAPH_VIEWBOX.h}`}
            className="skill-svg"
            role="img"
            aria-labelledby="skillmap-title skillmap-desc"
          >
            <title id="skillmap-title">How the stack connects</title>
            <desc id="skillmap-desc">
              Fourteen tools and languages, joined where one actually depends on or
              is used through the other. A full text equivalent follows the figure.
            </desc>

            <g className="skill-edges">
              {skillEdges.map((e) => {
                const a = byId[e.from];
                const b = byId[e.to];
                const lit = shown ? e.from === shown || e.to === shown : false;
                const faded = dim(e.from) || dim(e.to);
                return (
                  <line
                    key={`${e.from}-${e.to}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    className={`skill-edge${lit ? " is-lit" : ""}${faded && !lit ? " is-dim" : ""}`}
                  />
                );
              })}
            </g>

            {skillNodes.map((n, i) => {
              const faded = dim(n.id);
              const isShown = shown === n.id;
              return (
                <g
                  key={n.id}
                  className={`skill-node${isShown ? " is-active" : ""}${faded ? " is-dim" : ""}`}
                  /* Deterministic per-node delay — Math.random() here would
                     differ between server and client and break hydration. */
                  style={{ animationDelay: `${(i % 7) * -1.9}s` }}
                  transform={`translate(${n.x} ${n.y})`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={pinned === n.id}
                  aria-label={`${n.label}. ${n.note} Connects to ${neighboursOf(n.id)
                    .map((id) => byId[id].label)
                    .join(", ")}.`}
                  onMouseEnter={() => setActive(n.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(n.id)}
                  onBlur={() => setActive(null)}
                  onClick={() => setPinned((p) => (p === n.id ? null : n.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPinned((p) => (p === n.id ? null : n.id));
                    }
                    if (e.key === "Escape") setPinned(null);
                  }}
                >
                  <circle r="6" className={`skill-dot skill-dot--${n.group}`} />
                  <text x="14" y="5" className="skill-label">{n.label}</text>
                </g>
              );
            })}
          </svg>

          {/*
            The graph is a picture of information, so the information exists in
            text too — not as a caption, as the actual adjacency list. This is
            what a screen reader, a text browser, and a printed page get.
          */}
          <ul className="visually-hidden">
            {skillNodes.map((n) => (
              <li key={n.id}>
                {n.label}: {n.note} Connects to{" "}
                {neighboursOf(n.id).map((id) => byId[id].label).join(", ")}.
              </li>
            ))}
          </ul>

          <figcaption>
            Lines mean one thing depends on, or is used through, the other — not
            that both are technologies. Hover a node to see what it touches.
            {pinned && " Click again to unpin."}
          </figcaption>
        </figure>
      </div>

      {filteredGroups.map((group) => (
        <section className="row uses-group" key={group.group}>
          <h2 className="rail rail--label" id={group.group.toLowerCase().replace(/\W+/g, "-")}>
            {group.group}
            <span className="rail-count">{group.items.length}</span>
          </h2>
          <dl className="uses-list">
            {group.items.map((item) => (
              <div className="uses-item" key={item.name}>
                <dt>{item.name}</dt>
                <dd>
                  {item.desc}
                  {item.href && (
                    <a
                      className="uses-link"
                      href={item.href}
                      rel="noopener"
                      aria-label={`${item.name} — official site`}
                    >
                      ↗
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {q && totalShown === 0 && (
        <p className="skill-empty">
          Nothing matches “{query}”. That is the honest answer — this list is what
          I actually use, not everything I have heard of.
        </p>
      )}
    </>
  );
}
