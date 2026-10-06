# Posts may carry interactive figures

Status: accepted. Supersedes the interactivity rule of [ADR 0001](./0001-the-site-is-never-the-app.md) for post figures only.

[ADR 0001](./0001-the-site-is-never-the-app.md) closes with the cost it accepted: nothing
on the site is "interactive beyond what a browser does on its own". That sentence kept
a post a page of words, and a post that reports a measurement pays for it. A table of
four recall scores hides the one that fell; a paragraph describing a request path makes
the reader draw it. The owner decided on 2026-10-06 that a post may carry a chart, a
diagram and an image with a caption, drawn and animated, with JavaScript allowed for
that and nothing else.

The rest of ADR 0001 stands: the site is a statically exported set of files, with no
server, no session, no database, and no product in it. A figure is data in a post that
a script draws; it is not a feature of the site.

## Typed blocks, not MDX

A figure is a fenced block whose info string names its type and whose body is one JSON
object, ` ```chart ` or ` ```diagram `, and an image is standard markdown with its
alt text and its caption as the title (docs/writing/README.md has the fields and the
limits). Not MDX, which would put components and expressions in a post: a post stays
data. A renderer that does not know the block shows it as code, so a post never breaks;
the validator checks every block against the contract before a build; and the content
engine that drafts posts can generate a block and know the site will take it, because
the block cannot carry anything but numbers, labels and a source.

## What the exception allows

- **One client island**, `components/FigureEnhancements.tsx`: draw-in on scroll, values
  on hover and focus, series toggles in a legend. `Prose` mounts it only when the post
  has a figure, so no other route loads a byte of it.
- **Hand-written SVG**, drawn on the server at build time. No chart library. Diagrams are
  laid out by elkjs at build time and drawn by the site; elkjs never reaches the browser.
- **Nothing new in the CSP.** No eval, no third-party script, font or image, no request
  at runtime. A figure reads only the attributes the server wrote.

## What it does not

- **A figure is complete without JavaScript.** The SVG is server-rendered in its final
  state; a chart's data is in a table, a diagram's connections in a list, both in a
  `<details>`; the feeds carry the caption and that text, never a script.
- **No state leaves the page.** No storage, no cookie, no event to analytics.
- **Motion is optional and bounded.** `prefers-reduced-motion` disables it, only marks
  move and never text, and a figure already on screen is not erased to be drawn again.
- **Keyboard and screen readers are first-class.** Each figure is one tab stop whose arrow
  keys read its values, the legend toggles are buttons, and axe passes with a figure on
  the page at both widths in both themes.
- **The cost is counted.** Routes with a figure have their own first-load JS budget in
  `scripts/smoke.mjs`; every route without one keeps its old budget.

## The cost accepted

A figure is code the site has to keep working, and a post that uses one is no longer
only text. The island is one file of DOM code with no framework state; the layout is
geometry under test. elkjs adds a build-time
dependency licensed EPL-2.0 or GPL-3.0-or-later, and 1.5 MB to `node_modules` that
production never sees. Interactivity stays limited to figures: the first request to
put a form, a filter or a calculator in a post goes through ADR 0001 again.
