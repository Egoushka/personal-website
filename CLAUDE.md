# CLAUDE.md

Portfolio + blog for hrabovskyi.online: Next.js 16 App Router, React 19, TypeScript,
**statically exported**, served by Caddy on a Hetzner VPS behind Cloudflare. README.md
covers setup, deploy and DNS; this file covers what breaks if ignored. Code comments
state the current constraint and why; history belongs in commits and [ADRs](docs/adr/).

## Commands

```bash
npm ci
npm run dev          # http://localhost:3000 — no search: /pagefind/ exists only after a build
npm run validate     # frontmatter, topics, internal and #fragment links in content/posts
npm run typecheck    # tsc --noEmit
npm test             # node:test over tests/**/*.test.ts; add tests/<area>.test.ts
npm run build        # images -> next build -> pagefind; static export to ./out
npm run check        # assertions over ./out
npm run serve:prod   # ./out behind deploy/Caddyfile in Docker on http://127.0.0.1:8080
npm run caddy-test   # redirects, cards, 404s, CSP and cache headers, against serve:prod
npm run smoke        # Playwright + axe against BASE_URL (default http://localhost:8080)
```

Before pushing: `npm run validate && npm run typecheck && npm test && npm run build && npm run check`.
No ESLint. **Test the build the way production serves it**: `serve:prod` (`SITE_PORT`,
`CADDY_IMAGE`) has the real CSP, headers, redirects and 404s; `python3 -m http.server`
has none. Re-run it after every build — the container keeps the deleted `out/` mounted.
`BASE_URL=https://hrabovskyi.online npm run caddy-test` tests the live site.

CI ([ci.yml](.github/workflows/ci.yml)), every PR and every branch but `main`: validate
→ typecheck → test → build → check → caddy validate → caddy-test → smoke → lychee.
Post-build steps run even after one fails, so one red run lists every failing gate.

## Hard constraint: `output: "export"`

No Node runtime in production. No server actions, middleware, ISR, `revalidate`, or
rewrites/redirects/`headers` in `next.config` — those go in [deploy/Caddyfile](deploy/Caddyfile).
Route handlers (the feeds) and `opengraph-image.tsx` need `export const dynamic =
"force-static"`; `next/og` is flexbox only, 500 KB max. No runtime env vars: `SITE_URL`
is read once at build in `lib/site.ts`. `images.unoptimized`. `trailingSlash: true`, so
internal links carry the slash (`/writing/foo/`). Every dynamic segment has
`generateStaticParams` (see [app/writing/[slug]/page.tsx](app/writing/[slug]/page.tsx)).

## Client components — justify each one

Thirteen files carry `"use client"` (`grep -rl '"use client"' components lib app`):

| File | Why it needs the browser |
|---|---|
| [Search.tsx](components/Search.tsx) | Pagefind's JS API, `<dialog>.showModal()`, ⌘K/Ctrl+K |
| [ThemeToggle.tsx](components/ThemeToggle.tsx) | theme choice in `localStorage`; follows the OS while none is stored |
| [PostEnhancements.tsx](components/PostEnhancements.tsx) | code Copy button, contents current-section mark; renders nothing |
| [Comments.tsx](components/Comments.tsx) | loads Remark42 from `/c/` as the section nears the viewport |
| [PostFilter.tsx](components/PostFilter.tsx) | multi-select topic filter and sort over `/writing/` |
| [ProjectFilter.tsx](components/ProjectFilter.tsx) | topic filter over `/projects/` |
| [Panel.tsx](components/Panel.tsx) | home instrument panel from `/status.json` |
| [UsesStatus.tsx](components/UsesStatus.tsx) | live box state on `/about/` from `/status.json` |
| [Measured.tsx](components/Measured.tsx) | measured editor-time share beside a skill |
| [SkillsBoard.tsx](components/SkillsBoard.tsx) | skills search box, measured shares |
| [Journey.tsx](components/Journey.tsx) | hover/focus selection, below-the-fold draw-in |
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
- **Pagefind loads by native `import()`** with the URL in a variable and
  `webpackIgnore`/`turbopackIgnore` comments. Never `new Function` or eval: the CSP has
  no `'unsafe-eval'` and never gets one. The dialog stays outside `<nav>`.

## Where things live

- **`<Shell current?>`** ([Shell.tsx](components/Shell.tsx)) wraps every page: header and
  footer outside the one `<main id="main">`. Nav: **Writing · Projects · About · CV**;
  Skills is linked from About and the CV. Every page's metadata comes from
  `pageMetadata()` ([lib/metadata.ts](lib/metadata.ts)); posts and projects pass
  `ownCard: true` to keep their own `opengraph-image`.
- **Content is data** in [lib/site.ts](lib/site.ts): projects, jobs, skills, uses,
  `site.timezone`, optional `site.engagement`. Home lists running projects that are not
  side projects, plus side projects with `featured: true`. `Project.writeup` names a
  published post (validated).
- **Dates**: `Job.start`/`Job.end` are `"YYYY-MM"`, end inclusive, `null` = present.
  [lib/dates.ts](lib/dates.ts) is the only parser; add helpers there. Absolute dates
  only — no "N days ago".
- **Posts**: `content/posts/<slug>.md`, frontmatter `title`, `date` (quoted `YYYY-MM-DD`,
  not future), `description`, `topics`, optional `spanDays`, `updated`, `correction`
  (needs `updated`; both for factual changes only). [lib/markdown.mjs](lib/markdown.mjs)
  parses for both `lib/posts.ts` and the validator, so word counts and heading ids
  (`rehype-slug`, `github-slugger`) cannot disagree. Code blocks: Shiki ([lib/highlight.ts](lib/highlight.ts)).
- **Topics**: [lib/topics.ts](lib/topics.ts) is the one closed vocabulary for posts,
  projects and jobs; keep its `export const TOPICS = {` / `} as const satisfies` markers
  (the validator slices between them). A hub with < 2 items is `noindex` and out of the
  sitemap (`app/sitemap.ts` and `app/topics/[topic]/page.tsx` both hold the threshold).
- **Readings are computed** ([lib/readings.ts](lib/readings.ts), ADR 0002). A figure the
  build cannot count names its source (`Project.readings`). Nothing renders its own staleness.
- **JSON-LD** ([JsonLd.tsx](components/JsonLd.tsx)): every graph carries the Person
  (`@id …/#person`); `knowsAbout` comes from `skills` in `lib/site.ts`. Feeds carry full
  HTML bodies with absolute links.
- `/status.json` is written on the box by cron (homelab-gitops);
  `tests/fixtures/status.json` is a complete document for local runs.

## Styling

- **One stylesheet**, [app/globals.css](app/globals.css), plain class names; no Tailwind,
  modules or CSS-in-JS. The only inline style sets a custom property for data-driven
  geometry (`style={{ "--x": `${pct}%` } as React.CSSProperties}`), read by a class.
- **Seven colour tokens**: `--paper`, `--ink`, `--ink-2`, `--rule` (decorative only),
  `--rule-firm` (every control edge), `--accent` (links only), `--warn` (only "this
  broke"). Dark is default, cool near-black `#0A0B0D`; light is `#FFFFFF`. The contrast
  ratios in `:root` are computed floors.
- **Faces** via `next/font/google` ([layout.tsx](app/layout.tsx)): Inter (`--prose`) and
  Bricolage Grotesque (`--display`, h1/h2/list titles, never below ~26px); `--figure`
  and `--code` are system monospace (`tabular-nums` on figures). Inter preloads Latin;
  its Cyrillic face loads by `unicode-range` on demand. Bricolage has no Cyrillic and
  falls through to the system face. Never `<link>` fonts.googleapis.com.
- **Type scale**: `--step-*` are primitives, never used outside `:root` and `@media print`
  (which redeclares them in `pt`). Use `--fs-*` aliases; add one rather than a number.
  Clamps keep a `rem` term (WCAG 1.4.4).
- **Accessibility**: visible `:focus-visible`; one `<main id="main">`; targets ≥ 24×24 px;
  `--rule-firm` on a control's only border; `prefers-reduced-motion` escapes; animate SVG
  `<g>` with `translate`, never `transform` (it replaces the position attribute).
- **Post layout**: title block above `.post-layout` (sticky `.post-aside`, then the
  article); nothing spans rows. `.post-aside` is the contents scroller. Above 900px
  `::details-content { content-visibility: visible }` keeps the `display: contents`
  `<details>` visible in Chrome ≥ 131. `.prose` is a subgrid of `.wrap`: never in a `.row`.
- **CLS**: smoke holds < 0.01 at 375 px on `/`, `/writing/`, a post and `/about/`, < 0.1
  elsewhere. The panel's reserved heights are measured; re-measure when its content changes.

## Caddy, Cloudflare, deploy

- **A push to `main` is a live deploy** ([deploy.yml](.github/workflows/deploy.yml)): CI
  minus smoke, `X-Site-Rev` stamped, a three-pass rsync (`/_next/` additive → Caddyfile
  `--inplace` → the rest with `--delete`), optional Cloudflare purge, then `caddy-test`
  live. Get explicit approval before pushing to `main`.
- The key is `webdeploy`, forced to `rrsync -wo /opt/stacks/website`: no shell, no docker.
  **No `caddy reload` or `docker compose up -d`** — Caddy `--watch` reloads within a second,
  and a file that fails to load keeps the old config. `--inplace` matters: the Caddyfile
  is a single-file bind mount.
- The Caddyfile is plain HTTP: `:80` production, `:81` prelive, one shared `(site)`
  snippet — never let them drift. No `tls`, hostname or www redirect (the edge is Traefik,
  `/opt/stacks/pangolin/config/traefik/dynamic_config.yml`). Each header in one place;
  never add `'unsafe-eval'` or an origin to the CSP.
- **Header matchers that name files carry `file`**, or a 404 inherits them (`/404.html`
  served as `image/png`; missing chunks pinned `immutable` for a year). `@html` matches
  directories and is the exception. OG cards are extensionless, so a new card route needs
  its path in `@ogimages`; `lib/og.tsx` colours are hard-coded copies of the tokens.
- **Redirects** (`/posts/*`, `/tags/*`, `/blog/`, `/resume/`, `/now/`, `/uses/`, `/links/`)
  are `handle` blocks with `redir * <to> permanent`: bare `redir` sorts after `try_files`,
  and without `*` the target parses as a matcher.
- **Prelive** ([prelive.yml](.github/workflows/prelive.yml)), every same-repo PR: builds with
  `SITE_URL=http://100.64.0.2:8091`, rsyncs with `PRELIVE_SSH_KEY` after a dry-run guard
  (`deploy/prelive-guard.sh`), never ships the Caddyfile; fails early without the secret.
  `probe.yml` checks the live site and `/status.json` every 6 h. `deploy/deploy.sh` is the
  manual path; it refuses with `SITE_URL` set or a dirty tree. Compose, cron and the
  Remark42 container belong to homelab-gitops.

## Publishing

Drafts live in `content/drafts/` (not built); moving one to `content/posts/` is a
deliberate, reviewed act. `/post` writes drafts only; `/review-post` critiques before
shipping. No CMS: an editor plus `/post`, or GitHub's web editor as a PR against
`content/drafts/` (ADR 0004). Comments are Remark42 at `/c/`, lazy-loaded, a bounded
exception to ADR 0001 (ADR 0005).
