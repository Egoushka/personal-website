import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkNode } from "elkjs/lib/elk-api";
import { categories, decimals, formatValue } from "./figures.mjs";
import type { Chart, Diagram } from "./figures.mjs";

/**
 * Where everything in a figure goes, as plain numbers, so the components only
 * print them and the tests can read them. Charts are laid out here by hand;
 * diagrams by elkjs, at build time: the browser gets finished SVG.
 */

/** Rough text width in the figure font, since the build has no canvas to measure with. */
export const textWidth = (s: string, size = 12) => Math.ceil([...s].length * size * 0.56);

// ── charts ───────────────────────────────────────────────────────────────────

export const CHART_MAX_W = 560;
export const CHART_MIN_W = 360;
export const CHART_H = 320;
const PAD = { top: 30, right: 16, bottom: 30, left: 52 };
/** Room under the plot for the x axis title, when there is one. */
const TITLE_ROOM = 20;

export type Mark = {
  s: number;
  i: number;
  /** Bar: the rectangle; line: the point (w and h are 0). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** What a tooltip and the screen-reader readout say. */
  tip: string;
  value: string;
};

export type ChartGeometry = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  ticks: { y: number; label: string }[];
  xLabels: { x: number; label: string }[];
  /** Marks in x-major order: the order the keyboard walks them. */
  marks: Mark[];
  /** Per series, a line's path (empty for bars). */
  paths: string[];
  /** Values written on the bars when there are few enough to read. */
  valueLabels: boolean;
};

/** A round step for an axis: 1, 2, 2.5 or 5 times a power of ten. */
export function niceScale(min: number, max: number, count = 5): { min: number; max: number; step: number } {
  if (max === min) max = min + 1;
  const raw = (max - min) / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * pow >= raw) ?? 10) * pow;
  return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step, step };
}

const round = (n: number) => Math.round(n * 100) / 100;

export function chartGeometry(chart: Chart): ChartGeometry {
  const unit = chart.y?.unit;
  const xs = categories(chart);
  const dp = decimals(chart);
  const values = chart.series.flatMap((s) => s.points.map((p) => p[1]));
  const lo = Math.min(...values);
  // The baseline is zero whenever the data is not below it: a bar from a cut axis lies.
  const scale = niceScale(lo >= 0 ? 0 : lo, Math.max(...values, 0));
  const widest = Math.max(...[scale.min, scale.max].map((t) => textWidth(formatValue(t, unit))));
  const left = Math.max(PAD.left, widest + 14);
  // A chart with few marks is drawn narrower, not stretched: the text keeps its size.
  const perBand = Math.max(54, chart.series.length * 34 + 22);
  const width = Math.min(CHART_MAX_W, Math.max(CHART_MIN_W, Math.round(left + PAD.right + xs.length * perBand)));
  const plotW = width - left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom - (chart.x?.label ? TITLE_ROOM : 0);
  const y = (v: number) => round(PAD.top + plotH - ((v - scale.min) / (scale.max - scale.min)) * plotH);
  const band = plotW / xs.length;
  const centre = (i: number) => round(left + band * (i + 0.5));

  const ticks: ChartGeometry["ticks"] = [];
  for (let t = scale.min; t <= scale.max + scale.step / 1e6; t += scale.step) {
    ticks.push({ y: y(t), label: formatValue(round(t), unit) });
  }

  // Skip labels that would overlap; the data table names every one.
  const every = Math.max(1, Math.ceil((Math.max(...xs.map((x) => textWidth(x))) + 10) / band));
  const xLabels = xs.flatMap((label, i) => (i % every === 0 ? [{ x: centre(i), label }] : []));

  const n = chart.series.length;
  const group = Math.min(band * 0.76, 56 * n);
  const gap = n > 1 ? 3 : 0;
  const barW = (group - gap * (n - 1)) / n;
  const base = y(Math.max(scale.min, 0));
  const marks: Mark[] = [];
  xs.forEach((x, i) => {
    chart.series.forEach((s, si) => {
      const p = s.points.find(([label]) => label === x);
      if (!p) return;
      const value = formatValue(p[1], unit, dp);
      const tip = `${s.name}, ${x}: ${value}`;
      if (chart.type === "bar") {
        const top = y(p[1]);
        marks.push({
          s: si, i,
          x: round(centre(i) - group / 2 + si * (barW + gap)),
          y: Math.min(top, base),
          w: round(barW),
          h: round(Math.max(Math.abs(base - top), 1)),
          tip, value,
        });
      } else {
        marks.push({ s: si, i, x: centre(i), y: y(p[1]), w: 0, h: 0, tip, value });
      }
    });
  });

  const paths = chart.series.map((_, si) =>
    chart.type === "line"
      ? marks.filter((m) => m.s === si).map((m, k) => `${k ? "L" : "M"}${m.x} ${m.y}`).join(" ")
      : "",
  );

  return {
    width,
    height: CHART_H,
    left,
    right: width - PAD.right,
    top: PAD.top,
    bottom: PAD.top + plotH,
    ticks,
    xLabels,
    marks,
    paths,
    valueLabels: chart.type === "bar" && marks.length <= 12 && barW >= 30,
  };
}

// ── diagrams ─────────────────────────────────────────────────────────────────

const NODE_H = 44;
const LABEL_H = 18;

export type PlacedNode = { id: string; label: string; kind: string; x: number; y: number; w: number; h: number };
export type PlacedEdge = {
  from: string;
  to: string;
  label?: string;
  /** The line, ending where the arrowhead starts. */
  path: string;
  /** The arrowhead's triangle. */
  head: string;
  labelAt?: { x: number; y: number };
};
export type DiagramGeometry = { width: number; height: number; nodes: PlacedNode[]; edges: PlacedEdge[] };

type Pt = { x: number; y: number };

/** A polyline with its corners rounded. */
export function roundedPath(pts: Pt[], r = 8): string {
  const out = [`M${round(pts[0].x)} ${round(pts[0].y)}`];
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const d1 = Math.hypot(b.x - a.x, b.y - a.y);
    const d2 = Math.hypot(c.x - b.x, c.y - b.y);
    const k = Math.min(r, d1 / 2, d2 / 2);
    const p1 = { x: b.x + ((a.x - b.x) / d1) * k, y: b.y + ((a.y - b.y) / d1) * k };
    const p2 = { x: b.x + ((c.x - b.x) / d2) * k, y: b.y + ((c.y - b.y) / d2) * k };
    out.push(`L${round(p1.x)} ${round(p1.y)}Q${round(b.x)} ${round(b.y)} ${round(p2.x)} ${round(p2.y)}`);
  }
  const last = pts[pts.length - 1];
  out.push(`L${round(last.x)} ${round(last.y)}`);
  return out.join("");
}

const HEAD = 8;

/** The route cut short by the arrowhead, and the arrowhead. */
function arrow(pts: Pt[]): { line: Pt[]; head: string } {
  const tip = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const d = Math.hypot(tip.x - prev.x, tip.y - prev.y) || 1;
  const [ux, uy] = [(tip.x - prev.x) / d, (tip.y - prev.y) / d];
  const base = { x: tip.x - ux * HEAD, y: tip.y - uy * HEAD };
  const wing = (s: number) => `${round(base.x - uy * 4 * s)} ${round(base.y + ux * 4 * s)}`;
  return {
    line: [...pts.slice(0, -1), base],
    head: `M${round(tip.x)} ${round(tip.y)}L${wing(1)}L${wing(-1)}Z`,
  };
}

const elk = new ELK();

export async function diagramGeometry(d: Diagram): Promise<DiagramGeometry> {
  const sized = d.nodes.map((n) => ({ ...n, w: Math.max(96, textWidth(n.label, 13) + 36), h: NODE_H }));
  const graph: ElkNode = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": d.direction === "down" ? "DOWN" : "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": "[top=14,left=14,bottom=14,right=14]",
      "elk.spacing.nodeNode": "28",
      "elk.layered.spacing.nodeNodeBetweenLayers": "64",
      "elk.layered.spacing.edgeNodeBetweenLayers": "20",
      "elk.spacing.edgeLabel": "4",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    },
    children: sized.map((n) => ({ id: n.id, width: n.w, height: n.h })),
    edges: d.edges.map((e, i) => ({
      id: `e${i}`,
      sources: [e.from],
      targets: [e.to],
      ...(e.label ? { labels: [{ text: e.label, width: textWidth(e.label, 11) + 8, height: LABEL_H }] } : {}),
    })),
  });

  const nodes = sized.map((n) => {
    const at = graph.children!.find((c) => c.id === n.id)!;
    return { id: n.id, label: n.label, kind: n.kind, x: round(at.x!), y: round(at.y!), w: n.w, h: n.h };
  });
  const edges = d.edges.map((e, i) => {
    const at = graph.edges!.find((x) => x.id === `e${i}`)!;
    const sec = (at as { sections?: { startPoint: Pt; endPoint: Pt; bendPoints?: Pt[] }[] }).sections![0];
    const route = [sec.startPoint, ...(sec.bendPoints ?? []), sec.endPoint];
    const { line, head } = arrow(route);
    const label = at.labels?.[0];
    return {
      from: e.from,
      to: e.to,
      ...(e.label ? { label: e.label } : {}),
      path: roundedPath(line),
      head,
      ...(label ? { labelAt: { x: round(label.x! + label.width! / 2), y: round(label.y! + label.height! / 2) } } : {}),
    };
  });
  return { width: Math.ceil(graph.width!), height: Math.ceil(graph.height!), nodes, edges };
}