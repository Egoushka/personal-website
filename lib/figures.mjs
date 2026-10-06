// Figure blocks in a post (ADR 0010): a ```chart or ```diagram fence holding one
// JSON object, and an image with alt text and a caption. Shared by the renderer,
// the feeds and scripts/validate-content.mjs, so the gate and the page cannot
// disagree about what a figure is. Plain JavaScript because the validator runs
// under bare `node`. Nothing here may import from a client file: the browser
// island reads attributes the renderer wrote and knows none of this.
import { refProblem, refsIn } from "./evidence.mjs";

export const FIGURE_LANGS = ["chart", "diagram"];

export const LIMITS = {
  title: 80,
  caption: 200,
  label: 60,
  seriesName: 40,
  xLabel: 24,
  series: [1, 4],
  points: [2, 24],
  nodes: [2, 24],
  nodeLabel: 32,
  edgeLabel: 30,
};
export const CHART_TYPES = ["bar", "line"];
export const UNITS = ["%", "ms", "s", "$", "x"];
export const KINDS = ["service", "store", "external", "user", "step"];
export const DIRECTIONS = ["right", "down"];

/** @typedef {{ name: string, points: [string, number][] }} Series */
/** @typedef {{ type: "bar" | "line", title: string, x?: { label?: string }, y?: { label?: string, unit?: string }, series: Series[], caption: string, source?: string }} Chart */
/** @typedef {{ id: string, label: string, kind: string }} DiagramNode */
/** @typedef {{ from: string, to: string, label?: string }} DiagramEdge */
/** @typedef {{ title: string, direction: "right" | "down", nodes: DiagramNode[], edges: DiagramEdge[], caption: string }} Diagram */

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
// Text a reader sees as typed: one line, no control characters.
const LINE = /^[^\p{Cc}]+$/u;

/** @param {unknown} v @param {string} path @param {number} max @param {string[]} out */
function text(v, path, max, out) {
  if (typeof v !== "string" || v.trim() === "") out.push(`${path} must be a non-empty string`);
  else if (v.length > max) out.push(`${path} is ${v.length} characters, max ${max}`);
  else if (!LINE.test(v)) out.push(`${path} must be one line of plain text`);
}

/** Unknown keys are an error, so a typo does not pass for an option. */
function keys(o, allowed, path, out) {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) out.push(`${path}: unknown key "${k}" (allowed: ${allowed.join(", ")})`);
}

/** @param {unknown} c @returns {string[]} */
export function chartProblems(c) {
  /** @type {string[]} */
  const out = [];
  if (!isObject(c)) return ["a chart is one JSON object"];
  keys(c, ["type", "title", "x", "y", "series", "caption", "source"], "chart", out);
  if (!CHART_TYPES.includes(c.type)) out.push(`type must be one of ${CHART_TYPES.join(", ")}`);
  text(c.title, "title", LIMITS.title, out);
  text(c.caption, "caption", LIMITS.caption, out);
  for (const axis of ["x", "y"]) {
    const a = c[axis];
    if (a === undefined) continue;
    if (!isObject(a)) {
      out.push(`${axis} must be an object`);
      continue;
    }
    keys(a, axis === "y" ? ["label", "unit"] : ["label"], axis, out);
    if (a.label !== undefined) text(a.label, `${axis}.label`, LIMITS.label, out);
    if (a.unit !== undefined && !UNITS.includes(a.unit)) out.push(`y.unit must be one of ${UNITS.map((u) => `"${u}"`).join(", ")} or omitted`);
  }
  if (c.source !== undefined) {
    const bad = typeof c.source === "string" ? refProblem(c.source) : "source must be a string";
    if (bad) out.push(`source: ${bad}`);
  }
  const [minS, maxS] = LIMITS.series;
  if (!Array.isArray(c.series) || c.series.length < minS || c.series.length > maxS) {
    out.push(`series must hold ${minS} to ${maxS} series`);
    return out;
  }
  const names = new Set();
  c.series.forEach((s, i) => {
    const at = `series[${i}]`;
    if (!isObject(s)) return out.push(`${at} must be an object`);
    keys(s, ["name", "points"], at, out);
    text(s.name, `${at}.name`, LIMITS.seriesName, out);
    if (names.has(s.name)) out.push(`${at}.name "${s.name}" repeats another series`);
    names.add(s.name);
    const [minP, maxP] = LIMITS.points;
    if (!Array.isArray(s.points) || s.points.length < minP || s.points.length > maxP) {
      return out.push(`${at}.points must hold ${minP} to ${maxP} points`);
    }
    const seen = new Set();
    s.points.forEach((p, j) => {
      const pt = `${at}.points[${j}]`;
      if (!Array.isArray(p) || p.length !== 2) return out.push(`${pt} must be [x label, y value]`);
      text(p[0], `${pt}[0]`, LIMITS.xLabel, out);
      if (seen.has(p[0])) out.push(`${pt}[0] "${p[0]}" repeats an x label in this series`);
      seen.add(p[0]);
      if (typeof p[1] !== "number" || !Number.isFinite(p[1])) out.push(`${pt}[1] must be a finite number`);
      else if (c.type === "bar" && p[1] < 0) out.push(`${pt}[1] is negative: a bar chart starts at zero`);
    });
  });
  return out;
}

/** @param {unknown} d @returns {string[]} */
export function diagramProblems(d) {
  /** @type {string[]} */
  const out = [];
  if (!isObject(d)) return ["a diagram is one JSON object"];
  keys(d, ["title", "direction", "nodes", "edges", "caption"], "diagram", out);
  text(d.title, "title", LIMITS.title, out);
  text(d.caption, "caption", LIMITS.caption, out);
  if (!DIRECTIONS.includes(d.direction)) out.push(`direction must be one of ${DIRECTIONS.join(", ")}`);
  const [minN, maxN] = LIMITS.nodes;
  if (!Array.isArray(d.nodes) || d.nodes.length < minN || d.nodes.length > maxN) {
    out.push(`nodes must hold ${minN} to ${maxN} nodes`);
    return out;
  }
  const ids = new Set();
  d.nodes.forEach((n, i) => {
    const at = `nodes[${i}]`;
    if (!isObject(n)) return out.push(`${at} must be an object`);
    keys(n, ["id", "label", "kind"], at, out);
    if (typeof n.id !== "string" || !/^[a-z0-9-]+$/.test(n.id)) out.push(`${at}.id must be lowercase letters, digits and hyphens`);
    else if (ids.has(n.id)) out.push(`${at}.id "${n.id}" repeats another node`);
    else ids.add(n.id);
    text(n.label, `${at}.label`, LIMITS.nodeLabel, out);
    if (!KINDS.includes(n.kind)) out.push(`${at}.kind must be one of ${KINDS.join(", ")}`);
  });
  if (!Array.isArray(d.edges)) {
    out.push("edges must be an array");
    return out;
  }
  d.edges.forEach((e, i) => {
    const at = `edges[${i}]`;
    if (!isObject(e)) return out.push(`${at} must be an object`);
    keys(e, ["from", "to", "label"], at, out);
    for (const end of ["from", "to"]) {
      if (!ids.has(e[end])) out.push(`${at}.${end} ${JSON.stringify(e[end])} is not a node id`);
    }
    if (e.from === e.to) out.push(`${at} joins "${e.from}" to itself`);
    if (e.label !== undefined) text(e.label, `${at}.label`, LIMITS.edgeLabel, out);
  });
  return out;
}

/**
 * One block's JSON, checked: the figure, or what is wrong with it.
 * @param {string} lang
 * @param {string} body
 * @returns {{ figure: Chart | Diagram } | { problems: string[] }}
 */
export function parseFigure(lang, body) {
  let value;
  try {
    value = JSON.parse(body);
  } catch (e) {
    return { problems: [`not JSON (${e.message}): a figure block is one JSON object, with no comments`] };
  }
  const problems = lang === "chart" ? chartProblems(value) : diagramProblems(value);
  return problems.length ? { problems } : { figure: value };
}

/**
 * Every figure fence in a parsed post, in document order.
 * @param {import("mdast").Root} tree
 * @returns {{ lang: string, value: string, line: number | undefined }[]}
 */
export function figureBlocks(tree) {
  /** @type {{ lang: string, value: string, line: number | undefined }[]} */
  const out = [];
  /** @param {any} node */
  const walk = (node) => {
    if (node.type === "code" && FIGURE_LANGS.includes(node.lang)) {
      out.push({ lang: node.lang, value: node.value, line: node.position?.start.line });
    } else node.children?.forEach(walk);
  };
  walk(tree);
  return out;
}

/** Every image in a parsed post: its alt, url and title (the caption). @param {import("mdast").Root} tree */
export function images(tree) {
  /** @type {{ alt: string, url: string, title: string | null, line: number | undefined }[]} */
  const out = [];
  /** @param {any} node */
  const walk = (node) => {
    if (node.type === "image") out.push({ alt: node.alt ?? "", url: node.url, title: node.title ?? null, line: node.position?.start.line });
    else node.children?.forEach(walk);
  };
  walk(tree);
  return out;
}

/** The optimized picture an image URL names: `/img/<name>.png` is `name`. @param {string} url */
export function pictureName(url) {
  return url.match(/^\/img\/([a-z0-9][a-z0-9-]*)\.(?:png|jpe?g)$/i)?.[1] ?? null;
}

/**
 * The text a figure carries for a reader who cannot see the drawing, as plain
 * data: the page renders it in a <details>, the feeds as a table or a list.
 * @param {Chart} chart
 * @returns {{ head: string[], rows: string[][] }}
 */
export function chartTable(chart) {
  const xs = categories(chart);
  const unit = chart.y?.unit;
  return {
    head: [chart.x?.label ?? "Category", ...chart.series.map((s) => s.name)],
    rows: xs.map((x) => [
      x,
      ...chart.series.map((s) => {
        const p = s.points.find(([label]) => label === x);
        return p ? formatValue(p[1], unit) : "–";
      }),
    ]),
  };
}

/** The x labels in the order they first appear across the series. @param {Chart} chart */
export function categories(chart) {
  return [...new Set(chart.series.flatMap((s) => s.points.map(([x]) => x)))];
}

/** @param {Diagram} d @returns {string[]} */
export function edgeList(d) {
  const label = new Map(d.nodes.map((n) => [n.id, n.label]));
  return d.edges.map((e) => `${label.get(e.from)} → ${label.get(e.to)}${e.label ? `: ${e.label}` : ""}`);
}

/** A node with no edge is still named by the list. @param {Diagram} d */
export function loneNodes(d) {
  const used = new Set(d.edges.flatMap((e) => [e.from, e.to]));
  return d.nodes.filter((n) => !used.has(n.id)).map((n) => n.label);
}

const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** A value with its unit, as the table, the tooltip and the axis write it. @param {number} v @param {string | undefined} unit */
export function formatValue(v, unit) {
  const n = NUMBER.format(v).replace("-", "−");
  switch (unit) {
    case "%": return `${n}%`;
    case "$": return `$${n}`;
    case "x": return `${n}×`;
    case "ms": case "s": return `${n} ${unit}`;
    default: return n;
  }
}

/**
 * Where a chart's source points: `owner/repo@sha:path#L1-L9` is that file at that
 * commit, on GitHub. @param {string} source
 */
export function sourceLink(source) {
  const [r] = refsIn(source);
  if (!r) return null;
  const hash = r.from === undefined ? "" : r.to === r.from ? `#L${r.from}` : `#L${r.from}-L${r.to}`;
  return { label: source, href: `https://github.com/${r.repo}/blob/${r.sha}/${r.path}${hash}` };
}
