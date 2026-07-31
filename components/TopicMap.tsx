"use client";

import { useMemo, useState } from "react";
import {
  GRAPH_VIEWBOX,
  graphTopics,
  neighboursOf,
  topicEdges,
  topicName,
} from "@/lib/topics";
import type { StackItem } from "@/lib/site";

/**
 * The stack as a graph, plus a filter that drives the graph and the list below it.
 *
 * Why not a force simulation: it needs a physics dependency, settles differently
 * on every load, throws labels wherever it likes, and animates a layout thrash on
 * first paint. Positions live on the topics in lib/topics.ts, so this renders
 * identically every time and related things sit near each other on purpose. The
 * "floating" is CSS on top of a fixed layout — motion without pretending the
 * arrangement is emergent.
 *
 * Selection: hover or focus a node to light up what it actually connects to.
 * Every edge carries a `why`, so a connection is a claim rather than decoration.
 */

type Props = { groups: { group: string; items: StackItem[] }[] };

export default function TopicMap({ groups }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const nodes = useMemo(() => graphTopics(), []);
  const byId = useMemo(
    () => Object.fromEntries(nodes.map((t) => [t.slug, t])),
    [nodes],
  );

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
    const hit = nodes.filter((t) => t.name.toLowerCase().includes(q));
    return hit.length ? new Set(hit.map((t) => t.slug as string)) : null;
  }, [q, nodes]);

  const near = useMemo(
    () => (shown ? new Set<string>([shown, ...neighboursOf(shown)]) : null),
    [shown],
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
      <div className="row graph-controls">
        <label className="rail rail--label" htmlFor="stack-filter">Filter</label>
        <div>
          <input
            id="stack-filter"
            type="search"
            className="control graph-filter"
            placeholder="postgres, caddy, typescript…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="graph-count" aria-live="polite">
            {q ? `${totalShown} of ${groups.reduce((n, g) => n + g.items.length, 0)}` : ""}
          </span>
        </div>
      </div>

      <div className="row">
        <div className="rail">
          <span className="rail--label">Fig. 01</span>
          <span>how it connects</span>
          {activeNode && (
            <span className="graph-note">
              <span className="graph-note-name">{activeNode.name}</span>
              {activeNode.blurb}
            </span>
          )}
        </div>

        <figure className="bleed-code graph-figure">
          <svg
            viewBox={`0 0 ${GRAPH_VIEWBOX.w} ${GRAPH_VIEWBOX.h}`}
            className="graph-svg"
            role="img"
            aria-labelledby="topicmap-title topicmap-desc"
          >
            <title id="topicmap-title">How the stack connects</title>
            <desc id="topicmap-desc">
              {nodes.length} tools and languages, joined where one actually depends
              on or is used through the other. A full text equivalent follows the
              figure.
            </desc>

            <g className="graph-edges">
              {topicEdges.map((e) => {
                const a = byId[e.from];
                const b = byId[e.to];
                if (!a || !b) return null;
                const lit = shown ? e.from === shown || e.to === shown : false;
                const faded = dim(e.from) || dim(e.to);
                return (
                  <line
                    key={`${e.from}-${e.to}`}
                    x1={a.graph.x} y1={a.graph.y} x2={b.graph.x} y2={b.graph.y}
                    className={`graph-edge${lit ? " is-lit" : ""}${faded && !lit ? " is-dim" : ""}`}
                  />
                );
              })}
            </g>

            {nodes.map((t, i) => {
              const faded = dim(t.slug);
              const isShown = shown === t.slug;
              return (
                <g
                  key={t.slug}
                  className={`graph-node${isShown ? " is-active" : ""}${faded ? " is-dim" : ""}`}
                  /* Deterministic per-node delay — Math.random() here would
                     differ between server and client and break hydration. */
                  style={{ animationDelay: `${(i % 7) * -1.9}s` }}
                  transform={`translate(${t.graph.x} ${t.graph.y})`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={pinned === t.slug}
                  aria-label={`${t.name}. ${t.blurb} Connects to ${neighboursOf(t.slug)
                    .map((id) => topicName(id))
                    .join(", ")}.`}
                  onMouseEnter={() => setActive(t.slug)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(t.slug)}
                  onBlur={() => setActive(null)}
                  onClick={() => setPinned((p) => (p === t.slug ? null : t.slug))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPinned((p) => (p === t.slug ? null : t.slug));
                    }
                    if (e.key === "Escape") setPinned(null);
                  }}
                >
                  <circle r="6" className="graph-dot" />
                  <text x="14" y="5" className="graph-label">{t.name}</text>
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
            {nodes.map((t) => (
              <li key={t.slug}>
                {t.name}: {t.blurb} Connects to{" "}
                {neighboursOf(t.slug).map((id) => topicName(id)).join(", ")}.
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
          <h3 className="rail rail--label" id={group.group.toLowerCase().replace(/\W+/g, "-")}>
            {group.group}
            <span className="rail-count">{group.items.length}</span>
          </h3>
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
        <p className="graph-empty">
          Nothing matches “{query}”. That&apos;s the honest answer — this list is
          what I actually use, not everything I&apos;ve heard of.
        </p>
      )}
    </>
  );
}
