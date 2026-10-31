---
paths:
  - "components/**"
  - "app/**"
  - "lib/status.ts"
  - "lib/platform.ts"
---

## Client components — justify each one

Fifteen files carry `"use client"` (`grep -rl '"use client"' components lib app`):

| File | Why it needs the browser |
|---|---|
| [Search.tsx](components/Search.tsx) | Pagefind's JS API, `<dialog>.showModal()`, ⌘K/Ctrl+K, one Umami `search` event per finished search |
| [ThemeToggle.tsx](components/ThemeToggle.tsx) | theme choice in `localStorage`; follows the OS while none is stored |
| [PostEnhancements.tsx](components/PostEnhancements.tsx) | code Copy button, contents current-section mark; renders nothing |
| [FigureEnhancements.tsx](components/FigureEnhancements.tsx) | the shim for the figures' draw-in, hover/focus values and legend toggles (ADR 0010): `import()`s [figure-island.ts](components/figure-island.ts), a lazy chunk, and renders nothing; the post page passes it to `Prose`, which mounts it only when the post has a figure |
| [Comments.tsx](components/Comments.tsx) | loads Remark42 from `/c/` as the section nears the viewport |
| [PostFilter.tsx](components/PostFilter.tsx) | multi-select topic and project filter and sort over `/writing/` |
| [ProjectFilter.tsx](components/ProjectFilter.tsx) | topic and public-repository filters over `/projects/`; grouping is `lib/project-rows.ts` |
| [Panel.tsx](components/Panel.tsx) | home instrument panel from `/status.json` |
| [UsesStatus.tsx](components/UsesStatus.tsx) | live box state on `/about/` from `/status.json` |
| [Measured.tsx](components/Measured.tsx) | measured editor-time share beside a skill |
| [SkillsBoard.tsx](components/SkillsBoard.tsx) | skills search box, measured shares |
| [Journey.tsx](components/Journey.tsx) | hover/focus selection, below-the-fold draw-in |
| [MiraForm.tsx](components/MiraForm.tsx) | `/mira/` signup: `fetch` to the listmonk form endpoint so the download links replace the form |
| [PrintCv.tsx](components/PrintCv.tsx) | print button named for the platform's shortcut |
| [lib/status.ts](lib/status.ts) | `useStatus()`, the shared `/status.json` fetch |

- **Each renders something true before JS, or nothing.** Filters server-render every row
  and only remove or reorder; under `@media (scripting: none)` the filters, Copy and both
  header controls are hidden and every list is complete. `useStatus()` is `undefined`
  while loading (and in static HTML), `null` when missing, older than 48 h or malformed.
- **Never value-import `lib/posts.ts`, `lib/readings.ts` or `lib/site.ts` in a client
  file** (`import type` is fine). Whatever a client component receives ships in the
  payload: pass server-built rows (`PostRow`, `ProjectRow`, `JourneyRow`, `BoardData`).
- No `Date.now()`, `Math.random()`, `localStorage` or `matchMedia` during render.
  Platform detection is in `lib/platform.ts`.
- **Figures are the one interactivity ADR 0001 allows in a post** (ADR 0010), and only
  through that island: it reads the `data-*` attributes and classes `components/Figure.tsx`
  writes and imports nothing of `lib/figures.mjs`. A route's client components are in its
  first-load JS whether or not they render, so only the shim is static; never import a
  figure client file into `Prose`, which docs and methods share (the post page passes it
  in as `island`). The figure is complete without it
  (final-state SVG, data table, edge list); draw-in is armed only below the fold and
  never under `prefers-reduced-motion`; no storage, no analytics event, no request.
- **Pagefind loads by native `import()`** with the URL in a variable and
  `webpackIgnore`/`turbopackIgnore` comments. Never `new Function` or eval: the CSP has
  no `'unsafe-eval'` and never gets one. The dialog stays outside `<nav>`.
