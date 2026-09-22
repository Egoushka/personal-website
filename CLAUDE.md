# CLAUDE.md

Personal portfolio + blog for hrabovskyi.online. Next.js 16 App Router + React 19 +
TypeScript, **statically exported** and served by Caddy on a Hetzner VPS.

README.md covers setup, deploy secrets and DNS. This file covers the constraints that
break things if ignored.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # frontmatter + internal-link gate on content/posts/*.md
npm run typecheck  # tsc --noEmit
npm run build      # static export -> ./out  (the real verification step)
```

CI runs `validate → typecheck → build → caddy validate → lychee` on every PR and branch
([.github/workflows/ci.yml](.github/workflows/ci.yml)), and the same chain runs before the
deploy job touches the VPS. Run `npm run validate && npm run typecheck && npm run build`
locally before pushing.

No tests and no ESLint config. **`npm run build` is the gate** — it type-checks and renders
every route, so a broken component or a bad `content/posts/*.md` fails there. Run it after
any change. To check the built output like production:

```bash
cd out && python3 -m http.server 4321
```

`node_modules/` is not checked in; `npm install` first in a fresh clone.

## Hard constraint: `output: "export"` (next.config.mjs)

Production is plain files behind a file server. There is no Node runtime. So:

- No server actions, middleware, ISR, `revalidate`, rewrites, redirects, or `headers` in
  `next.config` (headers must go in [deploy/Caddyfile](deploy/Caddyfile)).
- **Route handlers DO work** — GET only, rendered to a static file at build. That is how
  `app/feed.xml/`, `app/atom.xml/` and `app/feed.json/` work. They need
  `export const dynamic = "force-static"`. Never `force-dynamic` — it hard-errors the build.
- **Metadata image routes (`opengraph-image.tsx`, `icon.tsx`) also work**, and also need
  an explicit `export const dynamic = "force-static"`, or the build fails with
  *"export const dynamic … not configured on route"*. `next/og` only supports flexbox — no
  CSS grid — and caps the bundle at 500 KB.
- No runtime env vars — anything dynamic must be resolved at build time.
- `next/image` optimization is off (`images.unoptimized`). Plain `<img>` or unoptimized `next/image` only.
- `trailingSlash: true`. Internal links must carry the slash: `/writing/`, `/writing/foo/`.
  A link to `/writing` costs a redirect and breaks under the static file server.
- Every dynamic segment needs `generateStaticParams` — see [app/posts/[slug]/page.tsx](app/posts/[slug]/page.tsx).

Node APIs (`fs`, `path` in [lib/posts.ts](lib/posts.ts)) are fine because they run at build time
in server components only. **Never import `lib/posts.ts` from a client component** — this
still holds, and matters more now that client components exist.

## Client components are allowed — sparingly

The site shipped **zero `'use client'`** until 2026-07-29. That is no longer true.
The rule now is *justify each one*, not *never*. Three exist:

| Component | Why it must be a client component |
|---|---|
| [Search.tsx](components/Search.tsx) | Pagefind's JS API + `<dialog>.showModal()` |
| [UsesStatus.tsx](components/UsesStatus.tsx) | fetches `/status.json` at view time; the build cannot know what is running |
| [TopicMap.tsx](components/TopicMap.tsx) | filter state shared by a graph and a list; hover/focus selection |
| [ProjectFilter.tsx](components/ProjectFilter.tsx) | topic filter over the project index |
| [PostFilter.tsx](components/PostFilter.tsx) | multi-select topic filter + sort order over the writing index |

- Static export still applies. A client component hydrates in the browser; it does
  not get a server. No server actions, no data fetching at request time.
- **Every one of them must render something useful before JS runs, or degrade to
  nothing.** `TopicMap`'s graph is in the static HTML and its text equivalent is a
  real `<ul>`; `UsesStatus` renders `null` when `/status.json` is missing or older
  than 48 hours; `ProjectFilter` and `PostFilter` server-render every project and
  every post, and filtering only *removes* rows while sorting only reorders them,
  so with JS off each page is a complete list. A client component whose absence
  leaves a blank hole does not belong on this site.
- **No `Math.random()` or `Date.now()` in render.** `TopicMap` derives its
  per-node animation delay from the node index for exactly this reason — a random
  value differs between server and client and breaks hydration.
- `components/Search.tsx` loads Pagefind's **JS API** (`/pagefind/pagefind.js`) via
  `new Function('return import(...)')` so the bundler leaves the path alone — that
  file only exists in `out/` after `next build`, so a static import fails the build.
- **`/pagefind/` does not exist under `npm run dev`.** Pagefind indexes `out/` after
  the build, so search is dead on the dev server *by design*. Test it with the
  `static` launch config (serves `./out` on :4321), not `npm run dev`.
- The dialog must stay **outside `<nav>`**. Inside it, result links land in the
  primary navigation landmark and inherit `.site-header nav a { display: inline-flex }`,
  which breaks every hit row.
- **Animating an SVG `<g>` uses the `translate` property, never `transform`.** A
  node's position is a `transform` *attribute*, which maps to the `transform`
  *property* — animating that property replaces the position and collapses every
  node onto the origin. `translate` composes on top of it. See `.graph-node`.
- **Nothing in the post grid may span rows.** A grid item placed across two
  auto-sized rows makes those rows grow to hold it, so the old header rail
  (`grid-row: 1 / span 2`, carrying topics and the contents list) pushed the
  post's date a quarter of a screen below its title. The post is a title block
  above a `.post-layout` — one row, sticky `.post-aside` in column one, the
  article in column two — and the section numbers moved out of the margin into
  the headings (`.sect-mark`), because the sidebar owns that column now.
- **The contents list's scroller is `.post-aside`, not `.toc`.** Chrome's
  `::details-content` puts a box between them that `display: contents` does not
  remove, so a `max-height` on the `<ol>` is a height the wrapper overflows
  freely. The scroll-spy that marks the reader's position is a plain script, not
  a client component — hydrating every post for thirty lines of DOM work is not
  worth it — and everything it sets (`aria-current`, `--toc-y`, `--toc-h`) is
  decoration over links that already work.
- **A closed `<details>` with `display: contents` no longer shows its content.**
  Chrome 131 gave `<details>` a real `::details-content` pseudo-element and moved
  the closed state onto it as `content-visibility: hidden`, which `display:
  contents` on the parent does not bypass. The desktop table of contents relied
  on that trick and was invisible for months. `globals.css` forces
  `::details-content { content-visibility: visible }` above 900px.

## Where things live

- **Site content is data, not JSX.** Projects, experience, skills, homelab entries, links
  all live in [lib/site.ts](lib/site.ts) as typed exports. Components in `components/` map over
  them and are ~20–30 lines each. Adding a project = edit `lib/site.ts`, not `Projects.tsx`.
- **Blog posts** are `content/posts/*.md` with frontmatter `title, date (YYYY-MM-DD),
  description, topics`, plus optional `spanDays` — the length in days of the stretch the piece
  is *about*, which the post page sets its word count against. [lib/posts.ts](lib/posts.ts) reads them at
  build time; the filename is the slug. Nothing to register.
- **One vocabulary covers everything.** [lib/topics.ts](lib/topics.ts) is the only taxonomy: a `Post`,
  a `Project` and a `Job` all reference the same slugs, which is what lets
  `/topics/<slug>/` gather posts, projects *and paid roles* on one page. It replaced
  three separate lists (`lib/tags.ts`, `lib/skills.ts`, and a loose `skills` string
  array), which is why ".NET" used to exist as three unrelated strings. A topic with
  `graph` coordinates appears on the stack diagram; one without simply does not.
- **The readings are computed, never typed.** [lib/readings.ts](lib/readings.ts) counts posts, words,
  ages and the code-to-prose ratio from `content/posts`, `lib/site.ts` and the source
  tree, at build time. Any page printing a figure imports it from there rather than
  restating it, so a page and a claim cannot drift. A hand-maintained number is a claim
  pretending to be evidence. Figures that genuinely cannot be counted here live in
  `Project.readings` and **each names its source**. It reads the filesystem and the
  build clock: **never import it from a client component.**
- **Three faces, two of them webfonts**, self-hosted by `next/font/google` in
  [app/layout.tsx](app/layout.tsx): Inter as `--font-prose` → `--prose` (body, h3, everything read
  at length) and Bricolage Grotesque as `--font-display` → `--display` (h1, h2,
  `.post-row > a`, `.project-name`), variable, asked for at 600. `--figure` and `--code`
  are system monospace with no webfont. **`--display` never goes below ~26px** — below
  that it is a grotesk beside a grotesk and the reader has downloaded a second font for
  nothing, which is why h3 is still Inter. No Cyrillic subset: non-latin falls through to
  the system UI face. Do not add a `<link>` to fonts.googleapis.com — it puts a
  render-blocking cross-origin request back on the critical path and loses the
  `size-adjust` fallback that keeps CLS at 0 (measured: 0.0002).
- **One modular type scale**, `--step--2` … `--step-5` at the top of
  [app/globals.css](app/globals.css): fluid `clamp()` between a 360px and a 1280px viewport,
  ratio 1.200 → 1.250 upward and a flat 1.180 for the two descending steps.
  **The steps are primitives — never reference them outside `:root`.** Use the semantic
  aliases (`--fs-rail`, `--fs-code`/`--fs-small`, `--fs-body`, `--fs-h3`, `--fs-title`,
  `--fs-h2`, `--fs-h1`, `--fs-display`), and when a size is missing, add an alias rather
  than a number. Every clamp keeps a `rem` term so text still grows under browser zoom
  (WCAG 1.4.4) — a pure-`vw` font-size would fail it. Leading is picked by *measure*, not
  taste (`--lh-flat` … `--lh-body`), and no prose block exceeds 66ch.
  **`@media print` redeclares all eight steps in `pt`**, because the `vw` term resolves
  against the paper width and would silently resize the one-page CV.
- **All styling is one global stylesheet**, [app/globals.css](app/globals.css) — CSS variables at `:root`,
  plain class names (`.sheet`, `.ledger-row`, `.entry-line`). No Tailwind, no CSS modules, no
  styled-components. **No inline `style={{}}`** — add a class instead.
- **Six colour tokens**: `--paper`, `--ink`, `--ink-2`, `--rule`, `--rule-firm`, `--accent`.
  Warm paper, one amber accent, and the accent means **link** — do not use it to
  decorate. The contrast ratios in `:root` are computed, not estimated, and are floors
  a replacement has to clear. Figures set in `--figure` need
  `font-variant-numeric: tabular-nums`.
- **Primary nav is Writing · Projects · About · CV**, in [components/Nav.tsx](components/Nav.tsx). The design
  before this one had *no* navigation by explicit rule — the home page was a trial
  balance and every page was reached by opening the claim it was evidence for. It was
  coherent and unusable by a stranger, who cannot navigate by claims they do not know
  exist. [components/PageHead.tsx](components/PageHead.tsx) opens each page with its title and its own counted figures.
- **The ledger is gone and is not coming back** — see [docs/adr/0002](docs/adr/0002-keep-the-computed-figures-drop-the-ledger.md). What went with it:
  claims, a balance column, an `--open` colour, and **expiries that strike a page
  through in public**. There is no cadence committed for this site, so nothing on it
  scores itself against a deadline.
- **Accessibility invariants** — these were failures that got fixed; don't regress them:
  `:focus-visible` must stay visible (never `outline: none` without a replacement); every
  page needs `<main id="main">` for the skip link; interactive targets stay ≥24×24px
  (WCAG 2.5.8); `--border-strong` (not `--border`) on anything whose border is the only
  boundary of a control; anything animated needs a `prefers-reduced-motion` escape.
- `@/*` path alias maps to the repo root.
- `app/sitemap.ts` and `app/robots.ts` generate `/sitemap.xml` and `/robots.txt` at build.
- **OG cards** come from `lib/og.tsx` via `opengraph-image.tsx` routes. next/og writes them
  as **extensionless files**, so `deploy/Caddyfile` sets `Content-Type: image/png` for
  `/opengraph-image` and `/writing/*/opengraph-image` — without that every scraper rejects
  the card. The card's colours are hard-coded there: a card renders once at build and has
  no access to the stylesheet, so keep them in step with the tokens by hand.
- **JSON-LD** lives in [components/JsonLd.tsx](components/JsonLd.tsx): `Person` + `WebSite` on the homepage,
  `BlogPosting` + `BreadcrumbList` on posts, `ProfilePage` on `/cv/`. Stable `@id`s let
  the per-page graphs reference the Person rather than repeat it. `knowsAbout` is derived
  from the topics jobs and projects actually reference, so the structured data cannot
  claim more than the visible pages do.
- **Routes moved on 2026-08 and the old URLs are redirected in [deploy/Caddyfile](deploy/Caddyfile)**, because a
  static export cannot redirect: `/posts/*` → `/writing/*`, `/tags/*` → `/topics/*`,
  `/blog/` → `/writing/`, `/resume/` → `/cv/`, and `/now/` + `/uses/` → `/about/`. They use
  `handle` blocks rather than bare `redir` — bare directives get sorted into Caddy's own
  order and `try_files` rewrites the path before the matcher ever runs.
- **Post heading anchors** use `rehype-slug`. The TOC in `lib/posts.ts` uses
  **`github-slugger`** — the same slugger — on purpose: a hand-rolled version produced
  `secrets-config` where rehype-slug produced `secrets--config`, silently breaking anchors.

## Deploy — push to main is a live deploy

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and `rsync --delete`s `out/` to the VPS on every
push to `main`, then `docker compose up -d`. Pushing to `main` publishes the site. Get
explicit approval before pushing; don't touch `deploy/` or the workflow casually.

**Prelive is `:81` in the same Caddyfile**, served from `/srv-prelive` and published
to the tailnet only — [.github/workflows/prelive.yml](.github/workflows/prelive.yml) builds with `SITE_URL` set
(which is what keeps its comment threads out of production's) and rsyncs to
`/opt/stacks/website/prelive/`. It deliberately does **not** ship `deploy/Caddyfile`:
that file carries the `:80` block, so pushing it from a branch would reconfigure the
live site pre-merge. Both site blocks share one `(site)` snippet — never let them
drift, or prelive stops being a test of production. See the Prelive section of
[README.md](README.md).

The container Caddy ([deploy/Caddyfile](deploy/Caddyfile)) is **plain HTTP on :80**, published to the
tailnet at `100.64.0.2:8090`. TLS, the public hostname and the `www` redirect belong to the
edge — do not add `tls`, a hostname block, or a redirect to `deploy/Caddyfile`.

**The edge is Traefik, not Caddy.** `/opt/stacks/headscale/Caddyfile` is dead config; no
such container runs. Routing lives in `/opt/stacks/pangolin/config/traefik/dynamic_config.yml`
(`watch: true`, so edits apply live).

**A Caddyfile change needs `rsync --inplace` and an explicit `caddy reload`.** It is a
single-file bind mount, so a normal rsync gives it a new inode the container never sees,
and `docker compose up -d` is a no-op when the compose spec has not changed.

**Cloudflare is in front of all of it** (`server: cloudflare` on every live response), which
the README's DNS section previously did not say. It rewrites `robots.txt`, can strip or add
response headers, and gates AI crawlers via AI Crawl Control. See
the Deploy section of [README.md](README.md) before debugging anything header- or
crawler-related.


## Publishing

- **Drafts live in `content/drafts/`**, published posts in `content/posts/`. Only the
  latter is built. Moving a file between them is a deliberate, reviewed act — the
  `/post` skill writes drafts and is forbidden from writing to `content/posts/`.
- **`.claude/skills/post`** drafts in the site's voice; **`.claude/skills/review-post`**
  critiques one adversarially before it ships. Both name the two published posts as
  the voice reference rather than restating it.
- **Topics are a closed vocabulary** in [lib/topics.ts](lib/topics.ts). `npm run validate` fails on
  anything outside it, and `/topics/<slug>/` is generated only for topics a post,
  project or job actually references — an empty hub is worse than a 404.
  Adding a topic means editing that file *and* `public/admin/config.yml`.
- **Sveltia CMS at `/admin/`** — a static SPA that talks to the GitHub API directly,
  so it never touches the build or the static export. The bundle is **vendored**
  (`npm run cms:vendor`, runs in `npm run build`) rather than loaded from a CDN,
  because the CSP is `script-src 'self'`. It is 2.2 MB — the "~300 KB" figure in
  circulation is wrong. **It needs no OAuth worker**: "Sign In Using Access Token"
  takes a fine-grained GitHub PAT held in the browser's localStorage, so there is
  no client secret anywhere in this repo, on the server, or in CI.
