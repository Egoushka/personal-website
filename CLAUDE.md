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
npm run validate -- --drafts   # the same over content/drafts (local: drafts are gitignored)
npm run new -- <kind> <slug>   # a draft from its skeleton, and its evidence pack
npm run evidence -- <slug>     # every figure the post states has a source in its pack
npm run docs:pull -- <project> [ref]   # copy a tool's docs from its repo at a commit (ADR 0006)
npm run docs:verify            # the copies match their commits byte for byte (network; CI runs it)
npm run docs:check -- <dir>    # a tool's docs directory against the contract, before it is pushed
npm run typecheck    # tsc --noEmit
npm test             # node:test over tests/**/*.test.ts; add tests/<area>.test.ts
npm run build        # images -> next build -> pagefind; static export to ./out
npm run check        # assertions over ./out
npm run serve:prod   # ./out behind deploy/Caddyfile in Docker on http://127.0.0.1:8080
npm run caddy-test   # redirects, cards, 404s, CSP and cache headers, against serve:prod
npm run smoke        # Playwright + axe against BASE_URL (default http://localhost:8080)
```

Before pushing: `npm run validate && npm run typecheck && npm test && npm run build && npm run check`.

**The repo is public.** Enable the hooks once per clone: `git config core.hooksPath
.githooks`, and copy `.private-terms.example` to `.private-terms` (gitignored). They block
private terms in files and commit messages, run gitleaks, and require a GitHub noreply
address; CI's `secrets` job checks the same. The origin IP, employer internals and local
paths never go in a file, a commit message or a PR.
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
| [PostFilter.tsx](components/PostFilter.tsx) | multi-select topic and project filter and sort over `/writing/` |
| [ProjectFilter.tsx](components/ProjectFilter.tsx) | topic and public-repository filters over `/projects/`; grouping is `lib/project-rows.ts` |
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
  footer outside the one `<main id="main">`; `width="wide"` for the docs. Nav:
  **Writing · Projects · Docs · About · CV**; Skills is linked from About and the CV.
  Every page's metadata comes from
  `pageMetadata()` ([lib/metadata.ts](lib/metadata.ts)); posts and projects pass
  `ownCard: true` to keep their own `opengraph-image`. Every `<Link>` but the primary nav
  and the home CTA sets `prefetch={false}`: prefetch fetched other routes' payloads on
  every scroll of a list.
- **Content is data** in [lib/site.ts](lib/site.ts): projects, jobs, skills, uses,
  `site.timezone`, optional `site.engagement`. Home lists running projects that are not
  side projects, plus side projects with `featured: true`. `Project.writeup` names a
  published post (validated).
- **Dates**: `Job.start`/`Job.end` are `"YYYY-MM"`, end inclusive, `null` = present.
  [lib/dates.ts](lib/dates.ts) is the only parser; add helpers there. Absolute dates
  only — no "N days ago".
- **Posts**: `content/posts/<slug>.md`, frontmatter `title`, `date` (quoted `YYYY-MM-DD`,
  not future), `description`, `topics`, optional `spanDays`, `updated`, `correction`
  (needs `updated`; both for factual changes only), and `cyrillic` (`"uk"`/`"ru"`,
  required once the title or prose has Cyrillic; never guessed — `ок` is both).
  [lib/lang.ts](lib/lang.ts) marks those runs with `lang`, `Project.cyrillic` does it per
  term for project text, and `npm run check` fails on unmarked Cyrillic. [lib/markdown.mjs](lib/markdown.mjs)
  parses for both `lib/posts.ts` and the validator, so word counts and heading ids
  (`rehype-slug`, `github-slugger`) cannot disagree. Code blocks: Shiki ([lib/highlight.ts](lib/highlight.ts)).
- **Topics**: [lib/topics.ts](lib/topics.ts) is the one closed vocabulary for posts,
  projects and jobs; keep its `export const TOPICS = {` / `} as const satisfies` markers
  (the validator slices between them). A hub with < 2 items is `noindex` and out of the
  sitemap (`app/sitemap.ts` and `app/topics/[topic]/page.tsx` both hold the threshold);
  `/notes/` follows the same rule (`app/notes/page.tsx`).
- **Readings are computed** ([lib/readings.ts](lib/readings.ts), ADR 0002). A figure the
  build cannot count names its source (`Project.readings`). Nothing renders its own staleness.
- **JSON-LD** ([JsonLd.tsx](components/JsonLd.tsx)): every graph carries the Person
  (`@id …/#person`); `knowsAbout` comes from `skills` in `lib/site.ts`. Feeds carry full
  HTML bodies with absolute links.
- `/status.json` is written on the box by cron (homelab-gitops);
  `tests/fixtures/status.json` is a complete document for local runs.

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
  skills board, the journey chart, and the CV print sheet. The typography plugin's rules
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
  `search-trigger`, `theme-toggle`, `filter-chip`, `sort-btn`, `jr-bar`. Keep them.
- **Rendered twice**: the docs sidebar and every "On this page" list exist as a rail for
  wide screens and a `<details>` for narrow ones, one displayed at a time — forcing a
  closed `<details>` open works in one engine and not the next.
- **CLS**: smoke holds < 0.01 at 375 px on `/`, `/writing/`, a post and `/about/`, < 0.1
  elsewhere. The panel's reserved height (`.panel-body`) is measured; re-measure when
  its content changes.

## Caddy, Cloudflare, deploy

- **A push to `main` is a live deploy** ([deploy.yml](.github/workflows/deploy.yml)): CI
  minus smoke, `X-Site-Rev` stamped, the build (with the stamped Caddyfile) published to
  the `deploy-site` release, which the box pulls every 2 min and installs in three passes
  (homelab-gitops `host/website-pull.sh`: `/_next/` additive → Caddyfile in place → the
  rest with `--delete`), a wait for the live `build.txt`, optional Cloudflare purge, then
  `caddy-test` live. Get explicit approval before pushing to `main`.
- Nothing here reaches the VPS: no SSH key, no deploy user. **No `caddy reload` or
  `docker compose up -d`** — Caddy `--watch` reloads within a second, and a file that
  fails to load keeps the old config. The pull writes the Caddyfile in place: it is a
  single-file bind mount.
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
  `SITE_URL=http://100.64.0.2:8091` and publishes `out/` to the `deploy-prelive` release,
  which the box mirrors into the prelive root; never ships the Caddyfile. `probe.yml`
  checks the live site and `/status.json` every 6 h. The manual path is re-running
  `deploy.yml` from the Actions tab. Compose, cron, the pull script and the Remark42
  container belong to homelab-gitops.

## Docs

A project's docs are written in **its own repository** and copied here at a commit
([ADR 0006](docs/adr/0006-docs-are-written-where-the-code-is.md)): `content/docs/<project>/`
holds the copy, `content/docs/sources.json` says from where. Never edit the copy — change
the docs in the tool's repo, then `npm run docs:pull`. What that directory must look like
is [docs/project-docs.md](docs/project-docs.md): flat, `.md` only; `title` (≤ 48),
`description` (≤ 160), a unique integer `order`, an optional `section` from the closed
list in `lib/doc-check.mjs` (Get started, Guides, Concepts, Reference, Project), and
`cyrillic` once a page has Cyrillic; `index.md` first, no `# heading`. The rules live in
`lib/doc-check.mjs`, shared by `npm run validate` and `npm run docs:check`.
The site renders them as a docs site (`components/DocView.tsx`): the sidebar groups
pages by section, Previous/Next follow it, and `/docs/` lists every project with docs.
GitHub's `> [!NOTE]` alert syntax renders as a callout (`lib/callouts.mjs`), a fence
takes a `title="…"`, and `##`/`###` fill "On this page". Relative links to other pages
stay on the site; links to other repo files go to GitHub at the pinned commit
(`lib/doc-links.mjs`). Tables go through `lib/tables.ts`: each sits in a focusable
scroll region, and one with a cell over 60 characters is a "text table" that stacks
into labelled cards below 700px. A "Status" column of works / partial / not yet gets a
shape (● ◐ ○) as well as the word.

## Publishing

Posts follow [docs/writing/README.md](docs/writing/README.md): a `kind` (finding,
incident, build, note — a short post, ADR 0009), a `project` when the post is about one (a project's write-up must
name it), a one-sentence thesis and an evidence pack before any prose. Drafts live in `content/drafts/` (not built, gitignored: the repo is public); moving one
to `content/posts/` is a deliberate, reviewed act. `/post` writes drafts only; `/review-post` critiques before
shipping. No CMS: an editor plus `/post`, or GitHub's web editor as a PR that adds the
post to `content/posts/` (ADR 0004). Comments are Remark42 at `/c/`, lazy-loaded, a bounded
exception to ADR 0001 (ADR 0005).
