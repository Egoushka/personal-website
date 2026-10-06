---
title: "My posts can now draw their own charts"
date: "2026-10-06"
description: "I wanted more than plain text. Posts here now carry animated charts, diagrams and captioned images, and every figure still reads as text without JavaScript."
kind: build
topics: ["architecture", "typescript"]
---

My first generated post was 507 words of plain text. I wanted something better: a way to put knowledge into a reader's mind through a picture. Posts on this site can now carry drawn, animated charts, diagrams and captioned images, and every figure still reads as text with JavaScript off.

## The problem

Until this change a post here could hold headings, lists, tables and code, and nothing drawn: no post had an image, a chart or a diagram.

## The shape of it

A figure is a fenced block of JSON inside the post's markdown. One contract checks it in the validator, the page and the feeds: known keys only, limits, diagram edges that name real nodes, image sources and non-empty alt text. At build time the page draws charts as hand-written SVG and lays out diagrams with elkjs, with a caption and a text alternative that work with JavaScript off. A small island, loaded only on pages with a figure, adds draw-in, values on hover and focus, legend toggles and arrow-key reading, and turns draw-in off for reduced motion. Feeds get each figure's caption and its table or edge list, with no scripts.

```diagram
{
  "title": "How a figure gets from markdown to a reader",
  "direction": "down",
  "nodes": [
    { "id": "post", "label": "Post markdown", "kind": "store" },
    { "id": "validator", "label": "Validator", "kind": "step" },
    { "id": "build", "label": "Build: SVG and elkjs", "kind": "step" },
    { "id": "page", "label": "Static page", "kind": "service" },
    { "id": "island", "label": "Lazy island", "kind": "step" },
    { "id": "feed", "label": "Feeds", "kind": "external" },
    { "id": "reader", "label": "Reader", "kind": "user" }
  ],
  "edges": [
    { "from": "post", "to": "validator", "label": "figure blocks" },
    { "from": "validator", "to": "build" },
    { "from": "build", "to": "page", "label": "SVG and caption" },
    { "from": "build", "to": "feed", "label": "caption and table" },
    { "from": "page", "to": "island", "label": "only with a figure" },
    { "from": "page", "to": "reader" },
    { "from": "island", "to": "reader", "label": "draw-in, hover" }
  ],
  "caption": "The path a chart or diagram block takes. This diagram is written by hand; my content engine cannot draw one yet."
}
```

## What it cost

Measured against a build of the site without figures, gzip, first load:

| Page | Before (bytes) | After (bytes) |
| --- | --- | --- |
| Post without a figure | 145539 | 145655 |
| Post with a figure | 145539 | 147118 |
| Stylesheet, every page | 16594 | 17783 |

```chart
{
  "type": "bar",
  "title": "Bytes the figures added, gzip",
  "x": { "label": "Page" },
  "y": { "label": "Bytes added" },
  "series": [
    {
      "name": "Added",
      "points": [
        ["Post without a figure", 116],
        ["Post with a figure", 1579],
        ["Stylesheet, every page", 1189]
      ]
    }
  ],
  "caption": "After minus before, from the table above.",
  "source": "Egoushka/personal-website@a025b4571dc2:docs/adr/0010-posts-may-carry-interactive-figures.md#L68-L72"
}
```

## The decisions that cost something

- I reversed my own rule that the site is never interactive, for post figures only.
- I decided against MDX, so a post stays data and never becomes code.
- I chose a lazy loader over a static import: 116 bytes on every post instead of 1,089.

## What it does not do yet

- My content engine cannot draw diagrams yet; only the website renders them.
- Images still need screenshots from me.
- The figure styles load on every page and cost about 1.2 KB.

## Receipts

- The work: https://github.com/Egoushka/personal-website/pull/42
- Data: [Egoushka/personal-website@a025b4571dc2:docs/adr/0010-posts-may-carry-interactive-figures.md#L68-L72](https://github.com/Egoushka/personal-website/blob/a025b4571dc2/docs/adr/0010-posts-may-carry-interactive-figures.md#L68-L72)