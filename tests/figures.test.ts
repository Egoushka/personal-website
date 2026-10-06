import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { renderToStaticMarkup } from "react-dom/server";
import {
  chartTable, edgeList, figureBlocks, formatValue, images, parseFigure, pictureName, sourceLink,
} from "../lib/figures.mjs";
import type { Chart, Diagram } from "../lib/figures.mjs";
import { chartGeometry, diagramGeometry, niceScale, roundedPath } from "../lib/figure-layout";
import { parseMarkdown } from "../lib/markdown.mjs";
import { bodyHtml } from "../lib/feed";
import { site } from "../lib/site";
import Prose from "../components/Prose";

const chart = (over: Record<string, unknown> = {}) => ({
  type: "bar",
  title: "Recall by segment size",
  x: { label: "Events per segment" },
  y: { label: "Recall", unit: "%" },
  series: [{ name: "chronicle", points: [["15", 73.2], ["20", 71.6], ["30", 71.1]] }],
  caption: "Swept on 46 eval threads.",
  ...over,
});
const diagram = (over: Record<string, unknown> = {}) => ({
  title: "How a run is checked",
  direction: "right",
  nodes: [
    { id: "worker", label: "Worker", kind: "service" },
    { id: "judge", label: "Support judge", kind: "step" },
    { id: "log", label: "Run log", kind: "store" },
  ],
  edges: [{ from: "worker", to: "judge", label: "claims" }, { from: "judge", to: "log" }],
  caption: "Each claim is judged against the text it cites.",
  ...over,
});
const problems = (lang: string, value: unknown) => {
  const r = parseFigure(lang, JSON.stringify(value));
  return "problems" in r ? r.problems : [];
};
const fence = (lang: string, value: unknown) => `\`\`\`${lang}\n${JSON.stringify(value)}\n\`\`\``;
const asChart = (v: unknown) => v as Chart;
const asDiagram = (v: unknown) => v as Diagram;

test("figures: the contract's own examples are valid", () => {
  assert.deepEqual(problems("chart", chart({ source: "Egoushka/chronicle@3f2a1b9:docs/eval.md#L10-L18" })), []);
  assert.deepEqual(problems("diagram", diagram()), []);
});

test("figures: a block is JSON and nothing else", () => {
  const r = parseFigure("chart", '{ "type": "bar", // a comment\n}');
  assert.ok("problems" in r && /not JSON/.test(r.problems[0]));
  assert.match(problems("chart", [])[0], /one JSON object/);
});

test("figures: unknown keys are an error, at every level", () => {
  assert.match(problems("chart", chart({ color: "red" }))[0], /unknown key "color"/);
  assert.match(problems("chart", chart({ y: { unit: "%", min: 0 } }))[0], /y: unknown key "min"/);
  assert.match(problems("diagram", diagram({ layout: "tree" }))[0], /unknown key "layout"/);
  assert.match(
    problems("diagram", diagram({ nodes: [{ id: "a", label: "A", kind: "step", x: 1 }, { id: "b", label: "B", kind: "step" }], edges: [] }))[0],
    /nodes\[0\]: unknown key "x"/,
  );
});

test("figures: a chart's limits", () => {
  assert.match(problems("chart", chart({ type: "pie" }))[0], /type must be one of bar, line/);
  assert.match(problems("chart", chart({ title: "x".repeat(81) }))[0], /title is 81 characters, max 80/);
  assert.match(problems("chart", chart({ caption: "" }))[0], /caption must be a non-empty string/);
  assert.match(problems("chart", chart({ caption: undefined }))[0], /caption/);
  assert.match(problems("chart", chart({ y: { unit: "kg" } }))[0], /y.unit must be one of/);
  assert.match(problems("chart", chart({ series: [] }))[0], /1 to 4 series/);
  const s = (n: number) => ({ name: `s${n}`, points: [["a", 1], ["b", 2]] });
  assert.match(problems("chart", chart({ series: [1, 2, 3, 4, 5].map(s) }))[0], /1 to 4 series/);
  assert.match(problems("chart", chart({ series: [{ name: "a", points: [["x", 1]] }] }))[0], /2 to 24 points/);
  const long = Array.from({ length: 25 }, (_, i) => [`p${i}`, i]);
  assert.match(problems("chart", chart({ series: [{ name: "a", points: long }] }))[0], /2 to 24 points/);
  assert.match(problems("chart", chart({ series: [{ name: "a", points: [["x", "1"], ["y", 2]] }] }))[0], /finite number/);
  assert.match(problems("chart", chart({ series: [{ name: "a", points: [["x", 1], ["x", 2]] }] }))[0], /repeats an x label/);
  assert.match(problems("chart", chart({ series: [s(1), s(1)] }))[0], /repeats another series/);
  assert.match(problems("chart", chart({ title: "two\nlines" }))[0], /one line of plain text/);
});

test("figures: a bar starts at zero, a line may go below it", () => {
  const below = { name: "a", points: [["x", -1], ["y", 2]] };
  assert.match(problems("chart", chart({ series: [below] }))[0], /negative: a bar chart starts at zero/);
  assert.deepEqual(problems("chart", chart({ type: "line", series: [below] })), []);
});

test("figures: a source is a ref the evidence pack can open", () => {
  assert.match(problems("chart", chart({ source: "somewhere" }))[0], /source: .*not owner\/repo@<sha>:path/);
  assert.deepEqual(sourceLink("Egoushka/chronicle@3f2a1b9:docs/eval.md#L10-L18"), {
    label: "Egoushka/chronicle@3f2a1b9:docs/eval.md#L10-L18",
    href: "https://github.com/Egoushka/chronicle/blob/3f2a1b9/docs/eval.md#L10-L18",
  });
});

test("figures: a diagram's nodes are unique, its edges join them, its kinds are closed", () => {
  const node = (id: string, kind = "step") => ({ id, label: id, kind });
  assert.match(problems("diagram", diagram({ nodes: [node("a"), node("a")], edges: [] }))[0], /repeats another node/);
  assert.match(problems("diagram", diagram({ nodes: [node("A b"), node("c")], edges: [] }))[0], /lowercase letters, digits and hyphens/);
  assert.match(problems("diagram", diagram({ nodes: [node("a", "box"), node("b")], edges: [] }))[0], /kind must be one of/);
  assert.match(problems("diagram", diagram({ nodes: [node("a")], edges: [] }))[0], /2 to 24 nodes/);
  assert.match(problems("diagram", diagram({ edges: [{ from: "worker", to: "nowhere" }] }))[0], /"nowhere" is not a node id/);
  assert.match(problems("diagram", diagram({ edges: [{ from: "worker", to: "worker" }] }))[0], /to itself/);
  assert.match(problems("diagram", diagram({ edges: [{ from: "worker", to: "judge", label: "x".repeat(31) }] }))[0], /label is 31 characters, max 30/);
  assert.match(problems("diagram", diagram({ direction: "left" }))[0], /direction must be one of right, down/);
});

test("figures: fences and images are found in a parsed post, code inside code is not", () => {
  const md = `${fence("chart", chart())}\n\n![alt](/img/a-b.png "Caption")\n\n\`\`\`\`md\n${fence("chart", {})}\n\`\`\`\`\n\n${fence("diagram", diagram())}`;
  const tree = parseMarkdown(md);
  assert.deepEqual(figureBlocks(tree).map((b) => b.lang), ["chart", "diagram"]);
  assert.deepEqual(images(tree).map((i) => [i.alt, i.url, i.title]), [["alt", "/img/a-b.png", "Caption"]]);
  assert.equal(pictureName("/img/a-b.png"), "a-b");
  assert.equal(pictureName("https://x.test/a.png"), null);
  assert.equal(pictureName("/img/a.gif"), null);
});

test("figures: the text alternative is the data table and the list of edges", () => {
  const c = chart({ series: [{ name: "a", points: [["x", 1.5], ["y", 2]] }, { name: "b", points: [["y", 3]] }], y: { unit: "ms" } });
  assert.deepEqual(chartTable(asChart(c)), {
    head: ["Events per segment", "a", "b"],
    rows: [["x", "1.5 ms", "–"], ["y", "2 ms", "3 ms"]],
  });
  assert.deepEqual(edgeList(asDiagram(diagram())), ["Worker → Support judge: claims", "Support judge → Run log"]);
  assert.equal(formatValue(71.1, "%"), "71.1%");
  assert.equal(formatValue(1234.567, "$"), "$1,234.57");
  assert.equal(formatValue(-2, "x"), "−2×");
  assert.equal(formatValue(3, undefined), "3");
});

test("figures: axes use round steps and the baseline is zero for data above it", () => {
  assert.deepEqual(niceScale(0, 73.2), { min: 0, max: 80, step: 20 });
  assert.deepEqual(niceScale(0, 1), { min: 0, max: 1, step: 0.2 });
  const g = chartGeometry(asChart(chart()));
  assert.deepEqual(g.ticks.map((t) => t.label), ["0%", "20%", "40%", "60%", "80%"]);
  assert.equal(g.ticks[0].y, g.bottom);
  assert.equal(g.marks.length, 3);
  for (const m of g.marks) {
    assert.ok(m.x >= g.left && m.x + m.w <= g.right, "a bar is inside the plot");
    assert.ok(m.y >= g.top && m.y + m.h <= g.bottom + 0.01, "and above the baseline");
  }
  assert.equal(g.marks[0].tip, "chronicle, 15: 73.2%");
});

test("figures: marks are in x-major order, a gap in a series is a gap", () => {
  const c = chart({
    type: "line",
    series: [{ name: "a", points: [["x", 1], ["y", 2], ["z", 3]] }, { name: "b", points: [["x", 3], ["z", 1]] }],
  });
  const g = chartGeometry(asChart(c));
  assert.deepEqual(g.marks.map((m) => `${m.s}${m.i}`), ["00", "10", "01", "02", "12"]);
  assert.match(g.paths[0], /^M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L/);
  assert.equal(g.paths[1].split("L").length, 2);
});

test("figures: many labels are thinned so none overlap", () => {
  const points = Array.from({ length: 24 }, (_, i) => [`step ${i + 1}`, i]);
  const g = chartGeometry(asChart(chart({ type: "line", series: [{ name: "a", points }] })));
  assert.ok(g.xLabels.length < 24 && g.xLabels.length >= 6, `${g.xLabels.length} labels`);
});

test("figures: elkjs lays a diagram out left to right, or top to bottom", async () => {
  const right = await diagramGeometry(asDiagram(diagram()));
  const xs = ["worker", "judge", "log"].map((id) => right.nodes.find((n) => n.id === id)!.x);
  assert.ok(xs[0] < xs[1] && xs[1] < xs[2], xs.join(" < "));
  assert.equal(right.edges.length, 2);
  for (const n of right.nodes) assert.ok(n.x >= 0 && n.y >= 0 && n.x + n.w <= right.width && n.y + n.h <= right.height);
  assert.ok(right.edges[0].labelAt, "a labelled edge has a label position");
  assert.equal(right.edges[1].labelAt, undefined);
  assert.match(right.edges[0].head, /^M[\d.]+ [\d.]+L[\d.]+ [\d.]+L[\d.]+ [\d.]+Z$/);

  const down = await diagramGeometry(asDiagram(diagram({ direction: "down" })));
  const ys = ["worker", "judge", "log"].map((id) => down.nodes.find((n) => n.id === id)!.y);
  assert.ok(ys[0] < ys[1] && ys[1] < ys[2], ys.join(" < "));
});

test("figures: a diagram with a cycle and a lone node still lays out", async () => {
  const d = diagram({
    nodes: [...diagram().nodes, { id: "extra", label: "Extra", kind: "user" }],
    edges: [{ from: "worker", to: "judge" }, { from: "judge", to: "worker" }],
  });
  const g = await diagramGeometry(asDiagram(d));
  assert.equal(g.nodes.length, 4);
  assert.equal(g.edges.length, 2);
});

test("figures: rounded corners keep the ends of the route", () => {
  const d = roundedPath([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }]);
  assert.ok(d.startsWith("M0 0") && d.endsWith("L20 20"), d);
});

test("figures on the page: a chart is a figure with a name, a caption and its data table", async () => {
  const html = renderToStaticMarkup(await Prose({ figures: true, markdown: `Before.\n\n${fence("chart", chart())}\n\nAfter.` }));
  assert.match(html, /<figure class="fig fig--chart not-prose" data-fig="chart">/);
  assert.match(html, /<svg [^>]*role="img"[^>]*aria-labelledby="fig-0-t"/);
  assert.match(html, /<figcaption class="fig-cap"><strong id="fig-0-t" class="fig-title">Recall by segment size<\/strong> <span id="fig-0-c">Swept on 46 eval threads\.<\/span>/);
  assert.match(html, /<details class="fig-data"[^>]*><summary>Data table<\/summary>/);
  assert.match(html, /<td>73\.2%<\/td>/);
  assert.equal((html.match(/class="fig-mark /g) ?? []).length, 3);
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /fig-legend/, "one series needs no legend");
});

test("figures on the page: a diagram lists its edges, a legend names every series", async () => {
  const two = chart({ series: [{ name: "a", points: [["x", 1], ["y", 2]] }, { name: "b", points: [["x", 2], ["y", 1]] }] });
  const html = renderToStaticMarkup(await Prose({ figures: true, markdown: `${fence("diagram", diagram())}\n\n${fence("chart", two)}` }));
  assert.match(html, /<figure class="fig fig--diagram not-prose" data-fig="diagram">/);
  assert.match(html, /<li>Worker → Support judge: claims<\/li>/);
  assert.match(html, /data-id="worker"/);
  assert.equal((html.match(/class="fig-key /g) ?? []).length, 2);
  assert.match(html, /id="fig-1-t"/, "figures are numbered across the body");
});

test("figures on the page: a bad block fails the build with where it is", async () => {
  await assert.rejects(Prose({ figures: true, markdown: `text\n\n${fence("chart", chart({ type: "pie" }))}` }), /chart block 1 \(body line 3\)/);
});

test("figures on the page: other code is still code, and a plain image stays plain", async () => {
  const html = renderToStaticMarkup(await Prose({ figures: true, markdown: '```json\n{"a": 1}\n```\n\n![Alt](/img/none.png)\n' }));
  assert.match(html, /<figure class="code not-prose">/);
  assert.doesNotMatch(html, /data-fig/);
  assert.match(html, /<p><img [^>]*alt="Alt"/);
  assert.doesNotMatch(html, /<figure class="post-figure/);
});

test("figures on the page: an image with a title is a figure with a caption, the title not repeated on the image", async () => {
  const html = renderToStaticMarkup(await Prose({ figures: true, markdown: '![Two bars](/img/none.png "Recall, before and after")' }));
  assert.match(html, /<figure class="post-figure not-prose"><img [^>]*alt="Two bars"[^>]*\/><figcaption>Recall, before and after<\/figcaption><\/figure>/);
  assert.doesNotMatch(html, /title=/);
});

test("figures on the page: docs keep a chart fence as code", async () => {
  const html = renderToStaticMarkup(await Prose({ markdown: fence("chart", chart({ type: "pie" })) }));
  assert.match(html, /<figure class="code not-prose">/);
  assert.doesNotMatch(html, /data-fig/);
});

test("figures on the page: the island is mounted only when the body has a figure", async () => {
  // The island is a client reference, so markup cannot show it: the first child of what Prose returns is it, or false.
  const island = async (markdown: string) => ((await Prose({ figures: true, markdown })) as { props: { children: unknown[] } }).props.children[0];
  assert.equal(await island("Just text, and `code`."), false);
  assert.ok(await island(fence("chart", chart())));
});

test("figures in a feed: the caption and the data, no drawing and no script", () => {
  const html = bodyHtml(
    `${fence("chart", chart({ source: "Egoushka/chronicle@3f2a1b9:docs/eval.md#L10" }))}\n\n${fence("diagram", diagram())}`,
    "https://example.test/writing/x/",
  );
  assert.match(html, /<figure><figcaption><strong>Recall by segment size<\/strong> Swept on 46 eval threads\. Source: <a href="https:\/\/github\.com\/Egoushka\/chronicle\/blob\/3f2a1b9\/docs\/eval\.md#L10">/);
  assert.match(html, /<table><thead><tr><th>Events per segment<\/th><th>chronicle<\/th><\/tr><\/thead><tbody><tr><td>15<\/td><td>73\.2%<\/td><\/tr>/);
  assert.match(html, /<li>Worker → Support judge: claims<\/li>/);
  assert.doesNotMatch(html, /<svg|<script|<details/);
});

test("figures in a feed: an image has an absolute address and a caption", () => {
  const html = bodyHtml('![Two bars](/img/none.png "Recall, before and after")', "https://example.test/writing/x/");
  assert.ok(
    html.includes(`<figure class="post-figure"><img src="${site.url}/img/none.png" alt="Two bars"><figcaption>Recall, before and after</figcaption></figure>`),
    html,
  );
});

test("figures: the validator reports each problem with its line, and checks images", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "figures-"));
  const write = (rel: string, body: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  };
  write("lib/topics.ts", 'export const TOPICS = {\n  "retrieval": { name: "x" },\n} as const satisfies Record<string, unknown>;\n');
  write("lib/site.ts", "export const site = {};\n");
  write("lib/highlight.ts", fs.readFileSync("lib/highlight.ts", "utf8"));
  write("assets/images/real.png", "");
  const post = (body: string) =>
    write("content/posts/a.md", `---\ntitle: "A"\ndate: "2026-01-01"\ndescription: "d"\nkind: note\ntopics: ["retrieval"]\n---\n\n${body}\n`);
  const run = () => spawnSync("node", [path.resolve("scripts/validate-content.mjs")], { cwd: root, encoding: "utf8" });

  post(
    [
      fence("chart", chart({ type: "pie" })),
      "![](/img/real.png)",
      '![Fine](/img/real.png "Caption")',
      "![Missing source](/img/ghost.png)",
      "![Remote](https://example.test/a.png)",
    ].join("\n\n"),
  );
  const bad = run();
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /body line 2: chart block: type must be one of bar, line/);
  assert.match(bad.stderr, /image "\/img\/real.png" has no alt text/);
  assert.match(bad.stderr, /image "\/img\/ghost.png" has no source: add assets\/images\/ghost.png/);
  assert.match(bad.stderr, /image "https:\/\/example.test\/a.png" must be \/img\/<name>.png/);
  assert.equal((bad.stderr.match(/image "\/img\/real.png"/g) ?? []).length, 1, "only the image without alt");

  post(`${fence("chart", chart())}\n\n${fence("diagram", diagram())}\n\n![Fine](/img/real.png "Caption")`);
  const ok = run();
  assert.doesNotMatch(ok.stderr, /ERROR/);
  assert.equal(ok.status, 0, ok.stderr);
  fs.rmSync(root, { recursive: true, force: true });
});
