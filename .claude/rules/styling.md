---
paths:
  - "app/globals.css"
  - "app/layout.tsx"
  - "components/**"
  - "app/**"
  - "lib/layout.ts"
  - "lib/og.tsx"
  - "scripts/smoke.mjs"
  - "tests/chrome.test.ts"
---

## Styling

- **shadcn/ui on Tailwind CSS v4** ([ADR 0007](docs/adr/0007-the-site-is-built-on-shadcn-ui-and-tailwind.md)).
  Compose pages from Tailwind utilities and the components in `components/ui/`
  (shadcn/ui's button, badge, card, breadcrumb, kbd, copied in, no Radix) — not new
  CSS. `cn()` (lib/utils.ts) merges classes in server components only: **no `cn()`,
  `cva` or `*Variants` in a client component**, or tailwind-merge ships to every page
  (`components/ui/toggle.ts` and `StatusBadge` are plain strings for that reason).
- **Tokens** are CSS variables in `app/globals.css`, mapped by `@theme inline`:
  `background`, `foreground`, `card`, `muted`/`muted-foreground`, `accent` (a hover
  surface, not a colour), `border` (decorative), `input` (every control edge, ≥ 3:1),
  `ring`, and `brand` (the amber: links, current item, focus). Status and callouts:
  `success`, `warning`, `info`, `tip`, `important`, `caution`. Dark is the default
  (`#0A0B0D`), light is `#FFFFFF`; a stored `data-theme` wins, else the OS decides, and
  the `dark:` variant follows the same rule. The contrast ratios in `:root` are floors.
- **Component CSS** stays in globals.css only for what utilities would do worse:
  `.markdown` (posts and docs, over `@tailwindcss/typography`), code blocks and Shiki,
  tables, `.toc`, the docs and post grids, search results, the panel's figures, the
  skills board, the journey chart, the figures in a post (`.fig`, series colours are the
  status tokens in order, plus a marker shape per series), and the CV print sheet. The typography plugin's rules
  land in a later cascade layer than `components`, so the markdown, code and table
  overrides are unlayered. The only inline style sets a custom property for
  data-driven geometry (`style={{ "--x": `${pct}%` } as React.CSSProperties}`).
- **Widths**: `lib/layout.ts` — pages `max-w-7xl`, docs `max-w-[90rem]`, one gutter.
  Prose stops at `max-w-2xl`–`3xl` (a post's column is 46rem); lists and cards use the width.
- **A `{" "}` between the items of a flex line of facts**: flex ignores it, but search
  excerpts and screen readers otherwise read "28 July 2026838 words".
- **Faces** via `next/font/google` ([layout.tsx](app/layout.tsx)): Inter (`font-sans`,
  `--font-inter`) and Bricolage Grotesque (`font-display`, page titles only, never
  below ~26px); `font-mono` is the system monospace. Never `<link>` fonts.googleapis.com.
- **Icons**: interface icons are `components/ui/icons.tsx` (Lucide paths, server-rendered;
  lucide-react would make each one a client component), brand marks are `lib/icons.ts`.
- **Accessibility**: visible `:focus-visible` (2px `ring`); one `<main id="main">`, no
  `<footer>` inside it; targets ≥ 24×24 px; `border-input` on a control's only border;
  `prefers-reduced-motion` escapes; animate SVG `<g>` with `translate`, never `transform`.
- **Hooks the gates read**: `site-header`, `toc`, `figure.code`, `copy-btn`,
  `search-trigger`, `theme-toggle`, `filter-chip`, `sort-btn`, `jr-bar`, and for figures
  `figure[data-fig]`, `fig-plot`, `fig-mark`, `fig-key`, `fig-tip`. Keep them.
- **Rendered twice**: the docs sidebar and every "On this page" list exist as a rail for
  wide screens and a `<details>` for narrow ones, one displayed at a time — forcing a
  closed `<details>` open works in one engine and not the next.
- **JS budget** (`JS_BUDGET` in `scripts/smoke.mjs`): first-load gzip bytes per route at a
  baseline, +1 KB slack. A route without a figure never grows; a post with one has the
  island's cost added on purpose, through one shared post budget (`FIGURE_POST_BUDGET`)
  with the reason beside it, so a new post needs no line here.
- **CLS**: smoke holds < 0.01 at 375 px on `/`, `/writing/`, a post and `/about/`, < 0.1
  elsewhere. The panel's reserved height (`.panel-body`) is measured; re-measure when
  its content changes.
