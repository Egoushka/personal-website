import { chartTable, edgeList, loneNodes, sourceLink } from "@/lib/figures.mjs";
import type { Chart, Diagram } from "@/lib/figures.mjs";
import type { ChartGeometry, DiagramGeometry, PlacedNode } from "@/lib/figure-layout";

/**
 * A chart or a diagram in a post (ADR 0010), drawn as finished SVG on the
 * server: with JavaScript off it is all here, in its final state. The island
 * (components/FigureEnhancements.tsx) reads the `data-*` attributes and class
 * names written below to animate it in, answer hover and focus, and toggle
 * series; it imports none of this. Geometry arrives from lib/figure-layout.ts.
 */

export type PreparedFigure =
  | { lang: "chart"; chart: Chart; geo: ChartGeometry }
  | { lang: "diagram"; diagram: Diagram; geo: DiagramGeometry };

const at = (vars: Record<string, string | number>) => vars as React.CSSProperties;

/** Title, caption and source under the drawing; the drawing's name points at it. */
function Caption({ id, title, caption, source }: { id: string; title: string; caption: string; source?: string }) {
  const link = source ? sourceLink(source) : null;
  return (
    <figcaption className="fig-cap">
      <strong id={`${id}-t`} className="fig-title">{title}</strong>{" "}
      <span id={`${id}-c`}>{caption}</span>
      {link && (
        <>
          {" "}
          <span className="fig-source">
            Source: <a className="link" href={link.href}>{link.label}</a>
          </span>
        </>
      )}
    </figcaption>
  );
}

/** The text alternative, in the page's own table styling. */
function DataTable({ chart }: { chart: Chart }) {
  const { head, rows } = chartTable(chart);
  return (
    <details className="fig-data" data-pagefind-ignore>
      <summary>Data table</summary>
      <div className="table-scroll" role="region" tabIndex={0} aria-label={`Table: ${head.join(", ")}`}>
        <table className="table">
          <thead>
            <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const SHAPES = ["circle", "square", "diamond", "triangle"] as const;

/** A line chart's point marker, one shape per series so colour is not the only cue. */
function marker(shape: (typeof SHAPES)[number], x: number, y: number) {
  const r = 4.5;
  switch (shape) {
    case "square":
      return <rect x={x - r + 0.5} y={y - r + 0.5} width={2 * r - 1} height={2 * r - 1} />;
    case "diamond":
      return <path d={`M${x} ${y - r - 1}L${x + r + 1} ${y}L${x} ${y + r + 1}L${x - r - 1} ${y}Z`} />;
    case "triangle":
      return <path d={`M${x} ${y - r - 1}L${x + r + 1} ${y + r}L${x - r - 1} ${y + r}Z`} />;
    default:
      return <circle cx={x} cy={y} r={r} />;
  }
}

export function ChartFigure({ chart, geo, n }: { chart: Chart; geo: ChartGeometry; n: number }) {
  const id = `fig-${n}`;
  const bars = chart.type === "bar";
  return (
    <figure className="fig fig--chart not-prose" data-fig="chart">
      {chart.series.length > 1 && (
        <ul className="fig-legend" aria-label="Series">
          {chart.series.map((s, i) => (
            <li key={s.name}>
              <span className={`fig-key fig-c${i}`} data-key={i}>
                <svg className="fig-swatch" viewBox="0 0 12 12" aria-hidden="true">
                  {bars ? <rect width="12" height="12" rx="2" /> : <path d="M0 6H12" strokeWidth="2.5" />}
                </svg>
                {s.name}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="fig-plot" role="group" tabIndex={0} aria-label={`${chart.title}: chart`} style={at({ "--fig-w": geo.width })}>
        <svg
          className="fig-svg"
          viewBox={`0 0 ${geo.width} ${geo.height}`}
          role="img"
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-c`}
          focusable="false"
          data-pagefind-ignore
        >
          <g className="fig-grid" aria-hidden="true">
            {geo.ticks.map((t) => (
              <g key={t.y}>
                <line x1={geo.left} x2={geo.right} y1={t.y} y2={t.y} />
                <text x={geo.left - 8} y={t.y} textAnchor="end" dominantBaseline="central">{t.label}</text>
              </g>
            ))}
          </g>
          <g className="fig-xlabels" aria-hidden="true">
            {geo.xLabels.map((l) => (
              <text key={l.label} x={l.x} y={geo.bottom + 18} textAnchor="middle">{l.label}</text>
            ))}
            {chart.x?.label && (
              <text className="fig-axis-title" x={(geo.left + geo.right) / 2} y={geo.height - 4} textAnchor="middle">
                {chart.x.label}
              </text>
            )}
            {chart.y?.label && (
              <text className="fig-axis-title" x={geo.left} y={14}>{chart.y.label}</text>
            )}
          </g>

          {!bars && (
            <g aria-hidden="true">
              {chart.series.map((s, si) => (
                <path
                  key={s.name}
                  className={`fig-line fig-c${si}`}
                  data-s={si}
                  d={geo.paths[si]}
                  pathLength={1}
                  style={at({ "--d": si * 3 })}
                />
              ))}
            </g>
          )}

          <g aria-hidden="true">
            {geo.marks.map((m, k) =>
              bars ? (
                <g
                  key={k}
                  className={`fig-mark fig-grow fig-c${m.s}`}
                  data-s={m.s}
                  data-tip={m.tip}
                  style={at({ "--d": k })}
                >
                  <rect x={m.x} y={m.y} width={m.w} height={m.h} rx={2} />
                </g>
              ) : (
                <g key={k} className={`fig-mark fig-pt fig-c${m.s}`} data-s={m.s} data-tip={m.tip} style={at({ "--d": k })}>
                  {marker(SHAPES[m.s], m.x, m.y)}
                  <circle className="fig-hit" cx={m.x} cy={m.y} r={12} />
                </g>
              ),
            )}
            {bars && geo.valueLabels && geo.marks.map((m, k) => (
              <text key={`v${k}`} className="fig-val" data-s={m.s} x={m.x + m.w / 2} y={m.y - 6} textAnchor="middle">
                {m.value}
              </text>
            ))}
          </g>
        </svg>
        <div className="fig-tip" aria-hidden="true" hidden />
        <p className="fig-read visually-hidden" role="status" />
      </div>

      <Caption id={id} title={chart.title} caption={chart.caption} source={chart.source} />
      <DataTable chart={chart} />
    </figure>
  );
}

/** One node's outline, by kind: the shape says what it is as well as the colour. */
function Shape({ node }: { node: PlacedNode }) {
  const { x, y, w, h } = node;
  switch (node.kind) {
    case "store": {
      const ry = 7;
      return (
        <>
          <path d={`M${x} ${y + ry}A${w / 2} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${w / 2} ${ry} 0 0 1 ${x} ${y + h - ry}Z`} />
          <path className="fig-rim" d={`M${x} ${y + ry}A${w / 2} ${ry} 0 0 0 ${x + w} ${y + ry}`} />
        </>
      );
    }
    case "user":
      return <rect x={x} y={y} width={w} height={h} rx={h / 2} />;
    case "step":
      return <rect x={x} y={y} width={w} height={h} rx={2} />;
    default:
      return <rect x={x} y={y} width={w} height={h} rx={9} />;
  }
}

export function DiagramFigure({ diagram, geo, n }: { diagram: Diagram; geo: DiagramGeometry; n: number }) {
  const id = `fig-${n}`;
  const label = new Map(diagram.nodes.map((nd) => [nd.id, nd.label]));
  const lone = loneNodes(diagram);
  return (
    <figure className="fig fig--diagram not-prose" data-fig="diagram">
      <div className="fig-plot" role="group" tabIndex={0} aria-label={`${diagram.title}: diagram`} style={at({ "--fig-w": geo.width })}>
        <svg
          className="fig-svg"
          viewBox={`0 0 ${geo.width} ${geo.height}`}
          role="img"
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-c`}
          focusable="false"
          data-pagefind-ignore
        >
          <g aria-hidden="true">
            {geo.edges.map((e, i) => (
              <g key={i} className="fig-edge" data-from={e.from} data-to={e.to} style={at({ "--d": i })}>
                <path className="fig-route" d={e.path} pathLength={1} />
                <path className="fig-head" d={e.head} />
                {e.label && e.labelAt && (
                  <text className="fig-elabel" x={e.labelAt.x} y={e.labelAt.y} textAnchor="middle" dominantBaseline="central">
                    {e.label}
                  </text>
                )}
              </g>
            ))}
            {geo.nodes.map((nd, i) => {
              const out = diagram.edges.filter((e) => e.from === nd.id).map((e) => label.get(e.to));
              const into = diagram.edges.filter((e) => e.to === nd.id).map((e) => label.get(e.from));
              const tip = [
                `${nd.label}, ${nd.kind}.`,
                into.length ? `From ${into.join(", ")}.` : "",
                out.length ? `To ${out.join(", ")}.` : "",
              ].filter(Boolean).join(" ");
              return (
                <g key={nd.id} className={`fig-node fig-k-${nd.kind}`} data-id={nd.id} data-tip={tip} style={at({ "--d": i })}>
                  <Shape node={nd} />
                  <text x={nd.x + nd.w / 2} y={nd.y + nd.h / 2} textAnchor="middle" dominantBaseline="central">
                    {nd.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <p className="fig-read visually-hidden" role="status" />
      </div>

      <Caption id={id} title={diagram.title} caption={diagram.caption} />
      <details className="fig-data" data-pagefind-ignore>
        <summary>Connections</summary>
        <ul>
          {edgeList(diagram).map((line, i) => <li key={i}>{line}</li>)}
          {lone.map((l) => <li key={l}>{l} (not connected)</li>)}
        </ul>
      </details>
    </figure>
  );
}
